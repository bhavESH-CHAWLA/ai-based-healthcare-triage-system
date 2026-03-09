import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TriagePage from "./pages/TriagePage";
import AppointmentsPage from "./pages/AppointmentsPage";
import GuidancePage from "./pages/GuidancePage";
import HistoryPage from "./pages/HistoryPage";
import DoctorQueuePage from "./pages/DoctorQueuePage";
import AdminManagementPage from "./pages/AdminManagementPage";
import DoctorOnboardingPage from "./pages/DoctorOnboardingPage";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("triage_token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("triage_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [checkingDoctorProfile, setCheckingDoctorProfile] = useState(false);

  const isLoggedIn = Boolean(token);
  const isDoctorProfileRequired = user?.role === "doctor" && user?.doctorProfileComplete !== true;

  useEffect(() => {
    if (!token || user?.role !== "doctor") return;

    const refreshDoctorProfile = async () => {
      try {
        setCheckingDoctorProfile(true);
        const profile = await api.myDoctorProfile(token);
        const nextUser = {
          ...user,
          name: profile.name || user.name,
          doctorProfile: profile.doctorProfile || {},
          doctorProfileComplete: Boolean(profile.doctorProfileComplete)
        };
        setUser(nextUser);
        localStorage.setItem("triage_user", JSON.stringify(nextUser));
      } catch (error) {
        // Keep existing local user if profile fetch fails.
      } finally {
        setCheckingDoctorProfile(false);
      }
    };

    refreshDoctorProfile();
  }, [token, user?.role]);

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("triage_token");
    localStorage.removeItem("triage_user");
  };

  if (!isLoggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<AuthPage setToken={setToken} setUser={setUser} />} />
        </Routes>
      </Router>
    );
  }

  if (checkingDoctorProfile) {
    return (
      <main className="page auth-page">
        <section className="card auth-card">
          <h1>Loading profile...</h1>
        </section>
      </main>
    );
  }

  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            backgroundColor: "#0066cc",
            color: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          <h1 style={{ margin: "0", fontSize: "20px", fontWeight: "bold" }}>Healthcare Triage System</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right", fontSize: "14px" }}>
              <p style={{ margin: "0" }}>
                {user?.name} <span style={{ opacity: 0.8 }}>({user?.role})</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <div style={{ display: "flex", flex: 1 }}>
          <aside
            style={{
              width: "220px",
              backgroundColor: "#f8f9fa",
              borderRight: "1px solid #ddd",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflowY: "auto"
            }}
          >
            <NavItem to="/dashboard" label="Dashboard" />

            {user?.role === "patient" && (
              <>
                <NavItem to="/triage" label="New Triage" />
                <NavItem to="/appointments" label="Appointments" />
                <NavItem to="/guidance" label="Guidance" />
                <NavItem to="/history" label="History" />
              </>
            )}

            {user?.role === "doctor" && (
              <>
                {isDoctorProfileRequired ? (
                  <NavItem to="/doctor-onboarding" label="Complete Profile" />
                ) : (
                  <NavItem to="/queue" label="Patient Queue" />
                )}
              </>
            )}

            {user?.role === "admin" && (
              <>
                <NavItem to="/queue" label="Patient Queue" />
                <NavItem to="/admin" label="Management" />
              </>
            )}
          </aside>

          <main style={{ flex: 1, overflowY: "auto", backgroundColor: "#f5f5f5" }}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  isDoctorProfileRequired ? (
                    <Navigate to="/doctor-onboarding" />
                  ) : (
                    <Dashboard token={token} user={user} />
                  )
                }
              />

              <Route
                path="/doctor-onboarding"
                element={
                  user?.role === "doctor" ? (
                    <DoctorOnboardingPage
                      token={token}
                      user={user}
                      onProfileCompleted={(updatedUser) => {
                        setUser(updatedUser);
                        localStorage.setItem("triage_user", JSON.stringify(updatedUser));
                      }}
                    />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                }
              />

              {user?.role === "patient" && (
                <>
                  <Route path="/triage" element={<TriagePage token={token} />} />
                  <Route path="/appointments" element={<AppointmentsPage token={token} />} />
                  <Route path="/guidance" element={<GuidancePage token={token} />} />
                  <Route path="/history" element={<HistoryPage token={token} />} />
                </>
              )}

              {(user?.role === "admin" || (user?.role === "doctor" && !isDoctorProfileRequired)) && (
                <Route path="/queue" element={<DoctorQueuePage token={token} />} />
              )}

              {user?.role === "admin" && <Route path="/admin" element={<AdminManagementPage token={token} />} />}

              <Route
                path="/"
                element={<Navigate to={isDoctorProfileRequired ? "/doctor-onboarding" : "/dashboard"} />}
              />
              <Route
                path="*"
                element={<Navigate to={isDoctorProfileRequired ? "/doctor-onboarding" : "/dashboard"} />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function NavItem({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
      style={{
        padding: "10px 12px",
        borderRadius: "6px",
        textDecoration: "none",
        color: isActive ? "white" : "#333",
        backgroundColor: isActive ? "#0066cc" : "transparent",
        fontWeight: isActive ? "bold" : "normal",
        transition: "all 0.2s",
        cursor: "pointer",
        display: "block"
      }}
    >
      {label}
    </a>
  );
}
