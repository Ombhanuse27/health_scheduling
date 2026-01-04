const express = require("express");
const router = express.Router();

const hospitalController = require("../controllers/hospitalController");

// Get all hospitals
router.get("/getHospitalsData", hospitalController.getHospitalsData);

// Update hospital data
router.post(
  "/hospitalData/:hospitalId",
  hospitalController.updateHospitalData
);

module.exports = router;
