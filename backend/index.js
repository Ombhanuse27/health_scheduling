const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const nodemailer = require("nodemailer");

const hospitalRoutes = require("./Routes/hospitalRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const opdRoutes = require("./Routes/opdRoutes");

const opdModel = require("./model/opdModel");
const Counter = require("./model/counterModel");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Converts time string to minutes
const toMinutes = (time) => {
  if (!time || typeof time !== "string") return NaN;

  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return NaN;

  let hour = parseInt(match[1]);
  let minute = parseInt(match[2]);
  let period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
};

// ✅ Parses slot times correctly
const parseSlotTime = (slot) => {
  if (!slot || typeof slot !== "string" || !slot.includes(" - ")) {
    throw new Error(`Invalid slot format: ${slot}`);
  }

  const [startStr, endStr] = slot.split(" - ").map((s) => s.trim());
  return { start: toMinutes(startStr), end: toMinutes(endStr), startStr, endStr };
};

// ✅ Converts minutes back to time string
const formatTime = (minutes) => {
  if (isNaN(minutes) || minutes < 0) return "Invalid Time";

  let hours = Math.floor(minutes / 60);
  let mins = String(minutes % 60).padStart(2, "0"); // Two-digit minutes
  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM, 12 PM remains 12

  return `${hours}:${mins} ${period}`;
};

app.post("/submitOpdForm", async (req, res) => {
  try {
    const { fullName, contactNumber, email, hospitalId, preferredSlot } = req.body;

    if (!preferredSlot || typeof preferredSlot !== "string") {
      return res.status(400).json({ message: "Invalid preferredSlot format." });
    }

    let OpdEntry = await opdModel.findOne({ contactNumber });
    if (!OpdEntry) {
      return res.status(404).json({ message: "OPD Form entry not found. Please register first." });
    }

    const today = new Date();
    const localDate = today.toLocaleDateString("en-CA"); // Format YYYY-MM-DD
    const { start, end, startStr, endStr } = parseSlotTime(preferredSlot);

    // Fetch all appointments within the selected slot
    const existingAppointments = await opdModel
      .find({
        hospitalId,
        appointmentDate: localDate,
        preferredSlot: `${startStr} - ${endStr}`, // Ensure filtering by selected slot
      })
      .sort({ appointmentTime: 1 });

    // Set default appointment time to slot start
    let appointmentTime = start;

    // If there are previous appointments in the slot, schedule the next 20 minutes later
    if (existingAppointments.length > 0) {
      const lastAppointmentTime = toMinutes(existingAppointments[existingAppointments.length - 1].appointmentTime);
      appointmentTime = lastAppointmentTime + 20;
    }

    // Ensure the appointment time does not exceed the slot end time
    if (appointmentTime < start) {
      appointmentTime = start; // Start from the slot start time if no previous bookings exist
    }
    if (appointmentTime >= end) {
      return res.status(400).json({ message: `No available slots in ${preferredSlot}.` });
    }

    // Generate appointment number
    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    OpdEntry.appointmentNumber = counter.seq;
    OpdEntry.appointmentDate = localDate;
    OpdEntry.appointmentTime = formatTime(appointmentTime);
    OpdEntry.preferredSlot = `${startStr} - ${endStr}`;

    await OpdEntry.save();

    // Send confirmation email
    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Appointment Confirmation",
        text: `Dear ${fullName},\n\nYour appointment is confirmed:\n📅 Date: ${localDate}\n🕒 Time: ${OpdEntry.appointmentTime}\n🔢 Appointment Number: ${OpdEntry.appointmentNumber}\n\nThank you for choosing our service.`,
      });
    }

    res.json({ message: `Appointment booked successfully at ${OpdEntry.appointmentTime}` });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Error booking appointment", error: error.message });
  }
});


app.use("/api/admin", adminRoutes);
app.use("/api/auth/dashboard", opdRoutes);
app.use("/api/", opdRoutes);
app.use("/api/", hospitalRoutes);
app.use("/api/getHospitalsData", hospitalRoutes);
app.use("/api/getHospitals", adminRoutes);

app.get("/", (req, res) => res.send("Hospital Queuing System Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
