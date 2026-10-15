import { useEffect, useRef, useState } from "react";
import Message from "./Message.jsx";

const SESSION_KEY = "hospital-rag-session";
const SESSIONS_KEY = "hospital-rag-sessions";

const QUICK = [
  { icon: "🏢", label: "Departments", q: "Hospital mein kaun kaun se departments hain?" },
  { icon: "🩺", label: "Doctor Information", q: "Doctors ki information batayein" },
  { icon: "📅", label: "Appointment Policy", q: "Appointment policy kya hai?" },
  { icon: "🛡️", label: "Insurance Policy", q: "Insurance policy kya hai?" },
  { icon: "❓", label: "General FAQs", q: "Hospital ke general FAQs batayein" },
];

const WELCOME = {
  role: "assistant",
  content:
     "Hello! 👋 Welcome to CityCare Hospital’s Virtual Assistant.",
};

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSessions(list) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
  } catch {}
}

function dayGroup(ts) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return "Earlier";
}

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Chat() {
  const [sessionId, setSessionId] = useState(getSessionId);
  const [sessions, setSessions] = useState(loadSessions);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([WELCOME]);
    fetch(`/api/chat/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.messages?.length) setMessages([WELCOME, ...data.messages]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function touchSession(id, firstMessage) {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === id);
      const next = exists
        ? prev.map((s) => (s.id === id ? { ...s, ts: Date.now() } : s))
        : [{ id, title: firstMessage.slice(0, 40), ts: Date.now() }, ...prev];
      next.sort((a, b) => b.ts - a.ts);
      saveSessions(next);
      return next;
    });
  }

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: message, ts: Date.now() }]);
    touchSession(sessionId, message);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Request failed");

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, sources: data.sources, ts: Date.now() },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Sorry, kuch gadbad ho gayi: ${err.message}`, error: true, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function switchSession(id) {
    if (id === sessionId) return;
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {}
    setSessionId(id);
  }

  function newChat() {
    const id = crypto.randomUUID();
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {}
    setSessionId(id);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // sidebar grouping
  const groups = {};
  sessions.forEach((s) => {
    const g = dayGroup(s.ts);
    (groups[g] = groups[g] || []).push(s);
  });

  return (
    <div className="layout">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">✚</div>
          <div>
            <div className="brand-name">
              CityCare <span>Hospital</span>
            </div>
            <div className="brand-sub">AI Assistant</div>
          </div>
        </div>

        <button className="new-chat" onClick={newChat}>
          <span className="plus">+</span> New Chat
        </button>

        <div className="history">
          {["Today", "Yesterday", "Earlier"].map(
            (g) =>
              groups[g] && (
                <div key={g}>
                  <div className="history-group">{g}</div>
                  {groups[g].map((s) => (
                    <button
                      key={s.id}
                      className={`history-item ${s.id === sessionId ? "active" : ""}`}
                      onClick={() => switchSession(s.id)}
                    >
                      <span className="history-icon">💬</span>
                      <span className="history-text">
                        <span className="history-title">{s.title}</span>
                        <span className="history-time">{fmtTime(s.ts)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )
          )}
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="main">
        <header className="topbar">
          <div className="bot-badge">🤖</div>
          <div className="topbar-text">
            <h1>Hospital AI Assistant</h1>
            <p>Get instant answers about our hospital services, departments, policies and more.</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" title="New chat" onClick={newChat}>🕘</button>
            <div className="user-avatar">👤</div>
          </div>
        </header>

        <div className="messages">
          {messages.map((m, i) => (
            <Message key={i} message={m} fmtTime={fmtTime} />
          ))}

          {loading && (
            <div className="row row-bot">
              <div className="avatar">🤖</div>
              <div className="bubble bubble-bot typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="footer">
          <div className="composer">
            <span className="attach">📎</span>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about the hospital..."
            />
            <button className="send" onClick={() => send()} disabled={loading || !input.trim()} title="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <div className="quick">
            {QUICK.map((c) => (
              <button key={c.label} className="chip" onClick={() => send(c.q)} disabled={loading}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
          <p className="disclaimer">
            Ye assistant medical advice nahi deta. Health concerns ke liye doctor se consult karein.
          </p>
        </div>
      </main>
    </div>
  );
}