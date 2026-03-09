import { useEffect, useState } from "react";
import { api } from "../api";

export default function DoctorQueuePage({ token }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  useEffect(() => {
    loadQueue();
  }, [token]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await api.priorityQueue(token);
      setQueue(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setStatusUpdating(appointmentId);
    try {
      await api.updateAppointmentStatus(token, appointmentId, newStatus);
      await loadQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusUpdating(null);
    }
  };

  const selectedAppt = queue.find((a) => a._id === selectedApptId);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#d4edda";
      case "confirmed":
        return "#d1ecf1";
      case "pending":
        return "#fff3cd";
      default:
        return "#f8f9fa";
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case "critical":
        return "#f8d7da";
      case "high":
        return "#fff3cd";
      case "medium":
        return "#d1ecf1";
      case "low":
        return "#d4edda";
      default:
        return "#f8f9fa";
    }
  };

  return (
    <main className="page app-page">
      <header className="card">
        <h1>🏥 Patient Priority Queue</h1>
        <p className="muted">Manage appointments and patient flow</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="grid">
        <section className="card stack" style={{ maxHeight: "80vh", overflow: "auto" }}>
          <h2>Queue ({queue.length})</h2>
          {loading && <p>Loading queue...</p>}
          {queue.length === 0 ? (
            <p className="muted">No appointments in queue.</p>
          ) : (
            <div className="stack">
              {queue.map((appt) => (
                <button
                  key={appt._id}
                  className="card"
                  onClick={() => setSelectedApptId(appt._id)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    backgroundColor:
                      selectedApptId === appt._id
                        ? getPriorityColor(appt.priorityLevel)
                        : "#fff",
                    border:
                      selectedApptId === appt._id ? "2px solid #0066cc" : "1px solid #ddd",
                    padding: "12px",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>
                        {appt.patient?.name}
                      </p>
                      <p className="muted small" style={{ margin: "0 0 4px 0" }}>
                        {new Date(appt.slotStart).toLocaleString()}
                      </p>
                      <p className="small" style={{ margin: "0" }}>
                        Priority:{" "}
                        <strong
                          style={{
                            color:
                              appt.priorityLevel === "critical"
                                ? "#dc3545"
                                : appt.priorityLevel === "high"
                                ? "#fd7e14"
                                : appt.priorityLevel === "medium"
                                ? "#0066cc"
                                : "#28a745",
                          }}
                        >
                          {appt.priorityLevel.toUpperCase()}
                        </strong>{" "}
                        ({appt.priorityScore})
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: getStatusColor(appt.status),
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {appt.status.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="stack">
          {selectedAppt ? (
            <>
              <article className="card">
                <h2>👤 Patient Information</h2>
                <div className="stack small-gap">
                  <p>
                    <strong>Name:</strong> {selectedAppt.patient?.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedAppt.patient?.email}
                  </p>
                </div>
              </article>

              <article className="card">
                <h2>📅 Appointment Details</h2>
                <div className="stack small-gap">
                  <p>
                    <strong>Date & Time:</strong>{" "}
                    {new Date(selectedAppt.slotStart).toLocaleString()}
                  </p>
                  <p>
                    <strong>Duration:</strong> {selectedAppt.durationMinutes} minutes
                  </p>
                  {selectedAppt.reason && (
                    <p>
                      <strong>Reason:</strong> {selectedAppt.reason}
                    </p>
                  )}
                </div>
              </article>

              <article className="card">
                <h2>⚠️ Priority Assessment</h2>
                <div className="stack small-gap">
                  <p>
                    <strong>Level:</strong>{" "}
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: getPriorityColor(selectedAppt.priorityLevel),
                        color:
                          selectedAppt.priorityLevel === "critical"
                            ? "#721c24"
                            : selectedAppt.priorityLevel === "high"
                            ? "#856404"
                            : selectedAppt.priorityLevel === "medium"
                            ? "#0c5460"
                            : "#155724",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedAppt.priorityLevel.toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <strong>Priority Score:</strong> {selectedAppt.priorityScore}
                  </p>
                </div>
              </article>

              {selectedAppt.triageReport && (
                <article className="card">
                  <h2>🔍 Triage Report</h2>
                  <div className="stack small-gap">
                    <p>
                      <strong>Risk Level:</strong>{" "}
                      <span
                        className={`risk ${selectedAppt.triageReport.triage?.riskLevel}`}
                      >
                        {selectedAppt.triageReport.triage?.riskLevel}
                      </span>
                    </p>
                    {selectedAppt.triageReport.triage?.redFlags?.length > 0 && (
                      <div>
                        <strong>Red Flags:</strong>
                        <ul>
                          {selectedAppt.triageReport.triage.redFlags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              )}

              <article className="card">
                <h2>⚙️ Update Status</h2>
                <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                  {["pending", "confirmed", "completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedAppt._id, status)}
                      disabled={
                        statusUpdating === selectedAppt._id ||
                        selectedAppt.status === status
                      }
                      style={{
                        backgroundColor:
                          selectedAppt.status === status ? "#ccc" : "#0066cc",
                        cursor:
                          selectedAppt.status === status || statusUpdating === selectedAppt._id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          selectedAppt.status === status || statusUpdating === selectedAppt._id
                            ? 0.6
                            : 1,
                      }}
                    >
                      {statusUpdating === selectedAppt._id ? "Updating..." : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              </article>
            </>
          ) : (
            <article className="card">
              <p className="muted">Select an appointment to view details</p>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
