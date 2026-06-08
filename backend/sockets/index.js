function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);
    require("./handlers/matchmaking")(io, socket);
    require("./handlers/signaling")(io, socket);
    require("./handlers/teardown")(io, socket); 
    require("./handlers/chat")(io, socket);  // owns disconnect now
  });
}
module.exports = registerSocketHandlers;