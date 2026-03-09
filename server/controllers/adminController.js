const User = require("../models/User");
const bcrypt = require("bcrypt");
const Appointment = require("../models/Appointment");

/*
GET ALL USERS
*/
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
GET USER BY ID
*/
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
CREATE USER (ADMIN)
*/
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
UPDATE USER (ADMIN)
*/
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
DELETE USER (ADMIN)
*/
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User ${user.email} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
GET ALL APPOINTMENTS (ADMIN)
*/
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name email")
      .populate("doctor", "name email")
      .populate("triageReport");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
DELETE APPOINTMENT (ADMIN)
*/
exports.deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndDelete(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
