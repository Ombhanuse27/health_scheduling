const express = require("express");
const mongoose = require("mongoose");
const opdModel = require("../model/opdModel");
const Counter = require("../model/counterModel");

const Admin = require("../model/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();
// ⛔️ REMOVED: const nodemailer = require("nodemailer");
// ✅ ADDED: Brevo SDK
const brevo = require("@getbrevo/brevo");

const router = express.Router();

// ✅ ADDED: Brevo API setup
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY // Make sure this is set in Render
);

// ⛔️ REMOVED: Nodemailer transporter
// const transporter = nodemailer.createTransport({ ... });

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

// Helper functions (toMinutes, parseSlotTime, formatTime) remain the same.

router.post("/opd/:hospitalId", async (req, res) => {
  console.log(req.body);

  try {
    const { hospitalId } = req.params;
    const { fullName, contactNumber, email, preferredSlot,selectedDoctor } = req.body;

    // ... (Validation, Time Calculation, and Database logic remains unchanged) ...
    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }
    if (!preferredSlot || typeof preferredSlot !== "string") {
      return res.status(400).json({ message: "Invalid preferredSlot format." });
    }

    // --- Time and Slot Calculation (Performed BEFORE database writes) ---
    const { start, end, startStr, endStr } = parseSlotTime(preferredSlot);

    // ✅ FIX: Create a date object specifically for the "Asia/Kolkata" timezone.
    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // This date is now correctly based on Indian Standard Time
    const localDate = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format

    // This calculation will now use the correct local time in minutes
    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();
    console.log(`Current time in minutes (IST): ${currentTimeInMinutes}`);

    // Find existing appointments to determine the next sequential slot.
    const existingAppointments = await opdModel
      .find({
        hospitalId,
        appointmentDate: localDate,
        preferredSlot: `${startStr} - ${endStr}`,
      })
      .sort({ appointmentTime: 1 });

    // --- Determine the next available time ---
    let nextSequentialTime = start; // Default to the start of the slot.
    if (existingAppointments.length > 0) {
      const lastAppointment = existingAppointments[existingAppointments.length - 1];
      const lastAppointmentTimeInMinutes = toMinutes(lastAppointment.appointmentTime);

      if (!isNaN(lastAppointmentTimeInMinutes)) {
        nextSequentialTime = lastAppointmentTimeInMinutes + 20;
      }
    }

    const earliestTimeFromNow = currentTimeInMinutes + 20;
    
    // The final appointment time is the LATER of the two possibilities.
    let appointmentTimeInMinutes = Math.max(nextSequentialTime, earliestTimeFromNow);

    // Also ensure the appointment doesn't start before the slot officially begins.
    appointmentTimeInMinutes = Math.max(appointmentTimeInMinutes, start);

    // --- Final Check and Database Write ---
    if (appointmentTimeInMinutes >= end) {
      return res.status(400).json({
        message: `Sorry, no available slots in the ${preferredSlot} timeframe. Please try a later slot.`,
      });
    }

    const appointmentTimeStr = formatTime(appointmentTimeInMinutes);

    // Get the next appointment number
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
      assignedDoctor:selectedDoctor || null,
    });

    await newOpdEntry.save();

    await Admin.findByIdAndUpdate(
      hospitalId,
      { $push: { opdForms: newOpdEntry._id } },
      { new: true }
    );

    // --- ✅ CHANGED: Send Confirmation Email via Brevo API ---
    if (email) {
      try {
        await apiInstance.sendTransacEmail({
          sender: { email: process.env.EMAIL_FROM },
          to: [{ email: email, name: fullName }],
          subject: "Appointment Confirmation",
          // Use textContent for plain text.
          textContent: `Dear ${fullName},\n\nYour appointment is confirmed:\n📅 Date: ${localDate}\n🕒 Time: ${appointmentTimeStr}\n🔢 Appointment Number: ${counter.seq}\n\nThank you for choosing our service.`,
        });
        console.log("Appointment confirmation email sent successfully via Brevo API.");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Do not stop the main function, just log the error
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

// ... (all other routes: /checkDuplicate, /dashboard, /doctor/opd, etc. remain unchanged) ...

router.post("/checkDuplicate", async (req, res) => {
  const { fullName, hospitalId } = req.body;

  try {
    // ✅ Get today's date in IST
    const now = new Date();
    const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayDate = todayIST.toISOString().split("T")[0]; // Format: "YYYY-MM-DD"

    // ✅ Check if same name already booked today in same hospital
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
    const adminId = req.user.id; // Authenticated Admin ID

    // Validate admin ID
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid Admin ID" });
    }

    // Fetch OPD records linked to this admin's hospital
    const opdRecords = await opdModel.find({ hospitalId: adminId });

    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/doctor/opd", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Fetch OPD records assigned to this doctor
    const opdRecords = await opdModel.find({ "assignedDoctor": doctorId });

    res.json(opdRecords);
  } catch (error) {
    console.error("Error in /doctor/opd:", error);
    res.status(500).json({ error: error.message });
  }
});


// Delete OPD Record by ID
router.delete("/opd/:id",authMiddleware,async (req, res) => {
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
  // Destructure the new request body
  const { base64Data, contentType, diagnosis, medication, advice } = req.body;
  try {
    const updated = await opdModel.findByIdAndUpdate(
      req.params.id,
      {
        prescriptionPdf: {
          data: base64Data, // Save base64 data
          contentType: contentType, // Save the content type
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