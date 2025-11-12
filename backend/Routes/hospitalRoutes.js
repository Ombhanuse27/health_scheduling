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


// your_router_file.js

router.post("/hospitalData/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;

    // The req.body from your form has the exact shape you need.
    // We can just use it directly. Mongoose will ignore fields
    // that aren't in the schema (like `hospitalId` which is in the body).
    const updatedData = req.body;

    // Use findByIdAndUpdate for a cleaner, atomic update operation
    const updatedHospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      updatedData, // <-- Pass the entire body as the update
      { new: true, runValidators: true } // {new: true} returns the updated document
    );

    if (!updatedHospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json({
      message: "Hospital information updated successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error("Error updating hospital info:", error);
    res.status(500).json({ message: "Error updating hospital info", error: error.message });
  }
});


module.exports = router;



