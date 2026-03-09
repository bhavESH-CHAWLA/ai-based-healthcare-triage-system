const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const seedAdminUser = require("./utils/seedAdmin");
const authRoutes = require("./routes/authRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const aiRoutes = require("./routes/aiRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

connectDB().then(() => {
  seedAdminUser();
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare triage API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
