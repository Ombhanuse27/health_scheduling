const express = require("express");
const mongoose = require("mongoose");
const opdModel = require("../model/opdModel");
const Counter = require("../model/counterModel");
const Admin = require("../model/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios"); // ✅ ADDED: Required for Fast2SMS
require("dotenv").config();

// ✅ Brevo SDK
const brevo = require("@getbrevo/brevo");

const router = express.Router();

// ✅ Brevo API setup
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ✅ Fast2SMS API Key
const FAST2SMS_API_KEY = "9OgY26Jj0QSCKr7iEqLGpbcRlFHTMeuw4BZxovU3Xtdy1Df5zANSqMjBkLDVHGJ8egTErwit3xOcXCvl";

// ✅ Converts time string to minutes
const toMinutes = (time) => {
  if (!time || typeof time !== "string") return NaN;

  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return NaN;

  let hour = parseInt(match[1]);
  let minute = parseInt(match[2]);
  let period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
};

// ✅ Parses slot times correctly
const parseSlotTime = (slot) => {
  if (!slot || typeof slot !== "string" || !slot.includes(" - ")) {
    throw new Error(`Invalid slot format: ${slot}`);
  }

  const [startStr, endStr] = slot.split(" - ").map((s) => s.trim());
  return { start: toMinutes(startStr), end: toMinutes(endStr), startStr, endStr };
};

// ✅ Converts minutes back to time string
const formatTime = (minutes) => {
  if (isNaN(minutes) || minutes < 0) return "Invalid Time";

  let hours = Math.floor(minutes / 60);
  let mins = String(minutes % 60).padStart(2, "0"); // Two-digit minutes
  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM, 12 PM remains 12

  return `${hours}:${mins} ${period}`;
};

// --- POST: Book Appointment ---
router.post("/opd/:hospitalId", async (req, res) => {
  console.log(req.body);

  try {
    const { hospitalId } = req.params;
    const { fullName, contactNumber, email, preferredSlot, selectedDoctor } = req.body;

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }
    if (!preferredSlot || typeof preferredSlot !== "string") {
      return res.status(400).json({ message: "Invalid preferredSlot format." });
    }

    // --- Time and Slot Calculation ---
    const { start, end, startStr, endStr } = parseSlotTime(preferredSlot);

    // Get today's date in IST
    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const localDate = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format

    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();
    console.log(`Current time in minutes (IST): ${currentTimeInMinutes}`);

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
      const lastAppointmentTimeInMinutes = toMinutes(lastAppointment.appointmentTime);

      if (!isNaN(lastAppointmentTimeInMinutes)) {
        nextSequentialTime = lastAppointmentTimeInMinutes + 20;
      }
    }

    const earliestTimeFromNow = currentTimeInMinutes + 20;
    let appointmentTimeInMinutes = Math.max(nextSequentialTime, earliestTimeFromNow);
    appointmentTimeInMinutes = Math.max(appointmentTimeInMinutes, start);

    if (appointmentTimeInMinutes >= end) {
      return res.status(400).json({
        message: `Sorry, no available slots in the ${preferredSlot} timeframe. Please try a later slot.`,
      });
    }

    const appointmentTimeStr = formatTime(appointmentTimeInMinutes);

    // Get next appointment number
    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const newOpdEntry = new opdModel({
      ...req.body,
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      appointmentNumber: counter.seq,
      appointmentDate: localDate,
      assignedDoctor: selectedDoctor || null, 
      appointmentTime: appointmentTimeStr,
      preferredSlot: `${startStr} - ${endStr}`,
      assignedDoctor: selectedDoctor || null,
    });

    await newOpdEntry.save();

    await Admin.findByIdAndUpdate(
      hospitalId,
      { $push: { opdForms: newOpdEntry._id } },
      { new: true }
    );

    // ============================================================
    // ✅ UPDATED NOTIFICATION LOGIC (Email OR SMS)
    // ============================================================
    
    // LOGIC: If Email is present, send Email. 
    // ONLY if Email is NOT present, proceed to send SMS.
    if (email) {
      // 1. If Email exists -> Send Brevo Email
      try {
        await apiInstance.sendTransacEmail({
          sender: { email: process.env.EMAIL_FROM },
          to: [{ email: email, name: fullName }],
          subject: "Appointment Confirmation",
          textContent: `Dear ${fullName},\n\nYour appointment is confirmed:\n📅 Date: ${localDate}\n🕒 Time: ${appointmentTimeStr}\n🔢 Appointment Number: ${counter.seq}\n\nThank you for choosing our service.`,
        });
        console.log("Confirmation Email sent via Brevo.");
      } catch (emailError) {
        console.error("Error sending Email:", emailError);
      }
    } else if (contactNumber) {
      // 2. If NO Email but Contact Number exists -> Send SMS via Fast2SMS
      try {
        const message = `Dear ${fullName}, Appt Confirmed! Date: ${localDate}, Time: ${appointmentTimeStr}, Token: ${counter.seq}.`;
        
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            headers: {
                "authorization": FAST2SMS_API_KEY
            },
            params: {
                "message": message,
                "language": "english",
                "route": "q", // 'q' = Quick SMS route (Best for alerts)
                "numbers": contactNumber.toString()
            }
        });
        console.log("Confirmation SMS sent via Fast2SMS.");
      } catch (smsError) {
        console.error("Error sending SMS:", smsError.message);
      }
    }

    res.status(201).json({
      message: `Appointment booked successfully at ${appointmentTimeStr}`,
      appointment: newOpdEntry,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

router.post("/checkDuplicate", async (req, res) => {
  const { fullName, hospitalId } = req.body;

  try {
    const now = new Date();
    const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDate = todayIST.toISOString().split("T")[0]; 

    const existingEntry = await opdModel.findOne({
      fullName,
      hospitalId,
      appointmentDate: todayDate,
    });

    if (existingEntry) {
      return res.status(200).json({
        exists: true,
        message: "This patient already has an appointment today in this hospital.",
      });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ error: "Server error while checking duplicates." });
  }
});

// Get all OPD records for Admin
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    console.log("Request received at /dashboard");
    const adminId = req.user.id; 

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid Admin ID" });
    }

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
    console.error("Error in /doctor/opd:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete OPD Record by ID
router.delete("/opd/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await opdModel.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ message: "OPD record not found" });
    }

    res.status(200).json({ message: "OPD record deleted successfully" });
  } catch (error) {
    console.error("Error deleting OPD record:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/opd/:id/prescription", async (req, res) => {
  const { base64Data, contentType, diagnosis, medication, advice } = req.body;
  try {
    const updated = await opdModel.findByIdAndUpdate(
      req.params.id,
      {
        prescriptionPdf: {
          data: base64Data, 
          contentType: contentType, 
        },
        diagnosis,
        medication,
        advice,
      },
      { new: true }
    );
    res.json({ message: "Prescription saved", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save prescription" });
  }
});

module.exports = router;