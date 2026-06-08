// services/queue.js
const redis = require("../redis/client");

const QUEUE_KEY = "waiting";

// Atomic two-pop via Lua: pull two users, or none.
// If only one is present, leave it in place.
const POP_PAIR = `
  local a = redis.call('LPOP', KEYS[1])
  if not a then return {} end
  local b = redis.call('LPOP', KEYS[1])
  if not b then
    redis.call('RPUSH', KEYS[1], a)
    return {}
  end
  return {a, b}
`;

async function addToQueue(userId) {
  await redis.rpush(QUEUE_KEY, userId);
}

async function popPair() {
  const result = await redis.eval(POP_PAIR, 1, QUEUE_KEY);
  if (result.length === 2) {
    return { caller: result[0], callee: result[1] };
  }
  return null;
}

// Needed for cleanup later (disconnect/next): remove a specific user
async function removeFromQueue(userId) {
  await redis.lrem(QUEUE_KEY, 0, userId);
}

module.exports = { addToQueue, popPair, removeFromQueue };