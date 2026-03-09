import { Link, useLocation } from "react-router-dom";

export default function Layout({ user, onLogout }) {
  const location = useLocation();

  const isPatient = user?.role === "patient";
  const isDoctorOrAdmin = user?.role === "doctor" || user?.role === "admin";

  const navLinks = isPatient
    ? [
        { path: "/dashboard", label: "🏠 Home", icon: true },
        { path: "/triage", label: "🔍 New Triage", icon: true },
        { path: "/appointments", label: "📆 Appointments", icon: true },
        { path: "/guidance", label: "❓ Guidance", icon: true },
        { path: "/history", label: "📋 History", icon: true },
      ]
    : [
        { path: "/dashboard", label: "🏠 Home", icon: true },
        { path: "/queue", label: "🏥 Patient Queue", icon: true },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* Top Navigation */}
      <nav
        className="topbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          backgroundColor: "#0066cc",
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Link to="/dashboard" style={{ textDecoration: "none", color: "white" }}>
          <h1 style={{ margin: "0", fontSize: "20px", fontWeight: "bold" }}>
            🏥 Healthcare Triage
          </h1>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0", fontSize: "14px" }}>
              {user?.name} <span style={{ opacity: 0.8 }}>({user?.role})</span>
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <div style={{ display: "flex", flex: 1 }}>
        <aside
          style={{
            width: "200px",
            backgroundColor: "#f8f9fa",
            borderRight: "1px solid #ddd",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                color: isActive(link.path) ? "white" : "#333",
                backgroundColor: isActive(link.path) ? "#0066cc" : "transparent",
                fontWeight: isActive(link.path) ? "bold" : "normal",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.backgroundColor = "#e8f4f8";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", backgroundColor: "#f5f5f5", padding: "20px" }}>
          {/* This will be replaced by Route content */}
        </main>
      </div>
    </div>
  );
}
