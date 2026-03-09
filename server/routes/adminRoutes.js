const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllAppointments,
  deleteAppointment
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Protect all admin routes
router.use(authMiddleware, roleMiddleware("admin"));

// User Management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.post("/users", createUser);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

// Appointment Management
router.get("/appointments", getAllAppointments);
router.delete("/appointments/:appointmentId", deleteAppointment);

module.exports = router;
