const express = require("express");
// const Patient = require("../model/Patient");
const Hospital = require("../model/Hospital");

const router = express.Router();

// Register Patient
router.post("/register", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
