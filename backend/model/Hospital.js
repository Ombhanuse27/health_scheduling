const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  hospitalImage: { type: String, default: "" },
  hospitalId: { type: String, required: true, unique: true },
  hospitalName: { type: String, required: true },
  hospitalStartTime: { type: String, required: true },
  hospitalEndTime: { type: String, required: true },
  Specialist: { type: String, required: true },
  opdFees: { type: Number, required: true },
  contactNumber: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  paymentMode: { type: String, required: true }
});

const Hospital = mongoose.model("Hospital", hospitalSchema);
module.exports = Hospital;
