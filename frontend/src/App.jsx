import { useState } from "react";
import { useWebRTC } from "./hooks/useWebRTC";

export default function App() {
  const {
    status, role, ready, next,
    messages, sendMessage,
    localVideoRef, remoteVideoRef,
  } = useWebRTC();

  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>video chat</h1>
      <p>status: {status}{role ? ` (${role})` : ""}</p>

      <button onClick={ready} disabled={status !== "idle"}>Ready</button>
      <button onClick={next} disabled={status === "idle" || status === "waiting"}>
        Next
      </button>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <video ref={localVideoRef} autoPlay muted playsInline width={300} />
        <video ref={remoteVideoRef} autoPlay playsInline width={300} />
      </div>

      {/* Chat */}
      <div style={{ marginTop: 16, maxWidth: 612 }}>
        <div style={{
          border: "1px solid #ccc", height: 160, overflowY: "auto",
          padding: 8, marginBottom: 8,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.from === "me" ? "right" : "left" }}>
              <span style={{
                display: "inline-block", padding: "4px 8px", borderRadius: 8,
                background: m.from === "me" ? "#d0ebff" : "#e9ecef",
              }}>
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            disabled={status !== "connected"}
            style={{ flex: 1, padding: 6 }}
          />
          <button onClick={send} disabled={status !== "connected"}>Send</button>
        </div>
      </div>
    </div>
  );
}