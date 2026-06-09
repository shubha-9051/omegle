const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const TURN_SECRET = process.env.TURN_SECRET;
const TURN_URL = process.env.TURN_URL;

function makeTurnCredentials() {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const username = String(expiry);
  const hmac = crypto.createHmac("sha1", TURN_SECRET);
  hmac.update(username);
  return { username, credential: hmac.digest("base64") };
}

router.get("/", (req, res) => {
  const iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

  if (TURN_SECRET && TURN_URL) {
    const { username, credential } = makeTurnCredentials();
    iceServers.push({ urls: [TURN_URL], username, credential });
  }

  res.json({ iceServers });
});

module.exports = router;