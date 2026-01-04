const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const doctorController = require("../controllers/doctorController");

// Doctor Auth
router.post("/addDoctors", doctorController.addDoctor);
router.post("/login", doctorController.loginDoctor);

// Doctor Profile
router.get("/doctorme", authMiddleware, doctorController.getDoctorMe);
router.put("/updateProfile", authMiddleware, doctorController.updateDoctorProfile);

// Doctor Management
router.get("/getDoctors", doctorController.getDoctors);
router.delete("/deleteDoctor/:id", doctorController.deleteDoctor);

// Prescriptions
router.get(
  "/getPrescriptions",
  authMiddleware,
  doctorController.getPrescriptions
);

module.exports = router;
