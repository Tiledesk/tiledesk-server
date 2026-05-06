const { TdCache } = require("../utils/TdCache");

let tdCache;

async function connectCache() {
  tdCache = new TdCache({
    host: process.env.CACHE_REDIS_HOST,
    port: process.env.CACHE_REDIS_PORT,
    password: process.env.CACHE_REDIS_PASSWORD
  });

  await tdCache.connect();

  console.log("Redis cache connected");

  return tdCache;
}

function getCache() {
  return tdCache;
}

module.exports = {
  connectCache,
  getCache
};