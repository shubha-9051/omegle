// config/index.js
module.exports = {
  PORT: process.env.PORT || 3000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
};