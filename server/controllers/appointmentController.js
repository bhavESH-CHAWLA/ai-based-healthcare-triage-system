const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const TriageReport = require("../models/TriageReport");

const activeStatuses = ["booked", "confirmed"];

const timeToMinutes = (value) => {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const getPriority = (triage, age) => {
  const riskScores = {
    low: 25,
    medium: 50,
    high: 75,
    emergency: 100
  };

  const level = triage?.riskLevel || "medium";
  let score = riskScores[level] || 50;

  if (typeof age === "number" && age >= 60) score += 10;
  if (triage?.redFlags?.length) score += Math.min(triage.redFlags.length * 3, 12);

  return {
    priorityLevel: level,
    priorityScore: Math.min(score, 120)
  };
};

const buildReasonFromTriage = (triageReport) => {
  if (!triageReport) return "";
  const level = triageReport?.triage?.riskLevel || "medium";
  const symptoms = (triageReport?.input?.symptoms || []).slice(0, 4).join(", ");
  const redFlags = triageReport?.triage?.redFlags || [];
  const redFlagText = redFlags.length ? ` | Red flags: ${redFlags.slice(0, 2).join(", ")}` : "";
  return `Triage(${level}) - Symptoms: ${symptoms || "not specified"}${redFlagText}`;
};

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotStart, durationMinutes = 30, reason = "", triageReportId } = req.body;

    if (!doctorId || !slotStart) {
      return res.status(400).json({ message: "doctorId and slotStart are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId" });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor", isActive: true });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const start = new Date(slotStart);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      return res.status(400).json({ message: "slotStart must be a valid future datetime" });
    }

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 240) {
      return res.status(400).json({ message: "durationMinutes must be between 1 and 240" });
    }

    const end = new Date(start.getTime() + duration * 60 * 1000);
    const requestStartMins = start.getHours() * 60 + start.getMinutes();
    const requestEndMins = end.getHours() * 60 + end.getMinutes();
    const doctorStartMins = timeToMinutes(doctor?.doctorProfile?.availableStart);
    const doctorEndMins = timeToMinutes(doctor?.doctorProfile?.availableEnd);

    if (
      doctorStartMins === null ||
      doctorEndMins === null ||
      requestStartMins < doctorStartMins ||
      requestEndMins > doctorEndMins
    ) {
      return res.status(409).json({ message: "Doctor is not available in the selected time slot" });
    }

    const [doctorConflict, patientConflict] = await Promise.all([
      Appointment.exists({
        doctor: doctorId,
        status: { $in: activeStatuses },
        slotStart: { $lt: end },
        slotEnd: { $gt: start }
      }),
      Appointment.exists({
        patient: req.user.id,
        status: { $in: activeStatuses },
        slotStart: { $lt: end },
        slotEnd: { $gt: start }
      })
    ]);

    if (doctorConflict) {
      return res.status(409).json({ message: "Selected doctor slot is already booked" });
    }

    if (patientConflict) {
      return res.status(409).json({ message: "You already have an overlapping appointment" });
    }

    let triageReport = null;
    if (triageReportId && mongoose.Types.ObjectId.isValid(triageReportId)) {
      triageReport = await TriageReport.findOne({ _id: triageReportId, user: req.user.id });
    }
    if (!triageReport) {
      triageReport = await TriageReport.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    }

    const { priorityLevel, priorityScore } = getPriority(triageReport?.triage, triageReport?.input?.age);

    const resolvedReason = reason?.trim() || buildReasonFromTriage(triageReport);

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      triageReport: triageReport?._id,
      reason: resolvedReason,
      slotStart: start,
      slotEnd: end,
      durationMinutes: duration,
      priorityLevel,
      priorityScore
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("patient", "name email")
      .populate("doctor", "name email doctorProfile")
      .populate("triageReport", "triage input.symptoms");

    res.status(201).json({
      message: "Appointment booked",
      data: populated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("doctor", "name email doctorProfile")
      .populate("triageReport", "triage input.symptoms createdAt")
      .sort({ slotStart: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate("patient", "name email")
      .sort({ slotStart: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPriorityQueue = async (req, res) => {
  try {
    const { doctorId } = req.query;

    const query = { status: { $in: activeStatuses } };

    if (req.user.role === "doctor") {
      query.doctor = req.user.id;
    } else if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctor = doctorId;
    }

    const queue = await Appointment.find(query)
      .populate("patient", "name email")
      .populate("doctor", "name email doctorProfile")
      .sort({ priorityScore: -1, slotStart: 1, createdAt: 1 });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!["booked", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user.role === "doctor" && String(appointment.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: "Appointment status updated", data: appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
