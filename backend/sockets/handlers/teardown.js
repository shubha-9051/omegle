// sockets/handlers/teardown.js
const { clearSession } = require("../../services/session");
const { removeFromQueue, addToQueue, popPair } = require("../../services/queue");
const { setPair } = require("../../services/session");

// Core teardown: end the current session, notify + optionally requeue the partner.
// `requeueSelf` and `requeuePartner` control behavior for Next vs disconnect.
async function teardown(io, socketId, { requeueSelf, requeuePartner }) {
  await removeFromQueue(socketId);
  const session = await clearSession(socketId);

  let partner = null;
  if (session && session.partner) {
    partner = session.partner;
    const { roomId } = session;

    io.sockets.sockets.get(socketId)?.leave(roomId);
    io.sockets.sockets.get(partner)?.leave(roomId);
    io.to(partner).emit("partner-left");
  }

  // Requeue the clicker FIRST so they get priority for a waiting partner
  if (requeueSelf) {
    await requeueAndMaybeMatch(io, socketId);
  }

  // Then requeue the abandoned partner
  if (requeuePartner && partner) {
    await requeueAndMaybeMatch(io, partner);
  }
}

// Re-add a user and immediately try to match them
async function requeueAndMaybeMatch(io, userId) {
  // Only requeue if the socket is still connected
  if (!io.sockets.sockets.get(userId)) return;

  await addToQueue(userId);
  const pair = await popPair();
  if (pair) {
    const roomId = `room:${pair.caller}:${pair.callee}`;
    io.sockets.sockets.get(pair.caller)?.join(roomId);
    io.sockets.sockets.get(pair.callee)?.join(roomId);
    await setPair(pair.caller, pair.callee, roomId);
    io.to(pair.caller).emit("matched", { roomId, role: "caller" });
    io.to(pair.callee).emit("matched", { roomId, role: "callee" });
  }
}

module.exports = (io, socket) => {
  // NEXT: user wants a new partner. Requeue both.
  socket.on("next", async () => {
     console.log("NEXT received from", socket.id);  
    await teardown(io, socket.id, { requeueSelf: true, requeuePartner: true });
  });

  // DISCONNECT: tab closed or network dropped. Requeue partner only (this socket is gone).
  socket.on("disconnect", async () => {
    await teardown(io, socket.id, { requeueSelf: false, requeuePartner: true });
  });

  
};