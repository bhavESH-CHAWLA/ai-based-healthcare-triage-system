const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getPriorityQueue,
  updateAppointmentStatus
} = require("../controllers/appointmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/book", authMiddleware, roleMiddleware("patient"), bookAppointment);
router.get("/my", authMiddleware, roleMiddleware("patient"), getMyAppointments);
router.get("/doctor", authMiddleware, roleMiddleware("doctor"), getDoctorAppointments);
router.get("/queue", authMiddleware, roleMiddleware("doctor", "admin"), getPriorityQueue);
router.patch("/:appointmentId/status", authMiddleware, roleMiddleware("doctor", "admin"), updateAppointmentStatus);

module.exports = router;
