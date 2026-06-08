// redis/client.js
const Redis = require("ioredis");
const config = require("../config");

const redis = new Redis(config.REDIS_URL);

redis.on("connect", () => console.log("redis connected"));
redis.on("error", (err) => console.error("redis error:", err.message));

module.exports = redis;