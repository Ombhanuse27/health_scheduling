const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../model/Doctor");
const opdModel = require("../model/opdModel");
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

// ======================
// Add Doctor
// ======================
exports.addDoctor = async (req, res) => {
  const doctorData = req.body;
  const plainPassword = doctorData.password;

  try {
    if (!doctorData.username || !doctorData.email || !plainPassword) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required." });
    }

    const existingDoctor = await Doctor.findOne({
      username: doctorData.email,
    });
    if (existingDoctor) {
      return res
        .status(400)
        .json({ error: "Doctor with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    doctorData.password = await bcrypt.hash(plainPassword, salt);

    const newDoctor = new Doctor(doctorData);
    await newDoctor.save();

    // Send Email (non-blocking)
    try {
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email: doctorData.email, name: doctorData.fullName }],
        subject: "Doctor Registration Successful",
        textContent: `Welcome ${doctorData.fullName},

Your account has been created successfully.

Username: ${doctorData.email}
Password: ${plainPassword}

Please keep this information secure.`,
      });
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    res
      .status(201)
      .json({ message: "Doctor registered successfully", doctor: newDoctor });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ======================
// Doctor Login
// ======================
exports.loginDoctor = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const doctor = await Doctor.findOne({ username });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        username: doctor.username,
        email: doctor.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// ======================
// Get Logged-in Doctor
// ======================
exports.getDoctorMe = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).populate("hospital");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// ======================
// Update Doctor Profile
// ======================
exports.updateDoctorProfile = async (req, res) => {
  try {
    const updates = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ message: "Profile updated successfully", doctor });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// ======================
// Get All Doctors
// ======================
exports.getDoctors = async (req, res) => {
  try {
    const doctorsData = await Doctor.find().populate("hospital");
    res.json(doctorsData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

// ======================
// Delete Doctor
// ======================
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting doctor" });
  }
};

// ======================
// Get Prescriptions
// ======================
exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await opdModel.find({
      prescriptionPdf: { $ne: null },
    });

    const formatted = prescriptions.map((record) => ({
      appointmentId: record._id,
      pdfBase64: record.prescriptionPdf?.data,
      contentType:
        record.prescriptionPdf?.contentType || "application/pdf",
      diagnosis: record.diagnosis,
      medication: record.medication,
      advice: record.advice,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: error.message });
  }
};
