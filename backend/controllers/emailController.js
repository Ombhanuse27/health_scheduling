const { v4: uuidv4 } = require("uuid");
const brevo = require("@getbrevo/brevo");

require("dotenv").config();

// ======================
// Brevo Setup
// ======================
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// =========================
// 1️⃣ Send Prescription Email
// =========================
exports.sendPrescriptionEmail = async (req, res) => {
  const { email, patientName, base64Data, contentType, filename } = req.body;

  if (!email || !base64Data || !patientName || !contentType || !filename) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.EMAIL_FROM },
      to: [{ email }],
      subject: "Your Medical Prescription",
      htmlContent: `
        <p>Dear ${patientName},</p>
        <p>Please find attached your prescription.</p>
      `,
      attachment: [
        {
          name: filename,
          content: base64Data,
        },
      ],
    });

    res.status(200).json({ message: "Prescription sent successfully!" });
  } catch (error) {
    console.error("Error sending prescription:", error);
    res.status(500).json({ message: "Failed to send prescription" });
  }
};

// ===============================
// 2️⃣ Generate Teleconsult Link
// ===============================
exports.generateTeleconsultLink = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const meetingId = uuidv4();
    const meetLink = `https://health-scheduling.vercel.app/teleconsult/${meetingId}`;

    res.json({ appointmentId, meetLink });
  } catch (error) {
    console.error("Error generating link:", error);
    res.status(500).json({ message: "Error generating link" });
  }
};

// ================================
// 3️⃣ Send Teleconsultation Email
// ================================
exports.sendTeleconsultEmail = async (req, res) => {
  const { email, patientName, meetLink } = req.body;

  if (!email || !patientName || !meetLink) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.EMAIL_FROM },
      to: [{ email }],
      subject: "Your Teleconsultation Link",
      htmlContent: `
        <h3>Hello ${patientName},</h3>
        <p>Your teleconsultation session is ready.</p>
        <p>
          <strong>Join here:</strong>
          <a href="${meetLink}" target="_blank">${meetLink}</a>
        </p>
        <p>Thank you,<br/>Hospital Team</p>
      `,
    });

    res
      .status(200)
      .json({ message: "Teleconsultation email sent successfully!" });
  } catch (error) {
    console.error("Failed to send teleconsultation email:", error);
    res
      .status(500)
      .json({ message: "Failed to send teleconsultation email" });
  }
};
