import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function AuthPage({ setToken, setUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await api.register(form);
        setMode("login");
        setForm({ name: "", email: "", password: "", role: "patient" });
      } else {
        const result = await api.login({ email: form.email, password: form.password });
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem("triage_token", result.token);
        localStorage.setItem("triage_user", JSON.stringify(result.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="card auth-card">
        <h1>🏥 AI Healthcare Triage System</h1>
        <p className="muted">Smart diagnosis and appointment management</p>
        
        <form onSubmit={handleSubmit} className="stack">
          {mode === "register" && (
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          {mode === "register" && (
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          )}
          <button disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          className="ghost"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError("");
          }}
        >
          {mode === "register" ? "Have an account? Sign In" : "Need an account? Register"}
        </button>

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
