const mongoose = require("mongoose");
const doctorSchema = new mongoose.Schema({
  fullName: String,
  gender: String,
  dob: String,
  email: String,
  phone: String,
  address: String,
  specialization: String,
  hospital: String,
  username: String,
  password: String,
});

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;