const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: Date, required: true },  // Changed to Date type
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true },
  hospital: { type: String, required: true },
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Hospital", 
    required: true 
  },

  username: { type: String}, // Ensure no duplicate usernames
  password: { type: String},
  
  assignedAppointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpdRecord',
    },
  ],
  photo: { type: String }, // Store the file path or URL
  signature: { type: String },
});

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
