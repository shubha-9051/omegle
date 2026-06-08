// sockets/handlers/chat.js
module.exports = (io, socket) => {
  socket.on("chat-message", ({ roomId, text }) => {
    // MODERATION SEAM: scan/log/rate-limit `text` here later.
    // For now, basic guard: ignore empty or oversized messages.
    if (typeof text !== "string") return;
    const clean = text.trim();
    if (!clean || clean.length > 1000) return;

    // Relay to the other person in the room (not back to sender)
    socket.to(roomId).emit("chat-message", { text: clean });
  });
};