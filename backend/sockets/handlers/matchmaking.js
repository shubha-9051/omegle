// sockets/handlers/matchmaking.js
const { addToQueue, popPair, removeFromQueue } = require("../../services/queue");
const { setPair } = require("../../services/session");

module.exports = (io, socket) => {
  socket.on("ready", async () => {
    await addToQueue(socket.id);
    const pair = await popPair();

    if (pair) {
      const roomId = `room:${pair.caller}:${pair.callee}`;

      io.sockets.sockets.get(pair.caller)?.join(roomId);
      io.sockets.sockets.get(pair.callee)?.join(roomId);

      await setPair(pair.caller, pair.callee, roomId);   // ← remember the pairing

      io.to(pair.caller).emit("matched", { roomId, role: "caller" });
      io.to(pair.callee).emit("matched", { roomId, role: "callee" });
    }
  });

  // disconnect handled centrally now — see teardown handler
};