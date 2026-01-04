const Hospital = require("../model/adminModel");

// ===============================
// Get All Hospitals Data
// ===============================
exports.getHospitalsData = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    console.error("Error fetching hospital data:", error);
    res.status(500).json({ error: "Error fetching hospital data" });
  }
};

// ===============================
// Update Hospital Data
// ===============================
exports.updateHospitalData = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updatedData = req.body;

    const updatedHospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedHospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json({
      message: "Hospital information updated successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error("Error updating hospital info:", error);
    res.status(500).json({
      message: "Error updating hospital info",
      error: error.message,
    });
  }
};
