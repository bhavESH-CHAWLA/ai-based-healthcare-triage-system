const mongoose = require("mongoose");

const triageReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  input: {
    symptoms: {
      type: [String],
      required: true
    },
    duration: {
      type: String,
      default: ""
    },
    age: Number,
    gender: String,
    medicalHistory: {
      type: [String],
      default: []
    },
    currentMedications: {
      type: [String],
      default: []
    },
    vitals: {
      heartRate: Number,
      temperatureC: Number,
      spo2: Number,
      systolicBP: Number,
      diastolicBP: Number
    }
  },
  triage: {
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "emergency"],
      required: true
    },
    possibleConditions: {
      type: [String],
      default: []
    },
    recommendedActions: {
      type: [String],
      default: []
    },
    redFlags: {
      type: [String],
      default: []
    },
    disclaimer: {
      type: String,
      default: "AI output is assistive only. Consult a licensed clinician for diagnosis."
    }
  },
  provider: {
    type: String,
    default: "openai-compatible"
  },
  model: {
    type: String,
    default: ""
  },
  rawResponse: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TriageReport", triageReportSchema);
