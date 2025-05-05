// Create a new doctor
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const Doctor = require('../model/Doctor');
const router = express.Router();

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

module.exports = router;
