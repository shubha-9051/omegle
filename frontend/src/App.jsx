import { useState, useRef, useEffect } from "react";
import { useWebRTC } from "./hooks/useWebRTC";
import "./App.css";

export default function App() {
  const {
    status, role, ready, next,
    messages, sendMessage,
    localVideoRef, remoteVideoRef,
  } = useWebRTC();

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef(null);

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  // Keep the chat scrolled to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connected = status === "connected";

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">video chat</h1>
        <span className={`status status-${status}`}>
          {status}{role ? ` · ${role}` : ""}
        </span>
      </header>

      <div className="controls">
        <button className="btn btn-primary" onClick={ready} disabled={status !== "idle"}>
          Ready
        </button>
        <button
          className="btn"
          onClick={next}
          disabled={status === "idle" || status === "waiting"}
        >
          Next
        </button>
      </div>

      <div className="stage">
        <div className="tile">
          <video ref={localVideoRef} className="local" autoPlay muted playsInline />
          <span className="tile-label">You</span>
        </div>
        <div className="tile">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <span className="tile-label">Stranger</span>
          {!connected && (
            <div className="tile-placeholder">
              {status === "idle"
                ? "Click Ready to start"
                : status === "waiting"
                ? "Looking for someone…"
                : "Connecting…"}
            </div>
          )}
        </div>
      </div>

      <div className="chat">
        <div className="messages">
          {messages.length === 0 && (
            <div className="messages-empty">Say hi 👋</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.from === "me" ? "me" : "them"}`}>
              <span className="bubble">{m.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="composer">
          <input
            className="composer-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={connected ? "Type a message…" : "Connect to start chatting"}
            disabled={!connected}
          />
          <button className="btn btn-primary" onClick={send} disabled={!connected}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
