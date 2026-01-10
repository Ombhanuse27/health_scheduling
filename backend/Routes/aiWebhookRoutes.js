// --- routes/aiWebhookRoutes.js ---
// VERSION: FINAL FIXED (Handles Slots, Cleaning, and Pre-Booking Whitelist)

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
const Doctor = require("../model/Doctor"); 
const PreBooking = require("../model/PreBooking"); // ✅ NEW: Pre-booking model
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
  // Remove everything except digits, take last 10 for matching
  let clean = raw.toString().replace(/\D/g, ""); 
  return clean.slice(-10);
};

// ✅ CRITICAL FIX: Removes double spaces (e.g. "9:30  PM")
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

// --- HELPER FUNCTIONS (Untouched) ---
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
// --- NEW: API TO REGISTER INTENT (Called by React Frontend) ---
// ====================================================================
router.post("/register-call-intent", async (req, res) => {
  try {
    // We accept Name, Age, Gender, Phone from Website
    const { fullName, contactNumber, age, gender } = req.body;
    const cleanPhone = cleanPhoneNumber(contactNumber);

    await PreBooking.findOneAndUpdate(
      { phoneNumber: cleanPhone },
      { 
        fullName, 
        age,
        gender,
        hospitalId: HOSPITAL_ID, 
        hospitalName: HOSPITAL_NAME,
        createdAt: new Date() 
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ====================================================================
// --- MAIN WEBHOOK ROUTE ---
// ====================================================================

router.post("/webhook", async (req, res) => {
  const action = req.body.queryResult.action;
  const params = req.body.queryResult.parameters;
  const queryText = req.body.queryResult.queryText;
  const outputContexts = req.body.queryResult.outputContexts || [];
  const session = req.body.session;

  // Get Caller ID from Telephony Payload
  const originalPayload = req.body.originalDetectIntentRequest?.payload;
  const rawCallerId = originalPayload?.telephony?.caller_id || "";
  const callerPhone = cleanPhoneNumber(rawCallerId);

  console.log("------------------------------------------------"); 
  console.log(`AI Webhook: Action=${action} | Caller=${callerPhone}`); 
  console.log("------------------------------------------------");

  try {

    // --- FLOW A: WELCOME (CHECK WHITELIST) ---
    // Make sure to enable "Webhook call" for Default Welcome Intent in Dialogflow
    if (action === "input.welcome") {
        
        // 1. Check if user is Pre-Booked
        const preBooking = await PreBooking.findOne({ phoneNumber: callerPhone });

        if (!preBooking) {
            // ❌ REJECT CALL IF NOT REGISTERED
            return res.json({
                fulfillmentText: `I'm sorry, your number is not registered for ${HOSPITAL_NAME}. Please visit our website to book your appointment. Goodbye.`,
                outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
            });
        }

        // ✅ USER FOUND: Generate slots to present them immediately
        const hospital = await Admin.findById(HOSPITAL_ID);
        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        const numberedSlots = slots.map((s, index) => `${index + 1}. ${s}`).join(", ");

        // INJECT DATA into context so Dialogflow skips Name/Age/Gender questions
        return res.json({
            fulfillmentText: `Hello ${preBooking.fullName}. Welcome to ${HOSPITAL_NAME}. The available slots are: ${numberedSlots}. Please say the slot number you prefer.`,
            outputContexts: [
                {
                    name: `${session}/contexts/session-vars`,
                    lifespanCount: 50,
                    parameters: {
                        // These match your Dialogflow Entity Names
                        fullName: { name: preBooking.fullName },
                        age: preBooking.age,
                        gender: preBooking.gender,
                        contactNumber: callerPhone,
                        
                        // Helpers
                        rawSlots: slots,
                        doctorMap: { "any": null }
                    }
                }
            ]
        });
    }

    // --- FLOW B: BOOKING LOGIC ---
    if (action === "handle-booking-logic") {
      
      // 1. If Slot Not Yet Selected (Fallback if Welcome logic didn't catch it)
      if (!params.preferredSlot) {
        // ... (Your existing logic for fetching slots if context is missing) ...
        // Note: With the new Welcome flow, we usually won't hit this, but keeping it for safety.
        const hospital = await Admin.findById(HOSPITAL_ID);
        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        const numberedSlots = slots.map((s, index) => `${index + 1}. ${s}`).join(", ");
        return res.json({
          fulfillmentText: `Our available slots are: ${numberedSlots}. Please say the number.`, 
          outputContexts: [
            {
              name: `${session}/contexts/session-vars`,
              lifespanCount: 50,
              parameters: { rawSlots: slots }
            }
          ]
        });
      }
      
      // 2. SUBMISSION (Slot + Diagnosis Collected)
      else if (params.diagnosis) {
        console.log("AI Webhook: Finalizing Booking...");
        
        // --- RETRIEVE DATA FROM CONTEXT OR PARAMS ---
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        const contextParams = sessionVars?.parameters || {};

        // Name/Age/Gender: Prefer Context (from DB), fallback to Voice Params
        let rawName = contextParams.fullName || params.fullName;
        if (typeof rawName === 'object') rawName = rawName.name;

        const age = contextParams.age || params.age;
        const rawGender = contextParams.gender || params.gender;
        const rawPhone = contextParams.contactNumber || params.contactNumber; // Use verified caller ID
        const rawEmail = params.email ? (typeof params.email === 'object' ? params.email.email : params.email) : null;

        // Slot Resolution
        let resolvedSlot = params.preferredSlot;
        if (contextParams.rawSlots) {
            const slotIndex = parseInt(params.preferredSlot); 
            if (!isNaN(slotIndex) && slotIndex > 0) {
                const mappedSlot = contextParams.rawSlots[slotIndex - 1];
                if (mappedSlot) resolvedSlot = mappedSlot;
            }
        }

        // --- CLEAN DATA ---
        const fullName = rawName; 
        const gender = cleanGender(rawGender); 
        const contactNumber = cleanPhoneNumber(rawPhone); 
        const preferredSlot = cleanSlotFormat(resolvedSlot);

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
          age: age, // Used from pre-booking
          gender, 
          contactNumber,
          email: rawEmail, 
          address: "Booked via AI Agent",
          diagnosis: params.diagnosis, // Collected LIVE on call
          hospitalId: HOSPITAL_ID,
          hospitalName: HOSPITAL_NAME,
          selectedDoctor: null,
          preferredSlot, 
        };

        let speech = "";
        try {
          const response = await axios.post(
            `${process.env.RENDER_EXTERNAL_URL}/api/opd/${HOSPITAL_ID}`,
            formData
          );
          speech = `Appointment confirmed for ${fullName} at ${preferredSlot}. Thank you. Goodbye.`;
        } catch (apiError) {
          console.error("API Error:", apiError.response?.data);
          speech = "I'm sorry, that slot is no longer available. Please try again.";
        }

        return res.json({
          fulfillmentText: speech,
          outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
        });
      }
      
      // 3. Safety Net
      else {
        return res.json({
            outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 50, parameters: sessionVars?.parameters }]
        });
      }

    } 
  } catch (error) {
      console.error("Webhook Error:", error);
      return res.json({ fulfillmentText: "System error. Please call back." });
  }
});

module.exports = router;