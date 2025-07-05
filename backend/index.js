const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const nodemailer = require("nodemailer");

const hospitalRoutes = require("./Routes/hospitalRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const opdRoutes = require("./Routes/opdRoutes");
const doctorRoutes = require("./Routes/doctorRoutes");
const emailRoutes = require("./Routes/emailRoutes");
const doctorModel = require("./model/Doctor");

const opdModel = require("./model/opdModel");
const Counter = require("./model/counterModel");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/admin", adminRoutes);
app.use("/api/doctors/",doctorRoutes);
app.use("/api/", hospitalRoutes);
app.use("/api/",opdRoutes);
app.use("/api/", emailRoutes);







app.get("/", (req, res) => res.send("Hospital Queuing System Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));