import { useEffect, useState } from "react";
import { api } from "../api";

export default function HistoryPage({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTriageId, setSelectedTriageId] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await api.myTriages(token);
        setHistory(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [token]);

  const selectedTriage = history.find((t) => t._id === selectedTriageId);

  return (
    <main className="page app-page">
      <header className="card">
        <h1>📋 Triage History</h1>
        <p className="muted">Review your past health assessments</p>
      </header>

      {loading && <p>Loading history...</p>}
      {error && <p className="error">{error}</p>}

      <section className="grid">
        <section className="card stack" style={{ maxHeight: "80vh", overflow: "auto" }}>
          <h2>Assessments ({history.length})</h2>
          {history.length === 0 ? (
            <p className="muted">No triage assessments yet.</p>
          ) : (
            <div className="stack">
              {history.map((triage) => (
                <button
                  key={triage._id}
                  className={`card ${selectedTriageId === triage._id ? "active" : ""}`}
                  onClick={() => setSelectedTriageId(triage._id)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    backgroundColor:
                      selectedTriageId === triage._id ? "#e8f4f8" : "#fff",
                    border:
                      selectedTriageId === triage._id ? "2px solid #0066cc" : "1px solid #ddd",
                    padding: "12px",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 4px 0" }}>
                        <strong>{triage.triage?.riskLevel}</strong>
                      </p>
                      <p className="muted small" style={{ margin: "0" }}>
                        {triage.input?.symptoms?.join(", ")}
                      </p>
                    </div>
                    <p className="muted small" style={{ margin: "0", whiteSpace: "nowrap" }}>
                      {new Date(triage.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="stack">
          {selectedTriage ? (
            <>
              <article className="card">
                <h2>📊 Assessment Details</h2>
                <div className="stack small-gap">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedTriage.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Risk Level:</strong>{" "}
                    <span className={`risk ${selectedTriage.triage?.riskLevel}`}>
                      {selectedTriage.triage?.riskLevel}
                    </span>
                  </p>
                </div>
              </article>

              <article className="card">
                <h2>🔍 Input Information</h2>
                <div className="stack small-gap">
                  {selectedTriage.input?.symptoms && (
                    <p>
                      <strong>Symptoms:</strong> {selectedTriage.input.symptoms.join(", ")}
                    </p>
                  )}
                  {selectedTriage.input?.duration && (
                    <p>
                      <strong>Duration:</strong> {selectedTriage.input.duration}
                    </p>
                  )}
                  {selectedTriage.input?.age && (
                    <p>
                      <strong>Age:</strong> {selectedTriage.input.age}
                    </p>
                  )}
                  {selectedTriage.input?.gender && (
                    <p>
                      <strong>Gender:</strong> {selectedTriage.input.gender}
                    </p>
                  )}
                  {selectedTriage.input?.medicalHistory?.length > 0 && (
                    <p>
                      <strong>Medical History:</strong>{" "}
                      {selectedTriage.input.medicalHistory.join(", ")}
                    </p>
                  )}
                  {selectedTriage.input?.vitals && (
                    <div>
                      <strong>Vital Signs:</strong>
                      <ul style={{ margin: "8px 0 0 0" }}>
                        {selectedTriage.input.vitals.heartRate && (
                          <li>Heart Rate: {selectedTriage.input.vitals.heartRate} bpm</li>
                        )}
                        {selectedTriage.input.vitals.temperatureC && (
                          <li>Temperature: {selectedTriage.input.vitals.temperatureC}°C</li>
                        )}
                        {selectedTriage.input.vitals.spo2 && (
                          <li>SpO2: {selectedTriage.input.vitals.spo2}%</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </article>

              <article className="card">
                <h2>🎯 AI Analysis Results</h2>
                <div className="stack small-gap">
                  <div>
                    <strong>Possible Conditions:</strong>
                    {selectedTriage.triage?.possibleConditions?.length > 0 ? (
                      <ul>
                        {selectedTriage.triage.possibleConditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted small">None identified</p>
                    )}
                  </div>

                  <div>
                    <strong>⚠️ Red Flags:</strong>
                    {selectedTriage.triage?.redFlags?.length > 0 ? (
                      <ul>
                        {selectedTriage.triage.redFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted small">No critical flags</p>
                    )}
                  </div>

                  <div>
                    <strong>💊 Recommended Actions:</strong>
                    {selectedTriage.triage?.recommendedActions?.length > 0 ? (
                      <ol>
                        {selectedTriage.triage.recommendedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="muted small">No specific actions</p>
                    )}
                  </div>
                </div>
              </article>
            </>
          ) : (
            <article className="card">
              <p className="muted">Select an assessment to view details</p>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
