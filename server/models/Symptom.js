const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  symptoms: {
    type: [String],
    required: true
  },
  duration: {
    type: String,
    default: ""
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer_not_to_say"],
    default: "prefer_not_to_say"
  },
  notes: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Symptom", symptomSchema);
