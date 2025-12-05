const express = require("express");
const mongoose = require("mongoose");
const opdModel = require("../model/opdModel");
const Counter = require("../model/counterModel");
const Admin = require("../model/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios"); 
require("dotenv").config();

const brevo = require("@getbrevo/brevo");
const router = express.Router();

let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const FAST2SMS_API_KEY = "9OgY26Jj0QSCKr7iEqLGpbcRlFHTMeuw4BZxovU3Xtdy1Df5zANSqMjBkLDVHGJ8egTErwit3xOcXCvl";

// ====================================================================
// --- HELPER FUNCTIONS ---
// ====================================================================

// ✅ HELPER: Clean Phone Number
const cleanPhoneNumber = (raw) => {
  if (!raw) return "";
  return raw.toString().replace(/\D/g, ""); 
};

// ✅ HELPER: Clean Time Slot (Fixed Spacing Bug)
const cleanTimeSlot = (raw) => {
  if (!raw) return "";
  let clean = raw.toString().toLowerCase();
  
  // Replace " to " with " - "
  clean = clean.replace(/\s+to\s+/g, " - ");
  
  // Fix p.m. / a.m.
  clean = clean.replace(/p\.?m\.?/g, " PM").replace(/a\.?m\.?/g, " AM");
  
  // Ensure hyphen has spaces around it
  if (clean.includes("-") && !clean.includes(" - ")) {
    clean = clean.replace("-", " - ");
  }
  
  // ✅ FIX: Remove double spaces and trim
  return clean.replace(/\s+/g, " ").toUpperCase().trim();
};

// ✅ UPDATED: Flexible Regex for Time Parsing
const toMinutes = (time) => {
  if (!time || typeof time !== "string") return NaN;
  // Use \s* to allow 0 or more spaces between time and AM/PM
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return NaN;

  let hour = parseInt(match[1]);
  let minute = parseInt(match[2]);
  let period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
};

const parseSlotTime = (slot) => {
  if (!slot || typeof slot !== "string" || !slot.includes(" - ")) {
    throw new Error(`Invalid slot format: ${slot}`);
  }
  const [startStr, endStr] = slot.split(" - ").map((s) => s.trim());
  return { start: toMinutes(startStr), end: toMinutes(endStr), startStr, endStr };
};

const formatTime = (minutes) => {
  if (isNaN(minutes) || minutes < 0) return "Invalid Time";
  let hours = Math.floor(minutes / 60);
  let mins = String(minutes % 60).padStart(2, "0"); 
  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; 
  return `${hours}:${mins} ${period}`;
};

// ====================================================================
// --- ROUTES ---
// ====================================================================

router.post("/opd/:hospitalId", async (req, res) => {
  console.log("Raw Body Received:", req.body);

  try {
    const { hospitalId } = req.params;
    let { fullName, contactNumber, email, preferredSlot, selectedDoctor } = req.body;

    // --- 1. DATA SANITIZATION ---
    if (contactNumber) contactNumber = cleanPhoneNumber(contactNumber);
    if (preferredSlot) preferredSlot = cleanTimeSlot(preferredSlot);

    console.log("Cleaned Data:", { contactNumber, preferredSlot });

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }
    if (!preferredSlot || !preferredSlot.includes(" - ")) {
      return res.status(400).json({ message: `Invalid preferredSlot format. Got: ${preferredSlot}` });
    }

    // --- Time and Slot Calculation ---
    let start, end, startStr, endStr;
    try {
        const parsed = parseSlotTime(preferredSlot);
        start = parsed.start;
        end = parsed.end;
        startStr = parsed.startStr;
        endStr = parsed.endStr;
        
        // ✅ FIX: Guard against NaN (Invalid Time)
        if (isNaN(start) || isNaN(end)) {
             throw new Error("Time parsing failed");
        }
    } catch (parseError) {
        console.error("Time Parse Error:", parseError);
        return res.status(400).json({ message: "Could not understand the time slot format. Please try again." });
    }

    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const localDate = today.toLocaleDateString("en-CA");
    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();

    console.log(`Time Debug: Current=${currentTimeInMinutes}, Start=${start}, End=${end}`);

    // Check availability
    const existingAppointments = await opdModel
      .find({
        hospitalId,
        appointmentDate: localDate,
        preferredSlot: `${startStr} - ${endStr}`,
      })
      .sort({ appointmentTime: 1 });

    let nextSequentialTime = start;
    if (existingAppointments.length > 0) {
      const lastAppointment = existingAppointments[existingAppointments.length - 1];
      const lastMinutes = toMinutes(lastAppointment.appointmentTime);
      if (!isNaN(lastMinutes)) nextSequentialTime = lastMinutes + 20;
    }

    // Logic: Time must be later than (Now + 20 mins) AND later than (Slot Start)
    let appointmentTimeInMinutes = Math.max(nextSequentialTime, currentTimeInMinutes + 20);
    appointmentTimeInMinutes = Math.max(appointmentTimeInMinutes, start);

    if (appointmentTimeInMinutes >= end) {
      return res.status(400).json({
        message: `Sorry, no available slots in the ${preferredSlot} timeframe. Please try a later slot.`,
      });
    }

    const appointmentTimeStr = formatTime(appointmentTimeInMinutes);
    
    if (appointmentTimeStr === "Invalid Time") {
        return res.status(400).json({ message: "Error calculating appointment time." });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" }, { $inc: { seq: 1 } }, { new: true, upsert: true }
    );

    const newOpdEntry = new opdModel({
      fullName, 
      age: req.body.age,
      gender: req.body.gender,
      contactNumber, 
      email, 
      address: req.body.address,
      symptoms: req.body.symptoms,
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      appointmentNumber: counter.seq,
      appointmentDate: localDate,
      assignedDoctor: selectedDoctor || null, 
      appointmentTime: appointmentTimeStr,
      preferredSlot: `${startStr} - ${endStr}`,
      selectedDoctor: selectedDoctor || null,
    });

    await newOpdEntry.save();
    await Admin.findByIdAndUpdate(hospitalId, { $push: { opdForms: newOpdEntry._id } }, { new: true });

    // --- NOTIFICATIONS (Fire & Forget) ---
    const emailData = {
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email: email, name: fullName }],
        subject: "Appointment Confirmation",
        textContent: `Dear ${fullName},\n\nConfirmed: ${localDate} at ${appointmentTimeStr}. Token: ${counter.seq}.`
    };

    if (email) {
      apiInstance.sendTransacEmail(emailData).catch(e => console.error("Email fail:", e));
    } else if (contactNumber) {
      axios.get("https://www.fast2sms.com/dev/bulkV2", {
        headers: { "authorization": FAST2SMS_API_KEY },
        params: { message: emailData.textContent, language: "english", route: "q", numbers: contactNumber }
      }).catch(e => console.error("SMS fail:", e.message));
    }

    res.status(201).json({
      message: `Appointment booked successfully at ${appointmentTimeStr}`,
      appointment: newOpdEntry,
    });

  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
});

// ... [Keep all other routes (checkDuplicate, dashboard, etc.) unchanged] ...
// (Paste the rest of your file here: checkDuplicate, dashboard, doctor/opd, delete, put)

router.post("/checkDuplicate", async (req, res) => {
  const { fullName, hospitalId } = req.body;
  try {
    const now = new Date();
    const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDate = todayIST.toISOString().split("T")[0]; 
    const existingEntry = await opdModel.findOne({ fullName, hospitalId, appointmentDate: todayDate });
    if (existingEntry) {
      return res.status(200).json({ exists: true, message: "This patient already has an appointment today." });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ error: "Server error." });
  }
});

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id; 
    if (!mongoose.Types.ObjectId.isValid(adminId)) return res.status(400).json({ error: "Invalid Admin ID" });
    const opdRecords = await opdModel.find({ hospitalId: adminId });
    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/doctor/opd", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const opdRecords = await opdModel.find({ "assignedDoctor": doctorId });
    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/opd/:id", authMiddleware, async (req, res) => {
  try {
    const deletedRecord = await opdModel.findByIdAndDelete(req.params.id);
    if (!deletedRecord) return res.status(404).json({ message: "OPD record not found" });
    res.status(200).json({ message: "OPD record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/opd/:id/prescription", async (req, res) => {
  const { base64Data, contentType, diagnosis, medication, advice } = req.body;
  try {
    const updated = await opdModel.findByIdAndUpdate(
      req.params.id,
      { prescriptionPdf: { data: base64Data, contentType }, diagnosis, medication, advice },
      { new: true }
    );
    res.json({ message: "Prescription saved", data: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to save prescription" });
  }
});

module.exports = router;