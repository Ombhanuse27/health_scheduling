const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  name: String,
  location: String,
  total_beds: Number,
  available_beds: Number,
  icu_beds: Number,
  emergency_beds: Number,
  general_beds: Number,
  waiting_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }]
});


module.exports = mongoose.model("Hospital", HospitalSchema);
