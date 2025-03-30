const mongoose = require("mongoose");

const opdSchema = new mongoose.Schema({
  fullName: String,
  age: Number,
  gender: String,
  contactNumber: String,
  email: String,
  address: String,
  emergencyContact: String,
  symptoms: String,
  bloodGroup: String,
  opdFees: Number,
  preferredSlot: String,
  paymentMode: String,
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  hospitalName:String, // Reference to Hospital
  appointmentNumber: { type: Number, unique: true },// Auto-generated number
  appointmentDate: String, // Auto-generated date
  appointmentTime: String, // Auto-generated time
});



module.exports = mongoose.model("opdModel", opdSchema);
