// --- routes/aiWebhookRoutes.js ---
// VERSION: FINAL FIXED (Handles Slots, Cleaning, and Order)

const express = require("express");
const axios = require("axios");
const router = express.Router();
const mongoose = require("mongoose");

// ====================================================================
// --- 1. SET YOUR MANUAL VALUES HERE ---
// ====================================================================

// ✅ YOUR CORRECT HOSPITAL ID
const HOSPITAL_ID = "67dd317314b7277ff78e37b8"; 

// ✅ YOUR HOSPITAL NAME
const HOSPITAL_NAME = "Apple";

// --- 2. CHECK YOUR MODEL PATHS ---
const Admin = require("../model/adminModel"); 
const opdModel = require("../model/opdModel"); 
const Doctor = require("../model/Doctor"); // Ensure this path is correct
// ====================================================================

// --- CLEANING FUNCTIONS ---

const cleanGender = (raw) => {
  if (!raw) return "Other";
  const lower = raw.toString().toLowerCase();
  if (lower.includes("female") || lower.includes("girl") || lower.includes("woman")) return "Female";
  if (lower.includes("male") || lower.includes("boy") || lower.includes("man") || lower.includes("made")) return "Male";
  return "Other";
};

const cleanPhoneNumber = (raw) => {
  if (!raw) return "";
  // Remove everything except digits
  return raw.toString().replace(/\D/g, ""); 
};

// ✅ CRITICAL FIX: Removes double spaces (e.g. "9:30  PM")
const cleanSlotFormat = (raw) => {
  if (!raw) return "";
  let clean = raw.toString().toLowerCase();
  // 1. Replace "to" with "-"
  clean = clean.replace(/\s+to\s+/g, " - ");
  // 2. Fix p.m. / a.m.
  clean = clean.replace(/p\.?m\.?/g, " PM").replace(/a\.?m\.?/g, " AM");
  // 3. Fix spacing around hyphen
  if (clean.includes("-") && !clean.includes(" - ")) {
      clean = clean.replace("-", " - ");
  }
  // 4. Remove double spaces (The fix for your error)
  return clean.replace(/\s+/g, " ").toUpperCase().trim();
};

// --- HELPER FUNCTIONS ---
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const [time, period] = timeStr.trim().split(/\s+/); 
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr);
  let minute = parseInt(minuteStr);
  
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const formatTime = (totalMinutes) => {
  let hour = Math.floor(totalMinutes / 60);
  let minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hour}:${minuteStr} ${period}`;
};

const generateTimeSlots = (startTimeStr, endTimeStr) => {
  const startMinutes = parseTime(startTimeStr);
  const endMinutes = parseTime(endTimeStr);
  const slotDuration = 3 * 60; 
  const slots = [];
  for (let currentStart = startMinutes; currentStart < endMinutes; currentStart += slotDuration) {
    const currentEnd = currentStart + slotDuration;
    const slotEnd = Math.min(currentEnd, endMinutes);
    if (slotEnd > currentStart) {
      slots.push(`${formatTime(currentStart)} - ${formatTime(slotEnd)}`);
    }
  }
  return slots;
};

const checkDuplicateLogic = async (fullName, hospitalId) => {
  try {
    const now = new Date();
    const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDate = todayIST.toISOString().split("T")[0]; 
    const existingEntry = await opdModel.findOne({
      fullName,
      hospitalId,
      appointmentDate: todayDate,
    });
    return existingEntry ? true : false;
  } catch (error) {
    console.error("Webhook Error checking duplicates:", error);
    return false;
  }
};

// ====================================================================
// --- MAIN WEBHOOK ROUTE ---
// ====================================================================

router.post("/webhook", async (req, res) => {
  const action = req.body.queryResult.action;
  const params = req.body.queryResult.parameters;
  const queryText = req.body.queryResult.queryText;
  const outputContexts = req.body.queryResult.outputContexts || [];
  const session = req.body.session;

  console.log("------------------------------------------------");
  console.log(`AI Webhook: User said="${queryText}"`); 
  console.log("------------------------------------------------");

  if (action === "handle-booking-logic") {
    try {
      
      // --- FLOW 1: INITIALIZATION (Ask for Slots) ---
      if (!params.preferredSlot) {
        console.log("AI Webhook: Fetching initial data...");
        const hospital = await Admin.findById(HOSPITAL_ID);
        if (!hospital) return res.json({ fulfillmentText: "Error: Hospital data not found." });

        // Generate Slots
        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        const doctorMap = { "any": null }; // Dummy doctor map since we skip selection

        // Numbered list for speech
        const numberedSlots = slots.map((s, index) => `${index + 1}. ${s}`).join(", ");
        const speech = `Our available slots are: ${numberedSlots}. Please say the number, for example 1 or 2.`;

        return res.json({
          fulfillmentText: speech, 
          outputContexts: [
            {
              name: `${session}/contexts/session-vars`,
              lifespanCount: 50,
              parameters: {
                rawSlots: slots, // Save for mapping "1" -> "9:30..."
                doctorMap: doctorMap
              }
            }
          ]
        });
      }
      
      // --- FLOW 2: SUBMISSION (All Data Collected) ---
      // Triggered when symptoms are filled (last question)
      else if (params.symptoms) {
        console.log("AI Webhook: Booking...");
        
        const rawName = (typeof params.fullName === 'object') ? params.fullName.name : params.fullName;
        const emailAddress = (params.email && typeof params.email === 'object') ? params.email.email : params.email;
        
        // --- 1. RESOLVE SLOT NUMBER TO STRING ---
        let resolvedSlot = params.preferredSlot;
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        
        if (sessionVars && sessionVars.parameters.rawSlots) {
            const slotIndex = parseInt(params.preferredSlot); 
            if (!isNaN(slotIndex) && slotIndex > 0) {
                // Map "1" to index 0
                const mappedSlot = sessionVars.parameters.rawSlots[slotIndex - 1];
                if (mappedSlot) resolvedSlot = mappedSlot;
            }
        }

        // --- 2. CLEAN DATA ---
        const fullName = rawName; 
        const gender = cleanGender(params.gender); 
        const contactNumber = cleanPhoneNumber(params.contactNumber); 
        const preferredSlot = cleanSlotFormat(resolvedSlot);

        console.log("Booking Cleaned:", { gender, contactNumber, preferredSlot });

        // Duplicate Check
        const isDuplicate = await checkDuplicateLogic(fullName, HOSPITAL_ID);
        if (isDuplicate) {
          return res.json({
            fulfillmentText: `I'm sorry, an appointment for ${fullName} already exists today.`,
            outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
          });
        }

        const formData = {
          fullName,
          age: params.age,
          gender, 
          contactNumber,
          email: emailAddress || null, 
          address: "Booked via AI Agent",
          symptoms: params.symptoms,
          hospitalId: HOSPITAL_ID,
          hospitalName: HOSPITAL_NAME,
          selectedDoctor: null, // Skip doctor selection
          preferredSlot, 
        };

        let speech = "";
        try {
          const response = await axios.post(
            `${process.env.RENDER_EXTERNAL_URL}/opd/${HOSPITAL_ID}`,
            formData
          );
          speech = response.data.message + ". Thank you. Goodbye.";
        } catch (apiError) {
          console.error("API Error:", apiError.response?.data);
          // If the API fails, give a clear message
          speech = apiError.response?.data?.message || "I'm sorry, that slot is no longer available or the data format was incorrect. Please try again.";
        }

        return res.json({
          fulfillmentText: speech,
          outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
        });
      }
      
      // --- FLOW 3: MIDDLE QUESTIONS (Safety Net) ---
      else {
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        if (sessionVars) {
          return res.json({
            outputContexts: [{
                name: `${session}/contexts/session-vars`,
                lifespanCount: 50,
                parameters: sessionVars.parameters
            }]
          });
        }
        return res.json({});
      }

    } catch (error) {
      console.error("Webhook Error:", error);
      return res.json({ fulfillmentText: "System error. Please call back." });
    }
  } else {
    return res.json({ fulfillmentText: "Unknown action." });
  }
});

module.exports = router;