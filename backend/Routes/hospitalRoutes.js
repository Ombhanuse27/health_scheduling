const express = require("express");

const Hospital = require("../model/adminModel");

const router = express.Router();


router.get("/getHospitalsData", async (req, res) => {
  try {
    const hospitals = await Hospital.find(); // Fetch all hospitals from DB
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: "Error fetching hospital data" });
  }
});


router.post("/hospitalData/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospitalData = req.body;

    // Find the hospital by ID and update the data
    let hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Update hospital details
    Object.assign(hospital, hospitalData);
    await hospital.save();

    res.json({ message: "Hospital information updated successfully", hospital });
  } catch (error) {
    console.error("Error updating hospital info:", error);
    res.status(500).json({ message: "Error updating hospital info", error: error.message });
  }
});


module.exports = router;



