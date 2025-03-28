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

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables
    pass: process.env.EMAIL_PASS,
  },
});

// Appointment Queue & Time Management
const appointmentQueue = [];
const HOSPITAL_OPEN = 9 * 60; // 9:00 AM in minutes
const HOSPITAL_CLOSE = 23 * 60; // 10:00 PM in minutes

const getNextAppointmentTime = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Ensure counter exists and get the next appointment number
    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }  // Atomic operation to prevent duplicates
    );

    if (!counter) {
      throw new Error("Failed to generate appointment number.");
    }

    let lastAppointmentNumber = counter.seq;
    let lastBookedTime = HOSPITAL_OPEN; // Default to 9:00 AM

    // Fetch last appointment details
    const lastAppointment = await opdModel.findOne().sort({ appointmentNumber: -1 });

    if (lastAppointment && lastAppointment.appointmentDate === currentDate && lastAppointment.appointmentTime) {
      const [hours, minutes] = lastAppointment.appointmentTime.match(/\d+/g).map(Number);
      let period = lastAppointment.appointmentTime.includes("PM") ? "PM" : "AM";

      let adjustedHours = period === "PM" && hours !== 12 ? hours + 12 : hours;
      if (period === "AM" && hours === 12) adjustedHours = 0;

      lastBookedTime = adjustedHours * 60 + minutes;
    }

    let nextTime = Math.max(lastBookedTime + 20, currentMinutes + 20);
    if (nextTime >= HOSPITAL_CLOSE) return null;

    let formattedHours = Math.floor(nextTime / 60) % 12 || 12;
    let formattedMinutes = String(nextTime % 60).padStart(2, "0");
    let period = nextTime / 60 >= 12 ? "PM" : "AM";

    return {
      appointmentNumber: lastAppointmentNumber, // Now always unique
      appointmentTime: `${formattedHours}:${formattedMinutes} ${period}`,
    };
  } catch (error) {
    console.error("Error generating next appointment time:", error);
    return null;
  }
};


app.post("/submitOpdForm", async (req, res) => {
  try {
    const { fullName, email, contactNumber } = req.body;
    let OpdEntry = await opdModel.findOne({ contactNumber });

    if (!OpdEntry) {
      return res.status(404).json({ message: "OPD Form entry not found. Please register first." });
    }

   
    const appointmentDetails = await getNextAppointmentTime();
    if (!appointmentDetails) {
      return res.status(400).json({ message: "No available slots today. Please try again tomorrow." });
    }

    
    const existingAppointment = await opdModel.findOne({
      appointmentNumber: appointmentDetails.appointmentNumber,
    });

    if (existingAppointment) {
      console.log(`Duplicate appointmentNumber detected: ${appointmentDetails.appointmentNumber}`);
      return res.status(500).json({ message: "Duplicate appointment number detected. Try again." });
    }

    
    OpdEntry.appointmentNumber = appointmentDetails.appointmentNumber;
    OpdEntry.appointmentDate = new Date().toISOString().split("T")[0];
    OpdEntry.appointmentTime = appointmentDetails.appointmentTime;

    await OpdEntry.save();

    // Send Email Confirmation
    if (email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Appointment Confirmation",
        text: `Dear ${fullName},\n\nYour appointment is confirmed:\n📅 Date: ${OpdEntry.appointmentDate}\n🕒 Time: ${OpdEntry.appointmentTime}\n🔢 Appointment Number: ${OpdEntry.appointmentNumber}\n\nThank you for choosing our service.`,
      };
      await transporter.sendMail(mailOptions);
    }

    res.json({ message: `Appointment booked successfully at ${appointmentDetails.appointmentTime}` });
  } catch (error) {
    console.error("Error saving appointment:", error);
    res.status(500).json({ message: "Error saving appointment", error: error.message });
  }
});


// **Routes**


app.use("/api/admin", adminRoutes);
app.use("/api/auth/dashboard", opdRoutes);
app.use("/api/", opdRoutes);
app.use("/api/", hospitalRoutes);
app.use("/api/getHospitalsData", hospitalRoutes);

app.use("/api/getHospitals", adminRoutes);

app.get("/", (req, res) => res.send("Hospital Queuing System Running"));

// **Start Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
