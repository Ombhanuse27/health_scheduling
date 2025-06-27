const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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

module.exports = router;
