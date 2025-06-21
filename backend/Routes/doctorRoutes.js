// Create a new doctor
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const Doctor = require('../model/Doctor');
const router = express.Router();
const jwt = require('jsonwebtoken');

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

router.post('/', async (req, res) => {
    const doctorData = req.body;
    const plainPassword = doctorData.password;

    try {
        // Check for required fields
        if (!doctorData.username || !doctorData.email || !plainPassword) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }

        // Check if doctor with this email already exists
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
