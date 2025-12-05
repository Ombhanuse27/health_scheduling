// --- routes/aiWebhookRoutes.js ---
// VERSION: NUMBERED SLOTS SUPPORT (User says "1" or "2" to pick time)

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
const Doctor = require("../model/Doctor"); 
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

// Fixes "9:30 p.m." -> "9:30 PM"
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
// --- MAIN WEBHOOK ROUTE (Dialogflow ES) ---
// ====================================================================

router.post("/webhook", async (req, res) => {
  const action = req.body.queryResult.action;
  const params = req.body.queryResult.parameters;
  const queryText = req.body.queryResult.queryText;
  const outputContexts = req.body.queryResult.outputContexts || [];
  const session = req.body.session;

  console.log(`AI Webhook: User said="${queryText}"`); 

  if (action === "handle-booking-logic") {
    try {
      
      // --- FLOW 1: INITIALIZATION (Ask for Slots by NUMBER) ---
      if (!params.preferredSlot) {
        console.log("AI Webhook: Fetching initial data...");
        const hospital = await Admin.findById(HOSPITAL_ID);
        if (!hospital) return res.json({ fulfillmentText: "Error: Hospital data not found." });

        const timeCheck = validateTimeLogic(hospital);
        if (!timeCheck.valid) return res.json({ fulfillmentText: timeCheck.message });

        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        const allDoctors = await Doctor.find({ hospitalId: HOSPITAL_ID });
        const doctorNames = allDoctors.map(d => d.fullName);
        
        let doctorMap = {};
        allDoctors.forEach(doc => { doctorMap[doc.fullName] = doc._id.toString(); });
        doctorMap["any"] = null; 
        doctorMap["any available"] = null;

        // ✅ LOGIC UPDATE: Create numbered list string (e.g., "1. 9:30 AM to 12:30 PM, 2. ...")
        const numberedSlots = slots.map((s, index) => `${index + 1}. ${s}`).join(", ");
        const speech = `Our available slots are: ${numberedSlots}. Please say the number, for example, say 1 or 2.`;

        return res.json({
          fulfillmentText: speech, 
          outputContexts: [
            {
              name: `${session}/contexts/session-vars`,
              lifespanCount: 50,
              parameters: {
                availableDoctors: [...doctorNames, "any available"].join(", "),
                doctorMap: doctorMap,
                rawSlots: slots // ✅ Save raw array to memory so we can map "1" back to the time string later
              }
            }
          ]
        });
      }

      // --- FLOW 2: SLOT CHOSEN (Ask for Doctor) ---
      else if (!params.selectedDoctor) {
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        const availableDoctors = sessionVars ? sessionVars.parameters.availableDoctors : "any available";
        const speech = `For that slot, available doctors are: ${availableDoctors}. Do you prefer one, or 'any available'?`;
        return res.json({ fulfillmentText: speech });
      }
      
      // --- FLOW 3: SUBMISSION (All Data Collected) ---
      else if (params.symptoms) {
        console.log("AI Webhook: Booking...");
        
        const rawName = (typeof params.fullName === 'object') ? params.fullName.name : params.fullName;
        const emailAddress = (params.email && typeof params.email === 'object') ? params.email.email : params.email;
        
        // --- 1. RESOLVE SLOT NUMBER TO STRING ---
        // The user might have said "1" or "2". We need to convert that back to "9:30 AM - 12:30 PM"
        let resolvedSlot = params.preferredSlot;
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        
        if (sessionVars && sessionVars.parameters.rawSlots) {
            // Check if input is a digit (e.g., "1", "2")
            const slotIndex = parseInt(params.preferredSlot); 
            if (!isNaN(slotIndex) && slotIndex > 0) {
                // Get the string from the saved array (Index 1 becomes array index 0)
                const mappedSlot = sessionVars.parameters.rawSlots[slotIndex - 1];
                if (mappedSlot) {
                    console.log(`Mapped Number "${params.preferredSlot}" to Slot: "${mappedSlot}"`);
                    resolvedSlot = mappedSlot;
                }
            }
        }

        // --- 2. CLEAN DATA ---
        const fullName = rawName; 
        const gender = cleanGender(params.gender); 
        const contactNumber = cleanPhoneNumber(params.contactNumber); 
        const preferredSlot = cleanSlotFormat(resolvedSlot); // Clean the resolved string

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

        const doctorMap = sessionVars ? sessionVars.parameters.doctorMap : {};
        const selectedDoctorId = doctorMap[params.selectedDoctor] || null;

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
          preferredSlot, // Use the resolved and cleaned slot
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
      
      // --- FLOW 4: SAFETY NET ---
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