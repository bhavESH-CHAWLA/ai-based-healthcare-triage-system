import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminManagementPage({ token }) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedApptId, setSelectedApptId] = useState(null);

  // User form state
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadAppointments();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.adminGetAllUsers(token);
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.adminGetAllAppointments(token);
      setAppointments(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      setError("All fields required");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateUser(token, userForm);
      setUserForm({ name: "", email: "", password: "", role: "patient" });
      setShowCreateForm(false);
      loadUsers();
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setLoading(true);
    try {
      await api.adminDeleteUser(token, userId);
      loadUsers();
      setSelectedUserId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;

    setLoading(true);
    try {
      await api.adminDeleteAppointment(token, appointmentId);
      loadAppointments();
      setSelectedApptId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u._id === selectedUserId);
  const selectedAppt = appointments.find((a) => a._id === selectedApptId);

  return (
    <main className="page app-page">
      <header className="card">
        <h1>⚙️ Admin Management Console</h1>
        <p className="muted">Manage users and appointments</p>
      </header>

      <section className="tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`tab ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          📅 Appointments ({appointments.length})
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      {activeTab === "users" && (
        <section className="grid">
          <section className="card stack" style={{ maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Users</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{ padding: "8px 12px", fontSize: "0.9rem" }}
              >
                {showCreateForm ? "✕ Close" : "+ New User"}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateUser} className="card stack">
                <h3>Create New User</h3>
                <input
                  placeholder="Full Name"
                  value={userForm.name}
                  onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
                <button disabled={loading} type="submit">
                  {loading ? "Creating..." : "Create User"}
                </button>
              </form>
            )}

            {loading && <p>Loading...</p>}
            {users.length === 0 ? (
              <p className="muted">No users found.</p>
            ) : (
              <div className="stack">
                {users.map((user) => (
                  <button
                    key={user._id}
                    className="card"
                    onClick={() => setSelectedUserId(user._id)}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      backgroundColor: selectedUserId === user._id ? "#e8f4f8" : "#fff",
                      border: selectedUserId === user._id ? "2px solid #0066cc" : "1px solid #ddd",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>{user.name}</p>
                        <p className="muted small" style={{ margin: "0" }}>{user.email}</p>
                      </div>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            user.role === "admin"
                              ? "#f8d7da"
                              : user.role === "doctor"
                              ? "#d1ecf1"
                              : "#d4edda",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="stack">
            {selectedUser ? (
              <>
                <article className="card">
                  <h2>👤 User Details</h2>
                  <div className="stack small-gap">
                    <p>
                      <strong>Name:</strong> {selectedUser.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedUser.email}
                    </p>
                    <p>
                      <strong>Role:</strong>{" "}
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            selectedUser.role === "admin"
                              ? "#f8d7da"
                              : selectedUser.role === "doctor"
                              ? "#d1ecf1"
                              : "#d4edda",
                        }}
                      >
                        {selectedUser.role.toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </article>

                <div className="card">
                  <button
                    onClick={() => handleDeleteUser(selectedUser._id)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#dc3545",
                      width: "100%",
                    }}
                  >
                    {loading ? "Deleting..." : "🗑️ Delete User"}
                  </button>
                </div>
              </>
            ) : (
              <article className="card">
                <p className="muted">Select a user to view details</p>
              </article>
            )}
          </section>
        </section>
      )}

      {activeTab === "appointments" && (
        <section className="grid">
          <section className="card stack" style={{ maxHeight: "80vh", overflow: "auto" }}>
            <h2>Appointments</h2>
            {loading && <p>Loading...</p>}
            {appointments.length === 0 ? (
              <p className="muted">No appointments found.</p>
            ) : (
              <div className="stack">
                {appointments.map((appt) => (
                  <button
                    key={appt._id}
                    className="card"
                    onClick={() => setSelectedApptId(appt._id)}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      backgroundColor: selectedApptId === appt._id ? "#e8f4f8" : "#fff",
                      border: selectedApptId === appt._id ? "2px solid #0066cc" : "1px solid #ddd",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>
                          {appt.patient?.name || "Unknown Patient"}
                        </p>
                        <p className="muted small" style={{ margin: "0 0 4px 0" }}>
                          {new Date(appt.slotStart).toLocaleString()}
                        </p>
                        <p className="small" style={{ margin: "0" }}>
                          Doctor: {appt.doctor?.name || "Unassigned"}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            appt.status === "completed"
                              ? "#d4edda"
                              : appt.status === "confirmed"
                              ? "#d1ecf1"
                              : "#fff3cd",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {appt.status.toUpperCase()}
                      </span>
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
                  <h2>📅 Appointment Details</h2>
                  <div className="stack small-gap">
                    <p>
                      <strong>Patient:</strong> {selectedAppt.patient?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Doctor:</strong> {selectedAppt.doctor?.name || "Unassigned"}
                    </p>
                    <p>
                      <strong>Date & Time:</strong>{" "}
                      {new Date(selectedAppt.slotStart).toLocaleString()}
                    </p>
                    <p>
                      <strong>Duration:</strong> {selectedAppt.durationMinutes} minutes
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            selectedAppt.status === "completed"
                              ? "#d4edda"
                              : selectedAppt.status === "confirmed"
                              ? "#d1ecf1"
                              : "#fff3cd",
                        }}
                      >
                        {selectedAppt.status.toUpperCase()}
                      </span>
                    </p>
                    {selectedAppt.reason && (
                      <p>
                        <strong>Reason:</strong> {selectedAppt.reason}
                      </p>
                    )}
                  </div>
                </article>

                <div className="card">
                  <button
                    onClick={() => handleDeleteAppointment(selectedAppt._id)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#dc3545",
                      width: "100%",
                    }}
                  >
                    {loading ? "Deleting..." : "🗑️ Delete Appointment"}
                  </button>
                </div>
              </>
            ) : (
              <article className="card">
                <p className="muted">Select an appointment to view details</p>
              </article>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
