// --- routes/aiWebhookRoutes.js ---
// VERSION: FINAL (Handles Custom Entities & Numbered Slots + DEBUG LOGGING)

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
// const Doctor = require("../model/doctorModel"); // Not needed anymore
const opdModel = require("../model/opdModel"); 
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
  return raw.toString().replace(/\D/g, ""); 
};

const cleanSlotFormat = (raw) => {
  if (!raw) return "";
  let clean = raw.toString().toLowerCase();
  clean = clean.replace(/\s+to\s+/g, " - ");
  clean = clean.replace(/p\.?m\.?/g, " PM").replace(/a\.?m\.?/g, " AM");
  if (clean.includes("-") && !clean.includes(" - ")) {
      clean = clean.replace("-", " - ");
  }
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

const validateTimeLogic = (hospital) => {
  const hospitalOpenMinutes = parseTime(hospital.hospitalStartTime);
  const hospitalCloseMinutes = parseTime(hospital.hospitalEndTime);
  const now = new Date();
  const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentMinutes = todayIST.getHours() * 60 + todayIST.getMinutes();

  if (currentMinutes < hospitalOpenMinutes) {
    return { valid: false, message: `Sorry, we don't open until ${hospital.hospitalStartTime}.` };
  } else if (currentMinutes > hospitalCloseMinutes) {
    return { valid: false, message: "Sorry, we are closed for today." };
  }
  return { valid: true, message: "Hospital is open." };
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

  // ✅ ADDED: Detailed Logging
  console.log("------------------------------------------------");
  console.log(`AI Webhook: Action=${action}`);
  console.log(`User said: "${queryText}"`); 
  console.log("Parameters:", JSON.stringify(params, null, 2));
  console.log("------------------------------------------------");

  if (action === "handle-booking-logic") {
    try {
      
      // --- FLOW 1: INITIALIZATION (Ask for Slots) ---
      if (!params.preferredSlot) {
        console.log("AI Webhook: Fetching slots...");
        const hospital = await Admin.findById(HOSPITAL_ID);
        if (!hospital) return res.json({ fulfillmentText: "Error: Hospital data not found." });

        const timeCheck = validateTimeLogic(hospital);
        if (!timeCheck.valid) return res.json({ fulfillmentText: timeCheck.message });

        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        
        const numberedSlots = slots.map((s, index) => `${index + 1}. ${s}`).join(", ");
        
        const speech = `Our available slots are: ${numberedSlots}. Please say the number, for example 1 or 2.`;

        return res.json({
          fulfillmentText: speech, 
          outputContexts: [
            {
              name: `${session}/contexts/session-vars`,
              lifespanCount: 50,
              parameters: {
                rawSlots: slots 
              }
            }
          ]
        });
      }
      
      // --- FLOW 2: SUBMISSION (All Data Collected) ---
      else if (params.symptoms) {
        console.log("AI Webhook: Booking...");
        
        const rawName = (typeof params.fullName === 'object') ? params.fullName.name : params.fullName;
        const emailAddress = (params.email && typeof params.email === 'object') ? params.email.email : params.email;
        
        // --- 1. RESOLVE SLOT NUMBER ---
        let resolvedSlot = params.preferredSlot;
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        
        if (sessionVars && sessionVars.parameters.rawSlots) {
            const slotIndex = parseInt(params.preferredSlot); 
            if (!isNaN(slotIndex) && slotIndex > 0) {
                const mappedSlot = sessionVars.parameters.rawSlots[slotIndex - 1];
                if (mappedSlot) resolvedSlot = mappedSlot;
            }
        }

        // --- 2. CLEAN DATA ---
        const fullName = rawName; 
        const gender = cleanGender(params.gender); 
        const contactNumber = cleanPhoneNumber(params.contactNumber); 
        const preferredSlot = cleanSlotFormat(resolvedSlot);

        console.log("Booking with cleaned data:", { gender, contactNumber, preferredSlot });

        const isDuplicate = await checkDuplicateLogic(fullName, HOSPITAL_ID);
        if (isDuplicate) {
          return res.json({
            fulfillmentText: `I'm sorry, an appointment for ${fullName} already exists today.`,
            outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
          });
        }

        const hospital = await Admin.findById(HOSPITAL_ID);
        const timeCheck = validateTimeLogic(hospital);
        if (!timeCheck.valid) return res.json({ fulfillmentText: timeCheck.message });

        const selectedDoctorId = null;

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
          selectedDoctor: selectedDoctorId,
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
          speech = apiError.response?.data?.message || "I'm sorry, that slot is no longer available. Please try a different time.";
        }

        return res.json({
          fulfillmentText: speech,
          outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
        });
      }
      
      // --- FLOW 3: MIDDLE QUESTIONS ---
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