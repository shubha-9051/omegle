// routes/config.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // TURN entry will be added here in Phase 9, with credentials
    ],
  });
});

module.exports = router;