const express = require("express");
const Doctor = require("../model/Doctor");

const router = express.Router();

// Add a new hospital
router.post("/dashboard/add", async (req, res) => {
  try {
    const hospital = new Doctor(req.body);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all hospitals with bed availability
router.get("/", async (req, res) => {
  try {
    const hospitals = await Doctor.find();
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



