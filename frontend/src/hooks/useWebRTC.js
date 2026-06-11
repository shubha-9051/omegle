import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

export function useWebRTC() {
  const [status, setStatus] = useState("idle");      // idle | waiting | matched | connected
  const [role, setRole] = useState(null);

  const [messages, setMessages] = useState([]);   // { from: 'me' | 'them', text }
  const [reactions, setReactions] = useState([]); // { id, emoji } floating reactions

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomIdRef = useRef(null);
  const iceServersRef = useRef([]);
  const pendingCandidatesRef = useRef([]);           // buffer for early ICE candidates
  const reactionIdRef = useRef(0);                   // stable keys for floating reactions

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const sendMessage = useCallback((text) => {
  const clean = text.trim();
  if (!clean) return;
  // Render our own message locally + immediately
  setMessages((prev) => [...prev, { from: "me", text: clean }]);
  // Send to partner via server
  socketRef.current.emit("chat-message", { roomId: roomIdRef.current, text: clean });
}, []);

  // Fire a floating emoji reaction — show locally and relay to partner
  const sendReaction = useCallback((emoji) => {
    setReactions((prev) => [...prev, { id: ++reactionIdRef.current, emoji }]);
    socketRef.current?.emit("reaction", { roomId: roomIdRef.current, emoji });
  }, []);

  // Remove a reaction once its float animation ends
  const removeReaction = useCallback((id) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // --- Build a fresh peer connection ---
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    // Send our tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Remote media arrives
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Local ICE candidates → relay to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          roomId: roomIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // --- Drain buffered ICE candidates after remote description is set ---
  const drainPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(c);
      } catch (e) {
        console.error("ice add error:", e);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // --- Mount: connect socket, load config + media, register handlers ---
  useEffect(() => {
    let mounted = true;
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    (async () => {
      // 1. Config (STUN/TURN)
      const res = await fetch(`${SERVER_URL}/config`);
      const data = await res.json();
      iceServersRef.current = data.iceServers;

      // 2. Local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!mounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    })();

    // --- Matched ---
    socket.on("matched", async ({ roomId, role }) => {
      roomIdRef.current = roomId;
      setRole(role);
      setStatus("matched");

      const pc = createPeerConnection();

      if (role === "caller") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      }
    });

    // --- Callee gets offer → answers ---
    socket.on("offer", async ({ offer }) => {
      const pc = pcRef.current;
      await pc.setRemoteDescription(offer);
      await drainPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId: roomIdRef.current, answer });
    });

    // --- Caller gets answer ---
    socket.on("answer", async ({ answer }) => {
      await pcRef.current.setRemoteDescription(answer);
      await drainPendingCandidates();
    });

    // --- ICE candidates (both sides) ---
    socket.on("ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      // Buffer if remote description not set yet
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error("ice add error:", e);
      }
    });

  socket.on("partner-left", () => {
  setMessages([]);
  closePeer();
  setStatus("waiting");   // Option 1: server auto-requeues us; we just wait for next "matched"
  setRole(null);
  // (Option 2 would be: setStatus("idle") and make them click Ready again)
});

  socket.on("chat-message", ({ text }) => {
  setMessages((prev) => [...prev, { from: "them", text }]);
});

  socket.on("reaction", ({ emoji }) => {
  setReactions((prev) => [...prev, { id: ++reactionIdRef.current, emoji }]);
});

    // Cleanup on unmount
    return () => {
      mounted = false;
      socket.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [createPeerConnection, drainPendingCandidates]);

  // --- Public action ---
  const ready = useCallback(() => {
    setStatus("waiting");
    socketRef.current.emit("ready");
  }, []);

  // A reusable local teardown of the peer connection
const closePeer = useCallback(() => {
  if (pcRef.current) {
    pcRef.current.close();
    pcRef.current = null;
  }
  pendingCandidatesRef.current = [];
  if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
}, []);

// "Next" action
const next = useCallback(() => {
  closePeer();
  setMessages([]); 
  setStatus("waiting");
  setRole(null);
  socketRef.current.emit("next");
}, [closePeer]);

  return {
    status, role, ready, localVideoRef, remoteVideoRef, next,
    sendMessage, messages,
    sendReaction, reactions, removeReaction,
  };
}