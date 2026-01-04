const mongoose = require("mongoose");
const opdModel = require("../model/opdModel");
const Counter = require("../model/counterModel");
const Admin = require("../model/adminModel");
const axios = require("axios");
const brevo = require("@getbrevo/brevo");
require("dotenv").config();

let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const FAST2SMS_API_KEY =process.env.FAST2SMS_API_KEY;

// ================= HELPERS =================

const cleanPhoneNumber = (raw) => {
  if (!raw) return "";
  return raw.toString().replace(/\D/g, "");
};

const cleanTimeSlot = (raw) => {
  if (!raw) return "";
  let clean = raw.toString().toLowerCase();
  clean = clean.replace(/\s+to\s+/g, " - ");
  clean = clean.replace(/p\.?m\.?/g, " PM").replace(/a\.?m\.?/g, " AM");
  if (clean.includes("-") && !clean.includes(" - ")) {
    clean = clean.replace("-", " - ");
  }
  return clean.replace(/\s+/g, " ").toUpperCase().trim();
};

const toMinutes = (time) => {
  if (!time || typeof time !== "string") return NaN;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return NaN;

  let hour = parseInt(match[1]);
  let minute = parseInt(match[2]);
  let period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
};

const parseSlotTime = (slot) => {
  if (!slot || !slot.includes(" - ")) {
    throw new Error(`Invalid slot format: ${slot}`);
  }
  const [startStr, endStr] = slot.split(" - ").map((s) => s.trim());
  return {
    start: toMinutes(startStr),
    end: toMinutes(endStr),
    startStr,
    endStr,
  };
};

const formatTime = (minutes) => {
  if (isNaN(minutes) || minutes < 0) return "Invalid Time";
  let hours = Math.floor(minutes / 60);
  let mins = String(minutes % 60).padStart(2, "0");
  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${period}`;
};

// ================= CONTROLLERS =================

exports.bookOpd = async (req, res) => {
  console.log("Raw Body Received:", req.body);

  try {
    const { hospitalId } = req.params;
    let { fullName, contactNumber, email, preferredSlot, selectedDoctor } =
      req.body;

    if (contactNumber) contactNumber = cleanPhoneNumber(contactNumber);
    if (preferredSlot) preferredSlot = cleanTimeSlot(preferredSlot);

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }

    if (!preferredSlot || !preferredSlot.includes(" - ")) {
      return res.status(400).json({
        message: `Invalid preferredSlot format. Got: ${preferredSlot}`,
      });
    }

    let start, end, startStr, endStr;
    try {
      const parsed = parseSlotTime(preferredSlot);
      start = parsed.start;
      end = parsed.end;
      startStr = parsed.startStr;
      endStr = parsed.endStr;

      if (isNaN(start) || isNaN(end)) throw new Error();
    } catch {
      return res.status(400).json({
        message: "Could not understand the time slot format.",
      });
    }

    const now = new Date();
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const localDate = today.toLocaleDateString("en-CA");
    const currentMinutes =
      today.getHours() * 60 + today.getMinutes();

    if (!selectedDoctor || selectedDoctor === "null" || selectedDoctor === "") {
      selectedDoctor = null;
    }

    let query = {
      hospitalId,
      appointmentDate: localDate,
      preferredSlot: `${startStr} - ${endStr}`,
      assignedDoctor: selectedDoctor,
    };

    const existingAppointments = await opdModel
      .find(query)
      .sort({ appointmentTime: 1 });

    let nextSequentialTime = start;
    if (existingAppointments.length > 0) {
      const last = existingAppointments[existingAppointments.length - 1];
      const lastMinutes = toMinutes(last.appointmentTime);
      if (!isNaN(lastMinutes)) nextSequentialTime = lastMinutes + 20;
    }

    if (currentMinutes >= end) {
      return res
        .status(400)
        .json({ message: "Selected slot has already passed" });
    }

    let appointmentTimeInMinutes =
      existingAppointments.length === 0 ? start : nextSequentialTime;

    if (appointmentTimeInMinutes < start)
      appointmentTimeInMinutes = start;

    if (appointmentTimeInMinutes >= end) {
      return res.status(400).json({
        message: `Sorry, no available slots in ${preferredSlot}`,
      });
    }

    const appointmentTimeStr = formatTime(appointmentTimeInMinutes);

    const counter = await Counter.findOneAndUpdate(
      { name: "appointmentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const newOpdEntry = new opdModel({
      ...req.body,
      contactNumber,
      hospitalId,
      appointmentDate: localDate,
      appointmentTime: appointmentTimeStr,
      appointmentNumber: counter.seq,
      preferredSlot: `${startStr} - ${endStr}`,
      assignedDoctor: selectedDoctor,
    });

    await newOpdEntry.save();
    await Admin.findByIdAndUpdate(hospitalId, {
      $push: { opdForms: newOpdEntry._id },
    });

    res.status(201).json({
      message: `Appointment booked successfully at ${appointmentTimeStr}`,
      appointment: newOpdEntry,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
};

// ================= REMAINING ROUTES =================

exports.checkDuplicate = async (req, res) => {
  const { fullName, hospitalId } = req.body;
  try {
    const now = new Date();
    const todayIST = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const todayDate = todayIST.toLocaleDateString("en-CA");

    const existingEntry = await opdModel.findOne({
      fullName,
      hospitalId,
      appointmentDate: todayDate,
    });

    if (existingEntry) {
      return res
        .status(200)
        .json({ exists: true, message: "Duplicate appointment today" });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const adminId = req.user.id;
    const opdRecords = await opdModel.find({ hospitalId: adminId });
    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.doctorOpd = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const opdRecords = await opdModel.find({ assignedDoctor: doctorId });
    res.json(opdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOpd = async (req, res) => {
  try {
    const deleted = await opdModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "OPD not found" });
    res.json({ message: "OPD deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.savePrescription = async (req, res) => {
  try {
    const updated = await opdModel.findByIdAndUpdate(
      req.params.id,
      {
        prescriptionPdf: {
          data: req.body.base64Data,
          contentType: req.body.contentType,
        },
        diagnosis: req.body.diagnosis,
        medication: req.body.medication,
        advice: req.body.advice,
      },
      { new: true }
    );
    res.json({ message: "Prescription saved", data: updated });
  } catch {
    res.status(500).json({ error: "Failed to save prescription" });
  }
};

exports.rescheduleOpd = async (req, res) => {
  // 🔥 SAME RESCHEDULE LOGIC AS YOU PROVIDED
  // (kept fully intact, omitted here ONLY to save space)

  try {
    const { newSlot } = req.body;

    if (!newSlot) {
      return res.status(400).json({ message: "New slot is required" });
    }

    // 1️⃣ Find appointment
    const appointment = await opdModel.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 2️⃣ Clean & parse slot
    const cleanedSlot = cleanTimeSlot(newSlot);

    let start, end, startStr, endStr;
    try {
      const parsed = parseSlotTime(cleanedSlot);
      start = parsed.start;
      end = parsed.end;
      startStr = parsed.startStr;
      endStr = parsed.endStr;

      if (isNaN(start) || isNaN(end)) throw new Error();
    } catch {
      return res.status(400).json({
        message: "Invalid slot format. Please select a valid slot.",
      });
    }

    // 3️⃣ Current IST time
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const currentMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();

    // 4️⃣ Fetch existing appointments in new slot (exclude current one)
    const existingAppointments = await opdModel
      .find({
        hospitalId: appointment.hospitalId,
        appointmentDate: appointment.appointmentDate,
        preferredSlot: `${startStr} - ${endStr}`,
        _id: { $ne: appointment._id }, // 🔥 important
      })
      .sort({ appointmentTime: 1 });

    // 5️⃣ Calculate next available time
    let nextTime = start;
    if (existingAppointments.length > 0) {
      const last = existingAppointments[existingAppointments.length - 1];
      const lastMinutes = toMinutes(last.appointmentTime);
      if (!isNaN(lastMinutes)) nextTime = lastMinutes + 20;
    }

    nextTime = Math.max(nextTime, currentMinutes + 20);

    if (nextTime >= end) {
      return res.status(400).json({
        message: `No available time in ${cleanedSlot}. Please try another slot.`,
      });
    }

    const newAppointmentTime = formatTime(nextTime);

    // 6️⃣ Update appointment
    appointment.preferredSlot = `${startStr} - ${endStr}`;
    appointment.appointmentTime = newAppointmentTime;

    await appointment.save();

    // 7️⃣ SEND EMAIL / SMS (🔥 IMPORTANT)
    const messageText = `Dear ${appointment.fullName},

Your appointment has been RESCHEDULED.

📅 Date: ${appointment.appointmentDate}
⏰ Time: ${newAppointmentTime}
🪪 Token No: ${appointment.appointmentNumber}

Thank you.`;

    if (appointment.email) {
      apiInstance
        .sendTransacEmail({
          sender: { email: process.env.EMAIL_FROM },
          to: [{ email: appointment.email, name: appointment.fullName }],
          subject: "Appointment Rescheduled Confirmation",
          textContent: messageText,
        })
        .catch((e) => console.error("Email error:", e.message));
    } else if (appointment.contactNumber) {
      axios
        .get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            message: messageText,
            language: "english",
            route: "q",
            numbers: appointment.contactNumber,
            authorization: FAST2SMS_API_KEY,
          },
        })
        .catch((e) => console.error("SMS error:", e.message));
    }

    // 8️⃣ Response
    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Reschedule Error:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

exports.delayOpd = async (req, res) => {
  // 🔥 SAME DELAY LOGIC AS YOU PROVIDED
  // (kept fully intact, omitted here ONLY to save space)
  try {
    const { delayMinutes } = req.body;

    if (![5, 10].includes(delayMinutes)) {
      return res.status(400).json({ message: "Delay must be 5 or 10 minutes" });
    }

    const adminId = req.user.id;

    // 🇮🇳 Current IST time
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const todayDate = nowIST.toLocaleDateString("en-CA");
    const currentMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();

    // 1️⃣ Fetch ONLY assigned appointments for today
    const appointments = await opdModel.find({
      hospitalId: adminId,
      appointmentDate: todayDate,
      assignedDoctor: { $ne: null }, // 🔒 VERY IMPORTANT
    });

    // 2️⃣ GROUP by doctor + slot (🔥 KEY FIX)
    const grouped = {};
    for (const appt of appointments) {
      const key = `${appt.assignedDoctor}_${appt.preferredSlot}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(appt);
    }

    let updatedCount = 0;
    let notifiedCount = 0;

    // 3️⃣ Apply delay PER QUEUE
    for (const key in grouped) {
      const queue = grouped[key].sort(
        (a, b) => toMinutes(a.appointmentTime) - toMinutes(b.appointmentTime)
      );

      for (const appointment of queue) {
        const oldMinutes = toMinutes(appointment.appointmentTime);

        // ⛔ Skip past appointments
        if (isNaN(oldMinutes) || oldMinutes <= currentMinutes) continue;

        // Parse slot boundaries
        let start, end;
        try {
          const parsed = parseSlotTime(appointment.preferredSlot);
          start = parsed.start;
          end = parsed.end;
        } catch {
          continue;
        }

        const newMinutes = oldMinutes + delayMinutes;

        // 🚨 Do not cross slot end
        if (newMinutes >= end) continue;

        const newTimeStr = formatTime(newMinutes);
        if (newTimeStr === appointment.appointmentTime) continue;

        // 4️⃣ Update appointment
        appointment.appointmentTime = newTimeStr;
        await appointment.save();
        updatedCount++;

        // 5️⃣ Notify patient
        const messageText = `Dear ${appointment.fullName},

Your appointment time has been DELAYED by ${delayMinutes} minutes.

📅 Date: ${appointment.appointmentDate}
⏰ New Time: ${newTimeStr}
🪪 Token No: ${appointment.appointmentNumber}

Thank you for your patience.
- Hospital Team`;

        if (appointment.email) {
          apiInstance
            .sendTransacEmail({
              sender: { email: process.env.EMAIL_FROM },
              to: [{ email: appointment.email, name: appointment.fullName }],
              subject: "Appointment Time Updated",
              textContent: messageText,
            })
            .catch((e) => console.error("Delay email error:", e.message));
        } else if (appointment.contactNumber) {
          axios
            .get("https://www.fast2sms.com/dev/bulkV2", {
              params: {
                message: messageText,
                language: "english",
                route: "q",
                numbers: appointment.contactNumber,
                authorization: FAST2SMS_API_KEY,
              },
            })
            .catch((e) => console.error("Delay SMS error:", e.message));
        }

        notifiedCount++;
      }
    }

    res.status(200).json({
      message: `Delay of ${delayMinutes} minutes applied successfully`,
      updatedAppointments: updatedCount,
      notificationsSent: notifiedCount,
    });
  } catch (error) {
    console.error("Global Delay Error:", error);
    res.status(500).json({ message: "Failed to apply delay" });
  }
};
