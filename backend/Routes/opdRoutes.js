const express = require("express");
const mongoose = require("mongoose");
const opdModel = require("../model/opdModel");
const Counter = require("../model/counterModel");

const Admin = require("../model/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();
const nodemailer = require("nodemailer");

const router = express.Router();

// Submit OPD Form
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

router.post("/opd/:hospitalId", async (req, res) => {
  console.log(req.body);

  try {
    const { hospitalId } = req.params;
    const { fullName, contactNumber, email, preferredSlot } = req.body;

    // Validate hospitalId
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }

    // Convert hospitalId to ObjectId
    const validHospitalId = new mongoose.Types.ObjectId(hospitalId);

    // Save initial OPD entry
    const opdData = req.body;
    opdData.hospitalId = validHospitalId;

    const newOpdEntry = new opdModel(opdData);
    await newOpdEntry.save();

    await Admin.findByIdAndUpdate(
      hospitalId,
      { $push: { opdForms: newOpdEntry._id } },
      { new: true }
    );

    // Proceed with appointment booking
    if (!preferredSlot || typeof preferredSlot !== "string") {
      return res.status(400).json({ message: "Invalid preferredSlot format." });
    }

    let OpdEntry = await opdModel.findOne({ contactNumber });
    if (!OpdEntry) {
      return res.status(404).json({ message: "OPD Form entry not found. Please register first." });
    }

    const today = new Date();
    const localDate = today.toLocaleDateString("en-CA");
    const { start, end, startStr, endStr } = parseSlotTime(preferredSlot);

    const existingAppointments = await opdModel
      .find({
        hospitalId,
        appointmentDate: localDate,
        preferredSlot: `${startStr} - ${endStr}`,
      })
      .sort({ appointmentTime: 1 });

    let appointmentTime = start;
    if (existingAppointments.length > 0) {
      const lastAppointmentTime = toMinutes(existingAppointments[existingAppointments.length - 1].appointmentTime);
      appointmentTime = lastAppointmentTime + 20;
    }

    if (appointmentTime < start) {
      appointmentTime = start;
    }

    if (appointmentTime >= end) {
      return res.status(400).json({ message: `No available slots in ${preferredSlot}.` });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    OpdEntry.appointmentNumber = counter.seq;
    OpdEntry.appointmentDate = localDate;
    OpdEntry.appointmentTime = formatTime(appointmentTime);
    OpdEntry.preferredSlot = `${startStr} - ${endStr}`;

    await OpdEntry.save();

    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Appointment Confirmation",
        text: `Dear ${fullName},\n\nYour appointment is confirmed:\n📅 Date: ${localDate}\n🕒 Time: ${OpdEntry.appointmentTime}\n🔢 Appointment Number: ${OpdEntry.appointmentNumber}\n\nThank you for choosing our service.`,
      });
    }

    res.status(201).json({ message: `Appointment booked successfully at ${OpdEntry.appointmentTime}` });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/checkDuplicate", async (req, res) => {
  const { fullName } = req.body;

  try {
    const existingEntry = await opdModel.findOne({ fullName });
    if (existingEntry) {
      return res.status(200).json({ exists: true, message: "User already exists." });
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


module.exports = router;
