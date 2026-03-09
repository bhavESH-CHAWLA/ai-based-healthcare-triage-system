import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Dashboard({ token, user }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPatient = user?.role === "patient";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (isPatient) {
          const [s, h, a] = await Promise.all([
            api.aiStatus(token),
            api.myTriages(token),
            api.myAppointments(token),
          ]);
          setStatus(s);
          setHistory(h || []);
          setAppointments(a || []);
        } else {
          const s = await api.aiStatus(token);
          setStatus(s);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isPatient]);

  return (
    <main className="page app-page">
      <section className="card">
        <h1>Welcome, {user?.name}!</h1>
        <p className="muted">Role: {user?.role}</p>
      </section>

      {isPatient ? (
        <section className="grid">
          {/* Quick Stats */}
          <section className="stack">
            <article className="card">
              <h2>📊 Latest Triage</h2>
              {history.length === 0 ? (
                <p className="muted">No triages yet. Start a new assessment.</p>
              ) : (
                <div className="stack small-gap">
                  <p>
                    Risk Level:{" "}
                    <strong className={`risk ${history[0].triage?.riskLevel}`}>
                      {history[0].triage?.riskLevel}
                    </strong>
                  </p>
                  <p>Conditions: {history[0].triage?.possibleConditions?.join(", ") || "N/A"}</p>
                  <p>Date: {new Date(history[0].createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </article>

            <article className="card">
              <h2>🏥 AI System Status</h2>
              {status ? (
                <div className="stack small-gap">
                  <p>Configured: {String(status.configured)}</p>
                  <p>Model: {status.model}</p>
                </div>
              ) : (
                <p className="muted">Loading...</p>
              )}
            </article>
          </section>

          {/* Appointments & Actions */}
          <section className="stack">
            <article className="card">
              <h2>📅 Upcoming Appointments</h2>
              {appointments.length === 0 ? (
                <p className="muted">No appointments scheduled.</p>
              ) : (
                <ul>
                  {appointments.map((apt) => (
                    <li key={apt._id}>
                      <strong>{new Date(apt.slotStart).toLocaleString()}</strong> with{" "}
                      {apt.doctor?.name}
                      <br />
                      <span className="muted small">Status: {apt.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {/* Quick Action Buttons */}
            <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button onClick={() => navigate("/triage")}>🔍 New Triage</button>
              <button onClick={() => navigate("/appointments")}>📆 Book Appointment</button>
              <button onClick={() => navigate("/guidance")}>❓ Health Guidance</button>
              <button onClick={() => navigate("/history")}>📋 Full History</button>
            </div>
          </section>
        </section>
      ) : (
        <section className="card">
          <h2>🏥 Doctor/Admin Dashboard</h2>
          <p className="muted">Manage patient queue and appointments.</p>
          <button onClick={() => navigate("/queue")}>View Priority Queue</button>
        </section>
      )}
    </main>
  );
}
