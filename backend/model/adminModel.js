const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  opdForms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'opdModel' }],
});

module.exports = mongoose.model("adminModel", AdminSchema);