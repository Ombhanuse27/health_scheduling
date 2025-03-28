const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  opdForms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'opdModel' }],
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

module.exports = mongoose.model("adminModel", AdminSchema);
