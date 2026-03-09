const User = require("../models/User");
const Appointment = require("../models/Appointment");

const isOverlapping = (slotStart, slotEnd) => ({
  slotStart: { $lt: slotEnd },
  slotEnd: { $gt: slotStart },
  status: { $in: ["booked", "confirmed"] }
});

const timeToMinutes = (value) => {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const isDoctorProfileComplete = (input) => {
  const hasSpecialization = typeof input.specialization === "string" && input.specialization.trim().length > 0;
  const hasExperience = Number(input.experienceYears) > 0;
  const hasConsultationFee = Number(input.consultationFee) > 0;
  const hasAvailableStart = typeof input.availableStart === "string" && input.availableStart.trim().length > 0;
  const hasAvailableEnd = typeof input.availableEnd === "string" && input.availableEnd.trim().length > 0;

  return hasSpecialization && hasExperience && hasConsultationFee && hasAvailableStart && hasAvailableEnd;
};

exports.listDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      isActive: true,
      "doctorProfile.isProfileComplete": true
    })
      .select("name email doctorProfile")
      .sort({ name: 1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listAvailableDoctors = async (req, res) => {
  try {
    const { start, durationMinutes = 30 } = req.query;
    const doctors = await User.find({
      role: "doctor",
      isActive: true,
      "doctorProfile.isProfileComplete": true
    })
      .select("name email doctorProfile")
      .sort({ name: 1 });

    if (!start) {
      return res.json({
        requestedSlot: null,
        doctors: doctors.map((doctor) => ({
          ...doctor.toObject(),
          available: true
        }))
      });
    }

    const slotStart = new Date(start);
    const slotEnd = new Date(slotStart.getTime() + Number(durationMinutes) * 60 * 1000);
    const requestStartMins = slotStart.getHours() * 60 + slotStart.getMinutes();
    const requestEndMins = slotEnd.getHours() * 60 + slotEnd.getMinutes();

    const availability = await Promise.all(
      doctors.map(async (doctor) => {
        const hasConflict = await Appointment.exists({
          doctor: doctor._id,
          ...isOverlapping(slotStart, slotEnd)
        });
        const doctorStartMins = timeToMinutes(doctor?.doctorProfile?.availableStart);
        const doctorEndMins = timeToMinutes(doctor?.doctorProfile?.availableEnd);
        const withinWindow =
          doctorStartMins !== null &&
          doctorEndMins !== null &&
          requestStartMins >= doctorStartMins &&
          requestEndMins <= doctorEndMins;

        return {
          ...doctor.toObject(),
          available: !hasConflict && withinWindow
        };
      })
    );

    res.json({
      requestedSlot: {
        start: slotStart,
        end: slotEnd,
        durationMinutes: Number(durationMinutes)
      },
      doctors: availability
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.user.id, role: "doctor" }).select(
      "name email role doctorProfile"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      doctorProfile: doctor.doctorProfile || {},
      doctorProfileComplete: Boolean(doctor?.doctorProfile?.isProfileComplete)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      fullName,
      specialization,
      experienceYears,
      consultationFee,
      availableStart,
      availableEnd,
      clinicName
    } = req.body;

    const nextProfile = {
      specialization: String(specialization || "").trim(),
      experienceYears: Number(experienceYears || 0),
      consultationFee: Number(consultationFee || 0),
      availableStart: String(availableStart || "").trim(),
      availableEnd: String(availableEnd || "").trim(),
      clinicName: String(clinicName || "").trim()
    };
    const startMins = timeToMinutes(nextProfile.availableStart);
    const endMins = timeToMinutes(nextProfile.availableEnd);
    if (startMins === null || endMins === null) {
      return res.status(400).json({ message: "availableStart and availableEnd must be HH:MM format" });
    }
    if (endMins <= startMins) {
      return res.status(400).json({ message: "availableEnd must be after availableStart" });
    }
    const isProfileComplete = isDoctorProfileComplete(nextProfile);

    const doctor = await User.findOneAndUpdate(
      { _id: req.user.id, role: "doctor" },
      {
        $set: {
          ...(fullName ? { name: String(fullName).trim() } : {}),
          "doctorProfile.specialization": nextProfile.specialization || "General Physician",
          "doctorProfile.experienceYears": nextProfile.experienceYears,
          "doctorProfile.consultationFee": nextProfile.consultationFee,
          "doctorProfile.availableStart": nextProfile.availableStart,
          "doctorProfile.availableEnd": nextProfile.availableEnd,
          "doctorProfile.clinicName": nextProfile.clinicName,
          "doctorProfile.isProfileComplete": isProfileComplete
        }
      },
      { new: true }
    ).select("name email role doctorProfile");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Doctor profile updated",
      doctor,
      doctorProfileComplete: Boolean(doctor?.doctorProfile?.isProfileComplete)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
