const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Health / Cron
router.get("/getcron", adminController.getCron);

// Auth
router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);

// Admin Data
router.get("/getHospitals", adminController.getHospitals);
router.get("/me", authMiddleware, adminController.getMe);

// OPD
router.post("/assignDoctors", adminController.assignDoctor);

module.exports = router;
