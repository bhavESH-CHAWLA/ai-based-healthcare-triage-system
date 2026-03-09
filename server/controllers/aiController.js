const TriageReport = require("../models/TriageReport");
const {
  getTriageFromAI,
  generateFollowUpQuestions,
  generateGuidance,
  hasApiKey
} = require("../services/aiClient");

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseCaseInput = (body) => ({
  symptoms: normalizeList(body.symptoms),
  duration: body.duration || "",
  age: body.age,
  gender: body.gender || "",
  medicalHistory: normalizeList(body.medicalHistory),
  currentMedications: normalizeList(body.currentMedications),
  vitals: body.vitals || {}
});

exports.getAIConfigStatus = async (req, res) => {
  res.json({
    configured: hasApiKey(),
    provider: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4.1-mini"
  });
};

exports.createTriage = async (req, res) => {
  try {
    const input = parseCaseInput(req.body);

    if (input.symptoms.length === 0) {
      return res.status(400).json({ message: "symptoms is required" });
    }

    const aiResult = await getTriageFromAI(input);

    const report = await TriageReport.create({
      user: req.user.id,
      input,
      triage: aiResult.triage,
      provider: aiResult.provider,
      model: aiResult.model,
      rawResponse: aiResult.raw
    });

    res.status(201).json({
      message: "Triage generated successfully",
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyTriageHistory = async (req, res) => {
  try {
    const reports = await TriageReport.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTriageReports = async (req, res) => {
  try {
    const reports = await TriageReport.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowUpQuestions = async (req, res) => {
  try {
    const input = parseCaseInput(req.body);
    if (input.symptoms.length === 0) {
      return res.status(400).json({ message: "symptoms is required" });
    }

    const questions = await generateFollowUpQuestions(input);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGuidance = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ message: "question is required" });
    }

    const guidance = await generateGuidance(question);
    res.json(guidance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
