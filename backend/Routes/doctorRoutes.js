const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- Add this
const Doctor = require('../model/Doctor');
const router = express.Router();

// Create a new doctor
router.post('/', async (req, res) => {
    const doctorData = req.body;

    try {
        // Hash the password
        if (doctorData.password) {
            const salt = await bcrypt.genSalt(10);
            doctorData.password = await bcrypt.hash(doctorData.password, salt);
        }

        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();
        res.status(201).json({ message: 'Doctor registered successfully', doctor: newDoctor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
