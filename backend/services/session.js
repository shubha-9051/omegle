// services/session.js
const redis = require("../redis/client");

// Map each user to their partner + room. Stored as a Redis hash per user.
async function setPair(a, b, roomId) {
  // store both directions so either socket can find its partner
  await redis.hset(`session:${a}`, { partner: b, roomId });
  await redis.hset(`session:${b}`, { partner: a, roomId });
}

async function getSession(userId) {
  const data = await redis.hgetall(`session:${userId}`);
  return data && data.partner ? data : null;   // { partner, roomId } or null
}

async function clearSession(userId) {
  const data = await redis.hgetall(`session:${userId}`);
  await redis.del(`session:${userId}`);
  if (data && data.partner) {
    await redis.del(`session:${data.partner}`);
  }
  return data && data.partner ? data : null;   // return what we cleared, for notifying partner
}

module.exports = { setPair, getSession, clearSession };