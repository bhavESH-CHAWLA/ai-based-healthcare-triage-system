const express = require("express");
const router = express.Router();

const {
  listDoctors,
  listAvailableDoctors,
  getMyDoctorProfile,
  updateDoctorProfile
} = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, listDoctors);
router.get("/available", authMiddleware, listAvailableDoctors);
router.get("/me", authMiddleware, roleMiddleware("doctor"), getMyDoctorProfile);
router.put("/profile", authMiddleware, roleMiddleware("doctor"), updateDoctorProfile);

module.exports = router;
