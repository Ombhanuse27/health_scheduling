const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  doctor_id: String,
  appointment_time: Date,
  status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" }
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
