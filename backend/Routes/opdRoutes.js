const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const opdController = require("../controllers/opdController");

router.post("/opd/:hospitalId", opdController.bookOpd);
router.post("/checkDuplicate", opdController.checkDuplicate);
router.get("/dashboard", authMiddleware, opdController.dashboard);
router.get("/doctor/opd", authMiddleware, opdController.doctorOpd);
router.delete("/opd/:id", authMiddleware, opdController.deleteOpd);
router.put("/opd/:id/prescription", opdController.savePrescription);
router.put("/opd/:id/reschedule", authMiddleware, opdController.rescheduleOpd);
router.put("/opd/delay", authMiddleware, opdController.delayOpd);

module.exports = router;
