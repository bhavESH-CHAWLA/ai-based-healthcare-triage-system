const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const jsonHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
};

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload)
    }),

  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload)
    }),

  aiStatus: (token) =>
    request("/api/ai/status", {
      headers: jsonHeaders(token)
    }),

  submitSymptoms: (token, payload) =>
    request("/api/symptoms", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  createTriage: (token, payload) =>
    request("/api/ai/triage", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  followUp: (token, payload) =>
    request("/api/ai/follow-up", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  guidance: (token, payload) =>
    request("/api/ai/guidance", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  myTriages: (token) =>
    request("/api/ai/triage/my", {
      headers: jsonHeaders(token)
    }),

  availableDoctors: (token, start, durationMinutes = 30) =>
    request(`/api/doctors/available?start=${encodeURIComponent(start)}&durationMinutes=${durationMinutes}`, {
      headers: jsonHeaders(token)
    }),

  allDoctors: (token) =>
    request("/api/doctors", {
      headers: jsonHeaders(token)
    }),

  myDoctorProfile: (token) =>
    request("/api/doctors/me", {
      headers: jsonHeaders(token)
    }),

  updateDoctorProfile: (token, payload) =>
    request("/api/doctors/profile", {
      method: "PUT",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  bookAppointment: (token, payload) =>
    request("/api/appointments/book", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  myAppointments: (token) =>
    request("/api/appointments/my", {
      headers: jsonHeaders(token)
    }),

  doctorAppointments: (token) =>
    request("/api/appointments/doctor", {
      headers: jsonHeaders(token)
    }),

  priorityQueue: (token) =>
    request("/api/appointments/queue", {
      headers: jsonHeaders(token)
    }),

  updateAppointmentStatus: (token, appointmentId, status) =>
    request(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: jsonHeaders(token),
      body: JSON.stringify({ status })
    }),

  // Admin endpoints
  adminGetAllUsers: (token) =>
    request("/api/admin/users", {
      headers: jsonHeaders(token)
    }),

  adminGetUser: (token, userId) =>
    request(`/api/admin/users/${userId}`, {
      headers: jsonHeaders(token)
    }),

  adminCreateUser: (token, payload) =>
    request("/api/admin/users", {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  adminUpdateUser: (token, userId, payload) =>
    request(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    }),

  adminDeleteUser: (token, userId) =>
    request(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: jsonHeaders(token)
    }),

  adminGetAllAppointments: (token) =>
    request("/api/admin/appointments", {
      headers: jsonHeaders(token)
    }),

  adminDeleteAppointment: (token, appointmentId) =>
    request(`/api/admin/appointments/${appointmentId}`, {
      method: "DELETE",
      headers: jsonHeaders(token)
    })
};
