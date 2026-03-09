import { useState } from "react";
import { api } from "../api";

export default function GuidancePage({ token }) {
  const [question, setQuestion] = useState("");
  const [guidance, setGuidance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ask");

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setError("");
    setLoading(true);

    try {
      const result = await api.guidance(token, { question });
      setGuidance(result);
      setHistory((prev) => [{ question, ...result }, ...prev]);
      setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page app-page">
      <header className="card">
        <h1>❓ Health Guidance</h1>
        <p className="muted">Get AI-powered answers to your health questions</p>
      </header>

      <section className="tabs">
        <button
          className={`tab ${activeTab === "ask" ? "active" : ""}`}
          onClick={() => setActiveTab("ask")}
        >
          💬 Ask Question
        </button>
        <button
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          disabled={history.length === 0}
        >
          📚 Question History ({history.length})
        </button>
      </section>

      {activeTab === "ask" && (
        <section className="grid">
          <section className="stack">
            <article className="card stack">
              <h2>Ask Your Question</h2>
              <form onSubmit={handleAskQuestion} className="stack">
                <textarea
                  placeholder="Ask any health-related question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows="6"
                />
                <button disabled={loading || !question.trim()} type="submit">
                  {loading ? "Getting answer..." : "🚀 Get Guidance"}
                </button>
              </form>
              {error && <p className="error">{error}</p>}
            </article>
          </section>

          {guidance && (
            <section className="stack">
              <article className="card">
                <h2>💡 AI Response</h2>
                <div className="stack small-gap">
                  <p>{guidance.answer}</p>
                  {guidance.redFlags && guidance.redFlags.length > 0 && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fff3cd",
                        borderRadius: "4px",
                        borderLeft: "4px solid #ffc107",
                      }}
                    >
                      <strong>⚠️ Important - Red Flags to Watch For:</strong>
                      <ul style={{ marginTop: "8px", marginBottom: "0" }}>
                        {guidance.redFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            </section>
          )}
        </section>
      )}

      {activeTab === "history" && (
        <section className="card stack">
          <h2>📚 Previous Questions & Answers</h2>
          {history.length === 0 ? (
            <p className="muted">No question history yet.</p>
          ) : (
            <div className="stack">
              {history.map((item, idx) => (
                <details key={idx} className="card">
                  <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                    {item.question}
                  </summary>
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                    <p>{item.answer}</p>
                    {item.redFlags && item.redFlags.length > 0 && (
                      <div style={{ marginTop: "12px", color: "#856404" }}>
                        <strong>Red Flags:</strong>
                        <ul>
                          {item.redFlags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
