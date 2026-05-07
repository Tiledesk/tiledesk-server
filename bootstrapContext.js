/**
 * Populated by server.js before app.js is loaded (e.g. Redis session store).
 * Keeps app.js free of RedisStore creation while avoiding circular requires.
 */
module.exports = {
  redisSessionStore: null,
};
