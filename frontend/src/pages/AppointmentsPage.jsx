import { useEffect, useState } from "react";
import { api } from "../api";

const nowPlusMinutes = (minutes) => {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatTriageReason = (triageItem) => {
  if (!triageItem) return "";
  const risk = triageItem?.triage?.riskLevel || "medium";
  const symptoms = (triageItem?.input?.symptoms || []).slice(0, 4).join(", ");
  return `Triage(${risk}) - Symptoms: ${symptoms || "not specified"}`;
};

export default function AppointmentsPage({ token }) {
  const [slotStart, setSlotStart] = useState(nowPlusMinutes(120));
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const [selectedTriageId, setSelectedTriageId] = useState("");
  const [useTriageReason, setUseTriageReason] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("find");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const selectedTriage = history.find((item) => item._id === selectedTriageId) || history[0] || null;

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const [apps, hist] = await Promise.all([api.myAppointments(token), api.myTriages(token)]);
        setAppointments(apps || []);
        setHistory(hist || []);

        if ((hist || []).length > 0) {
          setSelectedTriageId(hist[0]._id);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    loadAppointments();
  }, [token]);

  const handleFindDoctors = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.availableDoctors(token, new Date(slotStart).toISOString(), durationMinutes);
      setAvailableDoctors(data.doctors || []);
      if ((data.doctors || []).length === 0) {
        setError("No doctors available for the selected time slot.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setError("");
    setLoading(true);
    try {
      if (!selectedDoctorId) throw new Error("Please select a doctor");

      const triageIdToUse = selectedTriageId || history?.[0]?._id;

      await api.bookAppointment(token, {
        doctorId: selectedDoctorId,
        slotStart: new Date(slotStart).toISOString(),
        durationMinutes: Number(durationMinutes),
        reason: useTriageReason ? "" : reason,
        triageReportId: triageIdToUse
      });

      const myApps = await api.myAppointments(token);
      setAppointments(myApps || []);
      setBookingConfirmed(true);

      setSelectedDoctorId("");
      setReason("");
      setUseTriageReason(true);
      setSlotStart(nowPlusMinutes(120));

      setTimeout(() => {
        setActiveTab("appointments");
        setBookingConfirmed(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page app-page">
      <header className="card">
        <h1>Appointment Management</h1>
        <p className="muted">Schedule a consultation with a doctor</p>
      </header>

      <section className="tabs">
        <button className={`tab ${activeTab === "find" ? "active" : ""}`} onClick={() => setActiveTab("find")}>
          Find and Book
        </button>
        <button className={`tab ${activeTab === "appointments" ? "active" : ""}`} onClick={() => setActiveTab("appointments")}>
          My Appointments ({appointments.length})
        </button>
      </section>

      {activeTab === "find" && (
        <section className="grid">
          <section className="stack">
            <article className="card stack">
              <h2>Select Time Slot</h2>

              <div>
                <label>Date and Time</label>
                <input type="datetime-local" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
              </div>

              <div>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  max="120"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>

              <button onClick={handleFindDoctors} disabled={loading}>
                {loading ? "Searching..." : "Find Available Doctors"}
              </button>

              {error && <p className="error">{error}</p>}
            </article>

            <article className="card stack">
              <h2>Select Doctor</h2>
              {availableDoctors.length === 0 ? (
                <p className="muted">Click "Find Available Doctors" to see options for this time slot.</p>
              ) : (
                <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
                  <option value="">-- Select a doctor --</option>
                  {availableDoctors
                    .filter((doc) => doc.available)
                    .map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} | {doc.doctorProfile?.specialization || "General"}
                      </option>
                    ))}
                </select>
              )}
            </article>
          </section>

          <section className="stack">
            <article className="card stack">
              <h2>Consultation Details</h2>

              {history.length > 0 && (
                <div>
                  <label>Select Triage Result</label>
                  <select value={selectedTriageId} onChange={(e) => setSelectedTriageId(e.target.value)}>
                    {history.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.triage?.riskLevel || "medium"} | {(item.input?.symptoms || []).slice(0, 3).join(", ")} | {new Date(item.createdAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={useTriageReason}
                  onChange={(e) => setUseTriageReason(e.target.checked)}
                />
                Use selected triage result as reason
              </label>

              <div>
                <label>Reason for Visit</label>
                <textarea
                  placeholder="Describe your concern briefly..."
                  value={useTriageReason ? formatTriageReason(selectedTriage) : reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="4"
                  disabled={useTriageReason}
                />
              </div>

              {selectedTriage && (
                <p className="muted small">
                  Selected triage: {selectedTriage?.triage?.riskLevel || "medium"} | {new Date(selectedTriage.createdAt).toLocaleDateString()}
                </p>
              )}

              <button
                onClick={handleBook}
                disabled={loading || !selectedDoctorId}
                style={{ backgroundColor: selectedDoctorId ? "#28a745" : "#ccc" }}
              >
                {loading ? "Booking..." : "Book Appointment"}
              </button>

              {bookingConfirmed && <p style={{ color: "#28a745", fontWeight: "bold" }}>Appointment booked successfully.</p>}
            </article>
          </section>
        </section>
      )}

      {activeTab === "appointments" && (
        <section className="card stack">
          <h2>Your Appointments</h2>
          {appointments.length === 0 ? (
            <div className="muted">
              <p>No appointments scheduled yet.</p>
              <p>
                Go to the <strong>Find and Book</strong> tab to schedule one.
              </p>
            </div>
          ) : (
            <div className="stack">
              {appointments.map((apt) => (
                <div key={apt._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3>{apt.doctor?.name}</h3>
                      <p className="muted">{apt.doctor?.doctorProfile?.specialization || "General"}</p>
                      <p>
                        <strong>Date and Time:</strong> {new Date(apt.slotStart).toLocaleString()}
                      </p>
                      <p>
                        <strong>Duration:</strong> {apt.durationMinutes} minutes
                      </p>
                      {apt.reason && (
                        <p>
                          <strong>Reason:</strong> {apt.reason}
                        </p>
                      )}
                      {apt.triageReport?.triage?.riskLevel && (
                        <p className="small muted">
                          Linked triage: {apt.triageReport.triage.riskLevel} | {(apt.triageReport.input?.symptoms || []).slice(0, 3).join(", ")}
                        </p>
                      )}
                      <p className="small muted">
                        Priority: {apt.priorityLevel} (Score: {apt.priorityScore})
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        backgroundColor:
                          apt.status === "completed" ? "#d4edda" : apt.status === "confirmed" ? "#d1ecf1" : "#fff3cd",
                        color: apt.status === "completed" ? "#155724" : apt.status === "confirmed" ? "#0c5460" : "#856404",
                        fontWeight: "bold"
                      }}
                    >
                      {apt.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
