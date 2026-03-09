const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient"
  },

  doctorProfile: {
    specialization: {
      type: String,
      default: "General Physician"
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    availableStart: {
      type: String,
      default: ""
    },
    availableEnd: {
      type: String,
      default: ""
    },
    clinicName: {
      type: String,
      default: ""
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
