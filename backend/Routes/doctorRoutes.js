// Create a new doctor
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const Doctor = require('../model/Doctor');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const opdModel = require('../model/opdModel');
// ⛔️ REMOVED: const axios = require("axios");
// ✅ ADDED: Brevo SDK
const brevo = require("@getbrevo/brevo");

// Load environment variables
require('dotenv').config();

// ✅ ADDED: Brevo API setup
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY // Make sure this is set in Render
);

router.post('/addDoctors', async (req, res) => {
    const doctorData = req.body;
    const plainPassword = doctorData.password;

    try {
        // Check for required fields
        if (!doctorData.username || !doctorData.email || !plainPassword) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }
      
        const existingDoctor = await Doctor.findOne({ username: doctorData.email });
        if (existingDoctor) {
            return res.status(400).json({ error: "Doctor with this email already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        doctorData.password = await bcrypt.hash(plainPassword, salt);

        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();

        // -------------------------------
        // ✅ Brevo Email API (using SDK)
        // -------------------------------
        try {
            await apiInstance.sendTransacEmail({
              sender: { email: process.env.EMAIL_FROM },
              to: [{ email: doctorData.email, name: doctorData.fullName }],
              subject: "Doctor Registration Successful",
              textContent: `Welcome ${doctorData.fullName},\n\nYour account has been created successfully.\n\nUsername: ${doctorData.email}\nPassword: ${plainPassword}\n\nPlease keep this information secure.`,
            });
            console.log("Doctor registration email sent successfully via Brevo API.");
        } catch (emailErr) {
            console.error("Error sending registration email:", emailErr);
            // Don't stop the main function, just log the error
        }

        res.status(201).json({ message: 'Doctor registered successfully', doctor: newDoctor });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: error.message });
    }
});


// In your server/routes/doctorRoutes.js

// ... imports and existing code ...

// ✅ GET: Get Logged-in Doctor Details
router.get('/doctorme', authMiddleware, async (req, res) => {
    try {
        // req.user.id comes from the authMiddleware
        const doctor = await Doctor.findById(req.user.id).populate('hospital');
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
});

// ✅ PUT: Update Logged-in Doctor Details
router.put('/updateProfile', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        
        // Prevent updating sensitive fields directly through this route if needed
        // delete updates.password; 
        // delete updates.username;

        const doctor = await Doctor.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.json({ message: "Profile updated successfully", doctor });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
});

module.exports = router;


// Get all doctors
router.get('/getDoctors', async (req, res) => {
    try {
      const doctorsData = await Doctor.find().populate('hospital');
      res.json(doctorsData);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching doctors' });
    }
});
  
// Delete doctor by ID
router.delete("/deleteDoctor/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting doctor" });
  }
});

// Get prescriptions
router.get("/getPrescriptions", authMiddleware, async (req, res) => {
  try {
    const prescriptions = await opdModel.find({
      prescriptionPdf: { $ne: null },
    });
    
    const formatted = prescriptions.map((record) => ({
      appointmentId: record._id,
      pdfBase64: record.prescriptionPdf?.data,
      contentType: record.prescriptionPdf?.contentType || 'application/pdf',
      diagnosis: record.diagnosis,
      medication: record.medication,
      advice: record.advice,
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Doctor login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const doctor = await Doctor.findOne({ username });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found." });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: doctor._id, role: "doctor" },
            process.env.JWT_SECRET || "defaultsecret",
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            doctor: {
                id: doctor._id,
                fullName: doctor.fullName,
                username: doctor.username,
                email: doctor.email,
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
});

module.exports = router;