const Symptom = require("../models/Symptom");

const normalizeSymptoms = (symptoms) => {
  if (Array.isArray(symptoms)) {
    return symptoms.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof symptoms === "string") {
    return symptoms
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

exports.createSymptom = async (req, res) => {
  try {
    const { symptoms, duration, age, gender, notes } = req.body;
    const normalizedSymptoms = normalizeSymptoms(symptoms);

    if (normalizedSymptoms.length === 0) {
      return res.status(400).json({ message: "At least one symptom is required" });
    }

    const newSymptom = await Symptom.create({
      user: req.user.id,
      symptoms: normalizedSymptoms,
      duration: duration || "",
      age,
      gender,
      notes: notes || ""
    });

    res.status(201).json({
      message: "Symptoms submitted successfully",
      data: newSymptom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMySymptoms = async (req, res) => {
  try {
    const mySymptoms = await Symptom.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(mySymptoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find().populate("user", "name email role").sort({ createdAt: -1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
