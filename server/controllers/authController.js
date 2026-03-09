const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mapUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.role === "doctor"
    ? {
        doctorProfile: user.doctorProfile || {},
        doctorProfileComplete: Boolean(user?.doctorProfile?.isProfileComplete)
      }
    : {})
});

/*
REGISTER USER
*/
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent admin registration
    if (role === "admin") {
      return res.status(403).json({ message: "Admin registration is not allowed" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with patient or doctor role only
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "patient"
    });

    res.status(201).json({
      message: "User registered successfully",
      user: mapUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
LOGIN USER
*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: mapUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
