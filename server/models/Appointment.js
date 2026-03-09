const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  triageReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TriageReport"
  },
  reason: {
    type: String,
    default: ""
  },
  slotStart: {
    type: Date,
    required: true
  },
  slotEnd: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  priorityLevel: {
    type: String,
    enum: ["low", "medium", "high", "emergency"],
    default: "medium"
  },
  priorityScore: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ["booked", "confirmed", "completed", "cancelled"],
    default: "booked"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

appointmentSchema.index({ doctor: 1, slotStart: 1, slotEnd: 1 });
appointmentSchema.index({ patient: 1, slotStart: 1, slotEnd: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
