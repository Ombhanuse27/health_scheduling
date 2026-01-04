const express = require("express");
const router = express.Router();

const emailController=require("../controllers/emailController")

// Prescription
router.post(
  "/send-prescription",
  emailController.sendPrescriptionEmail
);

// Teleconsult
router.get(
  "/generate-link/:appointmentId",
  emailController.generateTeleconsultLink
);

router.post(
  "/send-teleconsult",
  emailController.sendTeleconsultEmail
);

module.exports = router;
