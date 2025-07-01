const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../model/adminModel");
const Doctor = require("../model/Doctor");

require("dotenv").config();
const authMiddleware=require("../middleware/authMiddleware");
const opdModel = require("../model/opdModel");
const router = express.Router();



router.get("/getcron", (req, res) => {
  res.status(200).send("Cron ping successful at " + new Date().toISOString());
});

// Admin Registration 
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7h" });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/getHospitals", async (req, res) => {
  try {
    const admins = await Admin.find({}, "username"); // Only fetch username field
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post('/assignDoctors', async (req, res) => {
  const { recordId, doctorId } = req.body;

  if (!recordId || !doctorId) {
    return res.status(400).json({ message: "recordId and doctorId are required." });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const appointment = await opdModel.findById(recordId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment record not found." });
    }

    // Assign doctor to the OPD record
    appointment.assignedDoctor = doctorId;
    await appointment.save();

    // Optionally, also store the appointment in the doctor's model
    if (!doctor.assignedAppointments?.includes(recordId)) {
      doctor.assignedAppointments = doctor.assignedAppointments || [];
      doctor.assignedAppointments.push(recordId);
      await doctor.save();
    }

    return res.status(200).json({ message: "Doctor successfully assigned to appointment." });
  } catch (error) {
    console.error("Error assigning doctor:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});



module.exports = router;