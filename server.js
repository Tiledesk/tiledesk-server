#!/usr/bin/env node

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const winston = require('./config/winston');
const version = require('./package.json').version;

// =====================
// CORE SERVICES
// =====================
const connectDB = require('./config/db');
const { connectCache } = require('./config/cache');

// =====================
// WEBSOCKET
// =====================
const webSocketServer = require('./websocket/webSocketServer');

// =====================
// JOBS / SERVICES
// =====================
const subscriptionNotifier = require('./services/subscriptionNotifier');
const botSubscriptionNotifier = require('./services/BotSubscriptionNotifier');
const trainingService = require('./services/trainingService');

// =====================
// CHANNEL MANAGER
// =====================
const channelManager = require('./channels/channelManager');

// =====================
// PUB / MODULES MANAGER
// =====================
let pubModulesManager;
let modulesManager;

// =====================
// SERVER
// =====================
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

// =====================
// STARTUP
// =====================
async function start() {
  try {

    // 1. Mongo
    await connectDB(process.env.MONGO_URI);

    // 2. Redis Cache (TdCache)
    const tdCache = await connectCache();

    // =====================
    // SESSION REDIS STORE (QUI!)
    // =====================
    if (process.env.ENABLE_REDIS_SESSION === "true") {

      const RedisStore = require("connect-redis").default;

      let cacheClient = tdCache._cache?._cache;

      const redisStore = new RedisStore({
        client: cacheClient,
        prefix: "sessions:"
      });

      app.set('redis_client', tdCache);

      winston.info("Redis session enabled");
    }

    // =====================
    // MODULES MANAGER
    // =====================
    try {
      modulesManager = require('./services/modulesManager');
      modulesManager.init({
        express,
        mongoose,
        passport,
        databaseUri: process.env.MONGO_URI
      });
      modulesManager.start();
    } catch (e) {
      winston.info("ModulesManager not present");
    }

    // =====================
    // PUB MODULES
    // =====================
    try {
      pubModulesManager = require('./pubmodules/pubModulesManager');
      pubModulesManager.init({
        express,
        mongoose
      });
      pubModulesManager.start();
    } catch (e) {}

    // =====================
    // WEBSOCKET
    // =====================
    webSocketServer.init(server);

    // =====================
    // SERVICES / JOBS
    // =====================
    subscriptionNotifier.start();
    botSubscriptionNotifier.start();
    trainingService.start();

    // =====================
    // CHANNEL MANAGER
    // =====================
    channelManager.listen();
    channelManager.use(app);

    // =====================
    // START HTTP SERVER
    // =====================
    server.listen(port, () => {
      winston.info(`Tiledesk v${version} running on port ${port}`);
    });

  } catch (err) {
    winston.error("Startup failed", err);
    process.exit(1);
  }
}

// =====================
// ERROR HANDLING
// =====================
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : (port >= 0 ? port : false);
}

function onError(error) {
  if (error.syscall !== 'listen') throw error;

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  winston.info(`Listening on ${bind}`);
}

// =====================
start();