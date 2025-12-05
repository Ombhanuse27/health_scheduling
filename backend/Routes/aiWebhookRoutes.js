// --- routes/aiWebhookRoutes.js ---
// VERSION: SERVER-SIDE SPEECH GENERATION (Fixes "Reading variable names")

const express = require("express");
const axios = require("axios");
const router = express.Router();
const mongoose = require("mongoose");

// ====================================================================
// --- 1. SET YOUR MANUAL VALUES HERE ---
// ====================================================================

// ✅ YOUR CORRECT HOSPITAL ID (Fixed: Removed the 'Y')
const HOSPITAL_ID = "67dd317314b7277ff78e37b8"; 

// ✅ YOUR HOSPITAL NAME
const HOSPITAL_NAME = "Apple";

// --- 2. CHECK YOUR MODEL PATHS ---
const Admin = require("../model/adminModel"); 
const Doctor = require("../model/Doctor"); 
const opdModel = require("../model/opdModel"); 
// ====================================================================

// --- HELPER FUNCTIONS ---
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(" ");
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
  // Use 'queryResult' for Dialogflow ES
  const action = req.body.queryResult.action;
  const params = req.body.queryResult.parameters;
  const queryText = req.body.queryResult.queryText;
  const outputContexts = req.body.queryResult.outputContexts || [];
  const session = req.body.session;

    console.log("------------------------------------------------");
  console.log(`AI Webhook: Action=${action}`);
  console.log(`User said: "${queryText}"`); // <--- THIS WILL SHOW IN LOGS
  console.log("Parameters:", JSON.stringify(params, null, 2));
  console.log("------------------------------------------------");

  if (action === "handle-booking-logic") {
    try {
      
      // --- FLOW 1: INITIALIZATION (Ask for Slots) ---
      // If preferredSlot is missing, fetch data and ASK THE USER from code.
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

        // ✅ FIX: The backend generates the FULL sentence.
        // This prevents Dialogflow from reading "#session-vars" literally.
        const speech = `Our available 3-hour slots are: ${slots.join(", ")}. Which do you prefer?`;

        return res.json({
          fulfillmentText: speech, // Dialogflow will speak this text
          outputContexts: [
            {
              name: `${session}/contexts/session-vars`,
              lifespanCount: 50,
              parameters: {
                availableDoctors: [...doctorNames, "any available"].join(", "),
                doctorMap: doctorMap
              }
            }
          ]
        });
      }

      // --- FLOW 2: SLOT CHOSEN (Ask for Doctor) ---
      // If slot is picked but doctor is not, ASK THE USER from code.
      else if (!params.selectedDoctor) {
        // Retrieve doctor list from memory
        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        const availableDoctors = sessionVars ? sessionVars.parameters.availableDoctors : "any available";

        // ✅ FIX: The backend generates the FULL sentence.
        const speech = `For that slot, available doctors are: ${availableDoctors}. Do you prefer one, or 'any available'?`;

        return res.json({
          fulfillmentText: speech 
        });
      }
      
      // --- FLOW 3: SUBMISSION (All Data Collected) ---
      else if (params.symptoms) {
        console.log("AI Webhook: Booking...");
        const fullName = (typeof params.fullName === 'object') ? params.fullName.name : params.fullName;
        
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

        const sessionVars = outputContexts.find(ctx => ctx.name.endsWith("session-vars"));
        const doctorMap = sessionVars ? sessionVars.parameters.doctorMap : {};
        const selectedDoctorId = doctorMap[params.selectedDoctor] || null;

        const formData = {
          fullName: fullName,
          age: params.age,
          gender: params.gender,
          contactNumber: params.contactNumber, 
          email: params.email || null,
          address: "Booked via AI Agent",
          symptoms: params.symptoms,
          hospitalId: HOSPITAL_ID,
          hospitalName: HOSPITAL_NAME,
          selectedDoctor: selectedDoctorId,
          preferredSlot: params.preferredSlot,
        };

        let speech = "";
        try {
          const response = await axios.post(
            `${process.env.RENDER_EXTERNAL_URL}/opd/${HOSPITAL_ID}`,
            formData
          );
          speech = response.data.message + ". Thank you. Goodbye.";
        } catch (apiError) {
          speech = apiError.response?.data?.message || "Slot is no longer available. Please try again.";
        }

        return res.json({
          fulfillmentText: speech,
          outputContexts: [{ name: `${session}/contexts/session-vars`, lifespanCount: 0 }] 
        });
      }
      
      // --- FLOW 4: MIDDLE QUESTIONS (Let Dialogflow handle Name, Age, etc.) ---
      return res.json({});

    } catch (error) {
      console.error("Webhook Error:", error);
      return res.json({ fulfillmentText: "System error. Please call back." });
    }
  } else {
    return res.json({ fulfillmentText: "Unknown action." });
  }
});

module.exports = router;