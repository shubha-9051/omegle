// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const config = require("./config");
const configRoutes = require("./routes/config");
const healthRoutes = require("./routes/health");
const registerSocketHandlers = require("./sockets");

// --- Express (REST surface) ---
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.CLIENT_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/health", healthRoutes);  
app.use("/config", configRoutes);
 // mount the router

// --- HTTP server (shared foundation) ---
const server = http.createServer(app);

// --- Socket.IO (live surface) ---
const io = new Server(server, {
  cors: { origin: config.CLIENT_ORIGIN, methods: ["GET", "POST"] },
});
registerSocketHandlers(io);          // wire in the handlers

// --- Start ---
server.listen(config.PORT, () => {
  console.log(`server listening on http://localhost:${config.PORT}`);
});



process.on("SIGINT", () => {
  console.log("shutting down...");
  io.close();
  server.close(() => process.exit(0));
});