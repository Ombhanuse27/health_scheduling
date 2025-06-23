const mongoose = require("mongoose");

const opdSchema = new mongoose.Schema({
  fullName: String,
  age: Number,
  gender: String,
  contactNumber: String,
  email: String,
  address: String,
  symptoms: String,
  preferredSlot: String, // New field for preferred slot
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
   assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  hospitalName:String, // Reference to Hospital
  appointmentNumber: { type: Number, unique: true },// Auto-generated number
  appointmentDate: String, // Auto-generated date
  appointmentTime: String, // Auto-generated time
});



module.exports = mongoose.model("opdModel", opdSchema);
