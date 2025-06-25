// Create a new doctor
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const Doctor = require('../model/Doctor');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const opdModel = require('../model/opdModel');


// Load environment variables
require('dotenv').config();

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post('/doctors', async (req, res) => {
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

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        doctorData.password = await bcrypt.hash(plainPassword, salt);

        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: doctorData.email,
            subject: 'Doctor Registration Successful',
            text: `Welcome ${doctorData.fullName},\n\nYour account has been created successfully.\n\nUsername: ${doctorData.email}\nPassword: ${plainPassword}\n\nPlease keep this information secure.`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json({ message: 'Doctor registered successfully', doctor: newDoctor });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: error.message });
    }
});


// Get all doctors
// In your backend API (Node.js/Express example)
router.get('/getDoctors', async (req, res) => {
    try {
      const doctorsData = await Doctor.find(); // Replace with your model and query logic
      res.json(doctorsData);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching doctors' });
    }
});
  


router.post("/prescriptions", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, pdfBase64 } = req.body;

    if (!appointmentId || !pdfBase64) {
      return res.status(400).json({ error: "Missing appointmentId or pdfBase64" });
    }

    const updated = await opdModel.findByIdAndUpdate(
      appointmentId,
      {
        prescriptionPdf: {
          data: pdfBase64,
          contentType: "application/pdf",
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ message: "Prescription saved successfully." });
  } catch (error) {
    console.error("Error saving prescription:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/getPrescriptions", authMiddleware, async (req, res) => {
  try {
    const prescriptions = await opdModel.find({ prescriptionPdf: { $ne: null } });

    const formatted = prescriptions.map((record) => ({
      appointmentId: record._id,
      pdfBase64: record.prescriptionPdf?.data,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: error.message });
  }
});




router.post('/doctors/login', async (req, res) => {
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

        // Optional: Create JWT token
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
