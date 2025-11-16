// --- routes/aiWebhookRoutes.js ---
// This is the complete, single file for your AI Calling Agent's logic.

const express = require("express");
const axios = require("axios");
const router = express.Router();
const mongoose = require("mongoose");

// ====================================================================
// --- 1. TODO: SET YOUR MANUAL VALUES HERE ---
// ====================================================================

// Paste the MongoDB _id of the *one* hospital this agent is for.
const HOSPITAL_ID = "Y67dd317314b7277ff78e37b8"; 

// Paste the name of the hospital (e.g., "Apollo Clinic")
const HOSPITAL_NAME = "Apple";

// --- 2. TODO: CHECK YOUR MODEL PATHS ---
// Adjust these `require` paths to match your project's folder structure.
const Admin = require("../model/adminModel"); 
const Doctor = require("../model/Doctor"); // Check this path, "modelM" might be a typo
const opdModel = require("../model/opdModel"); 
// ====================================================================


// ====================================================================
// --- HELPER FUNCTIONS ---
// These are copied *exactly* from your frontend code.
// This ensures your AI uses the *exact same logic* as your React app.
// ====================================================================

/**
 * Parses a time string (e.g., "9:30 AM" or "8:00 PM") into minutes since midnight.
 * @param {string} timeStr The time string to parse.
 * @returns {number} Total minutes from midnight.
 */
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr);
  let minute = parseInt(minuteStr);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }
  if (period === "AM" && hour === 12) {
    hour = 0; // Midnight
  }
  return hour * 60 + minute;
};

/**
 * Formats total minutes since midnight into a 12-hour time string (e.g., "9:30 AM").
 * @param {number} totalMinutes The total minutes from midnight.
 * @returns {string} A formatted time string.
 */
const formatTime = (totalMinutes) => {
  let hour = Math.floor(totalMinutes / 60);
  let minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";

  if (hour === 0) {
    hour = 12; // 12 AM (Midnight)
  } else if (hour > 12) {
    hour -= 12; // Convert to 12-hour format
  }

  const minuteStr = minute.toString().padStart(2, '0');
  return `${hour}:${minuteStr} ${period}`;
};

/**
 * Generates 3-hour time slots between a start and end time.
 * @param {string} startTimeStr The hospital's start time (e.g., "9:30 AM").
 * @param {string} endTimeStr The hospital's end time (e.g., "8:00 PM").
 * @returns {string[]} An array of formatted time slots.
 */
const generateTimeSlots = (startTimeStr, endTimeStr) => {
  const startMinutes = parseTime(startTimeStr);
  const endMinutes = parseTime(endTimeStr);
  const slotDuration = 3 * 60; // 3 hours in minutes
  const slots = [];

  for (let currentStart = startMinutes; currentStart < endMinutes; currentStart += slotDuration) {
    const currentEnd = currentStart + slotDuration;
    // Ensure the slot's end time does not exceed the hospital's closing time
    const slotEnd = Math.min(currentEnd, endMinutes);

    // Only add the slot if it's valid (end is after start)
    if (slotEnd > currentStart) {
      slots.push(`${formatTime(currentStart)} - ${formatTime(slotEnd)}`);
    }
  }
  return slots;
};

// ====================================================================
// --- LOGIC REPLICATION FROM YOUR FRONTEND/BACKEND ---
// This replicates your `checkDuplicate` and time validation logic
// exactly as specified in your `opdRoutes.js` and `OpdForm.js`.
// ====================================================================

/**
 * Re-implementation of your checkDuplicate API logic for the webhook.
 */
const checkDuplicateLogic = async (fullName, hospitalId) => {
  try {
    const now = new Date();
    const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDate = todayIST.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const existingEntry = await opdModel.findOne({
      fullName,
      hospitalId,
      appointmentDate: todayDate,
    });
    return existingEntry ? true : false;
  } catch (error) {
    console.error("Webhook Error checking duplicates:", error);
    return false; // Fail safe
  }
};

/**
 * Re-implementation of your frontend's time validation logic.
 */
const validateTimeLogic = (hospital) => {
  const hospitalOpenMinutes = parseTime(hospital.hospitalStartTime);
  const hospitalCloseMinutes = parseTime(hospital.hospitalEndTime);

  const now = new Date();
  const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentMinutes = todayIST.getHours() * 60 + todayIST.getMinutes();

  if (currentMinutes < hospitalOpenMinutes) {
    return { valid: false, message: `Sorry, our appointments don't start until ${hospital.hospitalStartTime}. Please call back then.` };
  } else if (currentMinutes > hospitalCloseMinutes) {
    return { valid: false, message: "Sorry, appointments are closed for today. Please call back tomorrow." };
  }
  return { valid: true, message: "Hospital is open." };
};


// ====================================================================
// --- MAIN WEBHOOK ROUTE ---
// This is the single endpoint Dialogflow will call.
// ====================================================================

router.post("/webhook", async (req, res) => {
  // Get the tag and parameters from Dialogflow
  const tag = req.body.fulfillmentInfo.tag;
  const params = req.body.sessionInfo.parameters;

  console.log(`AI Webhook: Tag=${tag}`);

  // We only have one tag, but we use 'if' statements to
  // manage the flow of the conversation.
  if (tag === "handle-booking-logic") {
    try {
      let speech = ""; // This is what the AI will say
      let sessionParams = {}; // This is to update Dialogflow's memory

      // --- FLOW 1: User just started. We need to fetch slots and doctors.
      // `preferredSlot` is the first question, so if it's missing, we are at the start.
      if (!params.preferredSlot) {
        console.log("AI Webhook: Fetching initial data...");
        const hospital = await Admin.findById(HOSPITAL_ID);
        if (!hospital) {
          speech = "I'm sorry, I can't find the hospital data. Please call back.";
          return res.json({ fulfillmentResponse: { messages: [{ text: { text: [speech] } }] } });
        }

        // 1. REPLICATE LOGIC: Run time validation (Are we open?)
        const timeCheck = validateTimeLogic(hospital);
        if (!timeCheck.valid) {
          speech = timeCheck.message; // "Sorry, we are closed."
          return res.json({ fulfillmentResponse: { messages: [{ text: { text: [speech] } }] } });
        }

        // 2. REPLICATE LOGIC: Generate 3-hour slots
        const slots = generateTimeSlots(hospital.hospitalStartTime, hospital.hospitalEndTime);
        
        // 3. REPLICATE LOGIC: Get doctors for this hospital
        const allDoctors = await Doctor.find({ hospitalId: HOSPITAL_ID });
        const doctorNames = allDoctors.map(d => d.fullName);
        
        // Create a map to convert "Dr. Smith" back to an ID later
        let doctorMap = {};
        allDoctors.forEach(doc => { doctorMap[doc.fullName] = doc._id.toString(); });
        doctorMap["any"] = null; // Add an "any" option
        doctorMap["any available"] = null;

        // This is the data we send back to Dialogflow's "memory"
        // Dialogflow will use this to ask the prompts we defined in Phase 2.
        sessionParams = {
          availableSlots: slots,
          availableDoctors: [...doctorNames, "any available"],
          doctorMap: doctorMap, // We save this to use when submitting
        };

        // We don't send speech, we just send the data.
        // Dialogflow will see the data and ask its *first question*.
        return res.json({
          sessionInfo: { parameters: { ...params, ...sessionParams } }
        });
      }
      
      // --- FLOW 2: All data is collected. Time to submit.
      // `symptoms` is the last parameter in our list.
      else if (params.symptoms) {
        console.log("AI Webhook: All data collected. Attempting to book...");

        const fullName = params.fullName.name || params.fullName; // @sys.person is {name: "..."}

        // 1. REPLICATE LOGIC: Check for Duplicates
        const isDuplicate = await checkDuplicateLogic(fullName, HOSPITAL_ID);
        if (isDuplicate) {
          speech = `I'm sorry, it looks like an appointment for "${fullName}" has already been booked at this hospital today. To book another, please use our website. Goodbye.`;
          return res.json({
            fulfillmentResponse: { messages: [{ text: { text: [speech] } }] },
            sessionInfo: { parameters: null } // Clears session, ends conversation
          });
        }

        // 2. REPLICATE LOGIC: Final Time Validation
        const hospital = await Admin.findById(HOSPITAL_ID);
        const timeCheck = validateTimeLogic(hospital);
        if (!timeCheck.valid) {
          speech = timeCheck.message + " Goodbye."; // "Sorry, we just closed"
          return res.json({ fulfillmentResponse: { messages: [{ text: { text: [speech] } }] } });
        }

        // 3. PREPARE & SUBMIT: Call your *own* API
        // Get the doctorMap from Dialogflow's memory
        const doctorMap = params.doctorMap;
        // Find the doctor's ID from the name the user spoke.
        // Use 'null' if they said 'any available'.
        const selectedDoctorId = doctorMap[params.selectedDoctor] || null;

        const formData = {
          fullName: fullName,
          age: params.age,
          gender: params.gender,
          contactNumber: params.contactNumber.toString(),
          email: params.email || null, // Email is optional
          address: "Booked via AI Agent", // Set a default
          symptoms: params.symptoms,
          hospitalId: HOSPITAL_ID,
          hospitalName: HOSPITAL_NAME,
          selectedDoctor: selectedDoctorId,
          preferredSlot: params.preferredSlot,
        };

        try {
          // --- THIS IS THE KEY ---
          // The AI agent calls your *own* API, just like your React app.
          // We must use the public Render URL from environment variables.
          const response = await axios.post(
            `${process.env.RENDER_EXTERNAL_URL}/opd/${HOSPITAL_ID}`,
            formData
          );

          // SUCCESS! Use the *exact* message from your API.
          speech = response.data.message; // e.g., "Appointment booked successfully at 9:40 AM"
          speech += ". Thank you for booking with us. Goodbye.";

        } catch (apiError) {
          console.error("Webhook failed to call booking API:", apiError.response?.data || apiError.message);
          // FAILED! Use the *exact error* from your API.
          speech = apiError.response?.data?.message || "I'm sorry, I wasn't able to book that. It seems that slot just filled up. Please try again.";
        }
        
        // Send the final response and end the conversation
        return res.json({
          fulfillmentResponse: { messages: [{ text: { text: [speech] } }] },
          sessionInfo: { parameters: null } // Clear session
        });
      }
      
      // --- FLOW 3: Conversation in progress.
      // This happens after one question is answered but before the last.
      // We don't need to do anything. Just send the parameters back.
      // Dialogflow will automatically ask the next prompt in the list.
      else {
        return res.json({
          sessionInfo: { parameters: params }
        });
      }

    } catch (error) {
      console.error("Webhook general error:", error);
      return res.json({
        fulfillmentResponse: { messages: [{ text: { text: ["I seem to be having a technical issue. Please call back later."] } }] }
      });
    }
  } else {
    // Fallback for any unknown tag
    return res.json({
      fulfillmentResponse: { messages: [{ text: { text: ["I'm sorry, I'm not sure how to handle that."] } }] }
    });
  }
});

module.exports = router;