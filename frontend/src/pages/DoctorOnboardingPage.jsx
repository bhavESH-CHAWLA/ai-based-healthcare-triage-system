import { useEffect, useState } from "react";
import { api } from "../api";

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "General Physician",
  "Pediatrician"
];

const defaultForm = {
  fullName: "",
  specialization: "General Physician",
  experienceYears: "",
  consultationFee: "",
  availableStart: "10:00",
  availableEnd: "14:00",
  clinicName: ""
};

export default function DoctorOnboardingPage({ token, user, onProfileCompleted }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.myDoctorProfile(token);
        setForm((prev) => ({
          ...prev,
          fullName: data?.name || user?.name || "",
          specialization: data?.doctorProfile?.specialization || prev.specialization,
          experienceYears:
            data?.doctorProfile?.experienceYears > 0 ? String(data.doctorProfile.experienceYears) : "",
          consultationFee:
            data?.doctorProfile?.consultationFee > 0 ? String(data.doctorProfile.consultationFee) : "",
          availableStart: data?.doctorProfile?.availableStart || prev.availableStart,
          availableEnd: data?.doctorProfile?.availableEnd || prev.availableEnd,
          clinicName: data?.doctorProfile?.clinicName || ""
        }));
      } catch (err) {
        setError(err.message);
      }
    };

    loadProfile();
  }, [token, user?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        fullName: form.fullName,
        specialization: form.specialization,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        availableStart: form.availableStart,
        availableEnd: form.availableEnd,
        clinicName: form.clinicName
      };

      if (!payload.fullName.trim()) throw new Error("Full name is required");
      if (!payload.experienceYears || payload.experienceYears <= 0)
        throw new Error("Years of experience must be greater than 0");
      if (!payload.consultationFee || payload.consultationFee <= 0)
        throw new Error("Consultation fee must be greater than 0");
      if (!payload.availableStart || !payload.availableEnd)
        throw new Error("Available time slot is required");

      const result = await api.updateDoctorProfile(token, payload);

      if (!result?.doctorProfileComplete) {
        throw new Error("Please fill all required doctor details");
      }

      setSuccess("Profile completed. Redirecting...");
      onProfileCompleted({
        ...user,
        name: result.doctor?.name || user.name,
        doctorProfile: result.doctor?.doctorProfile || {},
        doctorProfileComplete: true
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="card auth-card" style={{ width: "min(700px, 100%)" }}>
        <h1>Doctor Profile Setup</h1>
        <p className="muted">Complete these details before accessing the doctor dashboard.</p>

        <form onSubmit={handleSubmit} className="stack">
          <div>
            <label>1. Full Name</label>
            <input
              placeholder="Dr. Name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label>2. Specialization</label>
            <select
              value={form.specialization}
              onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
              required
            >
              {SPECIALIZATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>3. Years of Experience</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 8"
              value={form.experienceYears}
              onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))}
              required
            />
          </div>

          <div>
            <label>4. Consultation Fee (INR)</label>
            <input
              type="number"
              min="1"
              placeholder="500"
              value={form.consultationFee}
              onChange={(e) => setForm((p) => ({ ...p, consultationFee: e.target.value }))}
              required
            />
          </div>

          <div>
            <label>5. Available Time Slot</label>
            <div className="inline" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <input
                type="time"
                value={form.availableStart}
                onChange={(e) => setForm((p) => ({ ...p, availableStart: e.target.value }))}
                required
              />
              <input
                type="time"
                value={form.availableEnd}
                onChange={(e) => setForm((p) => ({ ...p, availableEnd: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label>6. Hospital / Clinic Name (Optional)</label>
            <input
              placeholder="Clinic or hospital name"
              value={form.clinicName}
              onChange={(e) => setForm((p) => ({ ...p, clinicName: e.target.value }))}
            />
          </div>

          <button disabled={loading} type="submit">
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "#1f7a1f", fontWeight: 600 }}>{success}</p>}
      </section>
    </main>
  );
}
