const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },  // Keeps track of appointment numbers
});

const Counter = mongoose.model("Counter", counterSchema);
module.exports = Counter;
