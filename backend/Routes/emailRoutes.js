const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require("uuid");


// ✅ MODIFIED: This route now accepts dynamic attachment info
router.post('/send-prescription', async (req, res) => {
  // Destructure new fields
  const { email, patientName, base64Data, contentType, filename } = req.body;

  if (!email || !base64Data || !patientName || !contentType || !filename) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // `false` because port is 587 (uses STARTTLS)
    auth: {
        user: process.env.EMAIL_USER, // Your Brevo email
        pass: process.env.EMAIL_PASS, // Your Brevo SMTP Key
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Medical Prescription",
    text: `Dear ${patientName},\n\nPlease find attached your prescription.`,
    attachments: [
      {
        filename: filename, // Use dynamic filename (e.g., "prescription.pdf" or "prescription.jpg")
        content: base64Data, // Use dynamic data
        encoding: "base64",
        contentType: contentType, // Use dynamic content type
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
}); 

// ✅ 1. Generate Teleconsultation Link
router.get("/generate-link/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const meetingId = uuidv4();
    const meetLink = `https://health-scheduling.vercel.app/teleconsult/${meetingId}`;

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
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // `false` because port is 587 (uses STARTTLS)
    auth: {
        user: process.env.EMAIL_USER, // Your Brevo email
        pass: process.env.EMAIL_PASS, // Your Brevo SMTP Key
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
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
