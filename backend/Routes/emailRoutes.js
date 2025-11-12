const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require("uuid");


router.post('/send-prescription', async (req, res) => {
  const { email, patientName, pdfBase64 } = req.body;

  if (!email || !pdfBase64 || !patientName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Medical Prescription",
    text: `Dear ${patientName},\n\nPlease find attached your prescription.`,
    attachments: [
      {
        filename: "prescription.pdf",
        content: pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ message: "Failed to send email", error });
  }
});

// ✅ 1. Generate Teleconsultation Link
router.get("/generate-link/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const meetingId = uuidv4();
    const meetLink = `http://localhost:3000/teleconsult/${meetingId}`;

    res.json({ appointmentId, meetLink });
  } catch (error) {
    console.error("Error generating link:", error);
    res.status(500).json({ message: "Error generating link" });
  }
});

// ✅ 2. Send Teleconsultation Email
router.post("/send-teleconsult", async (req, res) => {
  const { email, patientName, meetLink } = req.body;

  if (!email || !meetLink || !patientName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Teleconsultation Link",
    html: `
      <h2>Dear ${patientName},</h2>
      <p>Your teleconsultation session is ready.</p>
      <p><strong>Join here:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>
      <p>Thank you,<br/>Hospital Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Teleconsultation email sent successfully!" });
  } catch (error) {
    console.error("Failed to send teleconsultation email:", error);
    res.status(500).json({ message: "Failed to send teleconsultation email", error });
  }
});

module.exports = router;
