const express = require("express");
const mongoose = require("mongoose");
const OPD = require("../model/opdModel");
const Admin = require("../model/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Submit OPD Form
router.post("/opd/:hospitalId", async (req, res) => {
  console.log(req.body);
  
  try {
    const { hospitalId } = req.params; // Get the dynamic hospitalId from the URL

    // Check if the hospitalId is valid
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }

    // Convert the hospitalId to a MongoDB ObjectId
    const validHospitalId = new mongoose.Types.ObjectId(hospitalId);

    const opdData = req.body;
    opdData.hospitalId = validHospitalId;

    const newOpdEntry = new OPD(opdData);
    await newOpdEntry.save();

    await Admin.findByIdAndUpdate(
      hospitalId,
      { $push: { opdForms: opdData._id } }, // Push OPD form ID into admin's array
      { new: true }
  );
    res.status(201).json({ message: "OPD Form Submitted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/checkDuplicate", async (req, res) => {
  const { fullName, contactNumber } = req.body;

  try {
    const existingEntry = await opdModel.findOne({ fullName, contactNumber });
    if (existingEntry) {
      return res.status(200).json({ exists: true, message: "User already exists." });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ error: "Server error while checking duplicates." });
  }
});


// Get all OPD records for Admin
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    console.log("Request received at /dashboard");
    const adminId = req.user.id; // Authenticated Admin ID

    // Validate admin ID
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "Invalid Admin ID" });
    }

    // Fetch OPD records linked to this admin's hospital
    const opdRecords = await OPD.find({ hospitalId: adminId });

    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
