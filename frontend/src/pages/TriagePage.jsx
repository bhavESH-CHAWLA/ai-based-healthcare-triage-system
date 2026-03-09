import { useMemo, useState } from "react";
import { api } from "../api";

const initialCase = {
  symptoms: "",
  duration: "",
  age: "",
  gender: "male",
  medicalHistory: "",
  currentMedications: "",
  heartRate: "",
  temperatureC: "",
  spo2: "",
  systolicBP: "",
  diastolicBP: "",
};

const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function TriagePage({ token }) {
  const [form, setForm] = useState(initialCase);
  const [triage, setTriage] = useState(null);
  const [followUp, setFollowUp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("input");

  const payload = useMemo(
    () => ({
      symptoms: parseList(form.symptoms),
      duration: form.duration,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender,
      medicalHistory: parseList(form.medicalHistory),
      currentMedications: parseList(form.currentMedications),
      vitals: {
        heartRate: form.heartRate ? Number(form.heartRate) : undefined,
        temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        systolicBP: form.systolicBP ? Number(form.systolicBP) : undefined,
        diastolicBP: form.diastolicBP ? Number(form.diastolicBP) : undefined,
      },
    }),
    [form]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.submitSymptoms(token, {
        symptoms: payload.symptoms,
        duration: payload.duration,
        age: payload.age,
        gender: payload.gender,
      });

      const report = await api.createTriage(token, payload);
      const questions = await api.followUp(token, payload);

      setTriage(report.data);
      setFollowUp(questions.questions || []);
      setActiveTab("results");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialCase);
    setTriage(null);
    setFollowUp([]);
    setActiveTab("input");
  };

  return (
    <main className="page app-page">
      <header className="card">
        <h1>🔍 AI Triage Assessment</h1>
        <p className="muted">Use AI to analyze symptoms and get health recommendations</p>
      </header>

      <section className="tabs">
        <button
          className={`tab ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
        >
          📝 Input Symptoms
        </button>
        <button
          className={`tab ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
          disabled={!triage}
        >
          📊 Results
        </button>
      </section>

      {activeTab === "input" && (
        <section className="card stack">
          <form onSubmit={handleSubmit} className="stack">
            <h2>Symptom and Health Information</h2>

            <div>
              <label>Primary Symptoms (comma-separated)</label>
              <textarea
                placeholder="e.g., fever, cough, headache"
                value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                required
                rows="3"
              />
            </div>

            <div className="grid">
              <div>
                <label>Duration</label>
                <input
                  placeholder="e.g., 2 days, 1 week"
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                />
              </div>
              <div>
                <label>Age</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                />
              </div>
              <div>
                <label>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label>Medical History (comma-separated)</label>
              <input
                placeholder="e.g., diabetes, hypertension, asthma"
                value={form.medicalHistory}
                onChange={(e) => setForm((p) => ({ ...p, medicalHistory: e.target.value }))}
              />
            </div>

            <div>
              <label>Current Medications (comma-separated)</label>
              <input
                placeholder="e.g., aspirin, metformin"
                value={form.currentMedications}
                onChange={(e) => setForm((p) => ({ ...p, currentMedications: e.target.value }))}
              />
            </div>

            <h3>Vital Signs (Optional)</h3>
            <div className="grid">
              <div>
                <label>Heart Rate (bpm)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="60-100"
                  value={form.heartRate}
                  onChange={(e) => setForm((p) => ({ ...p, heartRate: e.target.value }))}
                />
              </div>
              <div>
                <label>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={form.temperatureC}
                  onChange={(e) => setForm((p) => ({ ...p, temperatureC: e.target.value }))}
                />
              </div>
              <div>
                <label>SpO2 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="95-100"
                  value={form.spo2}
                  onChange={(e) => setForm((p) => ({ ...p, spo2: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid">
              <div>
                <label>Systolic BP</label>
                <input
                  type="number"
                  placeholder="120"
                  value={form.systolicBP}
                  onChange={(e) => setForm((p) => ({ ...p, systolicBP: e.target.value }))}
                />
              </div>
              <div>
                <label>Diastolic BP</label>
                <input
                  type="number"
                  placeholder="80"
                  value={form.diastolicBP}
                  onChange={(e) => setForm((p) => ({ ...p, diastolicBP: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button disabled={loading} type="submit">
                {loading ? "Analyzing..." : "🚀 Run AI Triage"}
              </button>
              <button type="reset" className="ghost" onClick={() => setForm(initialCase)}>
                Clear Form
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </form>
        </section>
      )}

      {activeTab === "results" && triage && (
        <section className="grid">
          <section className="stack">
            <article className="card">
              <h2>🎯 Risk Assessment</h2>
              <div className="stack small-gap">
                <p>
                  <strong>Risk Level:</strong>{" "}
                  <span className={`risk ${triage.triage.riskLevel}`}>
                    {triage.triage.riskLevel}
                  </span>
                </p>
                <p>
                  <strong>Possible Conditions:</strong>
                  <br />
                  {triage.triage.possibleConditions?.length > 0
                    ? triage.triage.possibleConditions.join(", ")
                    : "N/A"}
                </p>
              </div>
            </article>

            <article className="card">
              <h2>⚠️ Red Flags</h2>
              {triage.triage.redFlags?.length > 0 ? (
                <ul>
                  {triage.triage.redFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No critical red flags detected.</p>
              )}
            </article>
          </section>

          <section className="stack">
            <article className="card">
              <h2>💊 Recommended Actions</h2>
              {triage.triage.recommendedActions?.length > 0 ? (
                <ol>
                  {triage.triage.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              ) : (
                <p className="muted">No specific actions recommended.</p>
              )}
            </article>

            <article className="card">
              <h2>❓ Follow-up Questions</h2>
              {followUp?.length > 0 ? (
                <ul>
                  {followUp.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No follow-up questions.</p>
              )}
            </article>

            <button
              onClick={handleReset}
              style={{ backgroundColor: "#6c757d" }}
            >
              ↺ New Assessment
            </button>
          </section>
        </section>
      )}
    </main>
  );
}
