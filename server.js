/**
 * Bootstrap / infrastructure: DB, cache, background jobs, session store, then Express app.
 * HTTP server + WebSocket start via startListen() (and when this file is run as main).
 */

var dotenvPath = undefined;

if (process.env.DOTENV_PATH) {
  dotenvPath = process.env.DOTENV_PATH;
  console.log("load dotenv form DOTENV_PATH", dotenvPath);
}

if (process.env.LOAD_DOTENV_SUBFOLDER) {
  console.log("load dotenv form LOAD_DOTENV_SUBFOLDER");
  dotenvPath = __dirname + "/confenv/.env";
}

require("dotenv").config({ path: dotenvPath });

var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
require("./middleware/passport")(passport);

var config = require("./config/database");
var MaskData = require("maskdata");
var winston = require("./config/winston");

// DATABASE CONNECTION

var databaseUri =
  process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

if (!databaseUri) {
  winston.warn("DATABASE_URI not specified, falling back to localhost.");
}

if (process.env.NODE_ENV == "test") {
  databaseUri = config.databasetest;
}

const masked_databaseUri = MaskData.maskPhone(databaseUri, {
  maskWith: "*",
  unmaskedStartDigits: 15,
  unmaskedEndDigits: 5,
});

if (
  process.env.DISABLE_MONGO_PASSWORD_MASK == true ||
  process.env.DISABLE_MONGO_PASSWORD_MASK == "true"
) {
  winston.info("DatabaseUri: " + databaseUri);
} else {
  winston.info("DatabaseUri masked: " + masked_databaseUri);
}

var autoIndex = true;
if (process.env.MONGOOSE_AUTOINDEX) {
  autoIndex = process.env.MONGOOSE_AUTOINDEX;
}
winston.info("DB AutoIndex: " + autoIndex);

let useUnifiedTopology = process.env.MONGOOSE_UNIFIED_TOPOLOGY === "true";
winston.info("DB useUnifiedTopology: ", useUnifiedTopology, typeof useUnifiedTopology);

mongoose.connect(
  databaseUri,
  {
    useNewUrlParser: true,
    autoIndex: autoIndex,
    useUnifiedTopology: useUnifiedTopology,
  },
  function (err) {
    if (err) {
      winston.error("Failed to connect to MongoDB on " + databaseUri + " ", err);
      process.exit(1);
    }
    winston.info(
      "Mongoose connection done on host: " +
        mongoose.connection.host +
        " on port: " +
        mongoose.connection.port +
        " with name: " +
        mongoose.connection.name
    );
  }
);
if (process.env.MONGOOSE_DEBUG === "true") {
  mongoose.set("debug", true);
}
mongoose.set("strictQuery", true);

const { TdCache } = require("./utils/TdCache");
let tdCache = new TdCache({
  host: process.env.CACHE_REDIS_HOST,
  port: process.env.CACHE_REDIS_PORT,
  password: process.env.CACHE_REDIS_PASSWORD,
});

tdCache.connect();

require("./services/mongoose-cache-fn")(mongoose);

var bootDataLoader = require("./services/bootDataLoader");
var settingDataLoader = require("./services/settingDataLoader");
var schemaMigrationService = require("./services/schemaMigrationService");

var subscriptionNotifier = require("./services/subscriptionNotifier");
subscriptionNotifier.start();

var subscriptionNotifierQueued = require("./services/subscriptionNotifierQueued");

var botSubscriptionNotifier = require("./services/BotSubscriptionNotifier");
botSubscriptionNotifier.start();

var botEvent = require("./event/botEvent");
botEvent.listen();

var trainingService = require("./services/trainingService");
trainingService.start();

var geoService = require("./services/geoService");

var updateLeadQueued = require("./services/updateLeadQueued");
var updateRequestSnapshotQueued = require("./services/updateRequestSnapshotQueued");

let JobsManager = require("./jobsManager");

let jobWorkerEnabled = false;
if (process.env.JOB_WORKER_ENABLED == "true" || process.env.JOB_WORKER_ENABLED == true) {
  jobWorkerEnabled = true;
}
winston.info("JobsManager jobWorkerEnabled: " + jobWorkerEnabled);

let jobsManager = new JobsManager(
  jobWorkerEnabled,
  geoService,
  botEvent,
  subscriptionNotifierQueued,
  botSubscriptionNotifier,
  updateLeadQueued,
  updateRequestSnapshotQueued
);

var faqBotHandler = require("./services/faqBotHandler");
faqBotHandler.listen();

var pubModulesManager = require("./pubmodules/pubModulesManager");
pubModulesManager.init({
  express: express,
  mongoose: mongoose,
  passport: passport,
  databaseUri: databaseUri,
  routes: {},
  jobsManager: jobsManager,
  tdCache: tdCache,
});

jobsManager.listen();

let whatsappQueue = require("@tiledesk/tiledesk-whatsapp-jobworker");
winston.info("whatsappQueue");
jobsManager.listenWhatsappQueue(whatsappQueue);

let multiWorkerQueue = require("@tiledesk/tiledesk-multi-worker");
winston.info("multiWorkerQueue from App");
jobsManager.listenMultiWorker(multiWorkerQueue);

var channelManager = require("./channels/channelManager");
channelManager.listen();

var BanUserNotifier = require("./services/banUserNotifier");
BanUserNotifier.listen();

const { QuoteManager } = require("./services/QuoteManager");
const RateManager = require("./services/RateManager");

let qm = new QuoteManager({ tdCache: tdCache });
qm.start();

let rm = new RateManager({ tdCache: tdCache });

var modulesManager = undefined;
try {
  modulesManager = require("./services/modulesManager");
  var department = require("./routes/department");
  var project = require("./routes/project");
  var widgets = require("./routes/widget");
  modulesManager.init({
    express: express,
    mongoose: mongoose,
    passport: passport,
    routes: {
      departmentsRoute: department,
      projectsRoute: project,
      widgetsRoute: widgets,
    },
  });
} catch (err) {
  winston.info("ModulesManager not present");
}

if (modulesManager) {
  modulesManager.start();
}

pubModulesManager.start();

settingDataLoader.save();
schemaMigrationService.checkSchemaMigration();

if (process.env.CREATE_INITIAL_DATA !== "false") {
  bootDataLoader.create();
}

const RedisStore = require("connect-redis").default;
const bootstrapContext = require("./bootstrapContext");

if (
  process.env.ENABLE_REDIS_SESSION == true ||
  process.env.ENABLE_REDIS_SESSION == "true"
) {
  let cacheClient = undefined;
  if (pubModulesManager.cache) {
    cacheClient = pubModulesManager.cache._cache._cache;
  }
  bootstrapContext.redisSessionStore = new RedisStore({
    client: cacheClient,
    prefix: "sessions:",
  });
}

var app = require("./app");

app.set("redis_client", tdCache);
app.set("quote_manager", qm);
app.set("rate_manager", rm);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function startListen() {
  var http = require("http");
  var debug = require("debug")("tiledesk-server:server");
  var version = require("./package.json").version;

  var port = normalizePort(process.env.PORT || "3000");
  app.set("port", port);

  var httpServer = http.createServer(app);

  var webSocketServer = require("./websocket/webSocketServer");
  webSocketServer.init(httpServer);

  var listener = httpServer.listen(port, function () {
    console.log(
      "Listening tiledesk-server ver:" +
        version +
        " on port " +
        listener.address().port
    );
  });

  httpServer.on("error", function onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  httpServer.on("listening", function onListening() {
    var addr = httpServer.address();
    var bind =
      typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
  });

  return httpServer;
}

app.startListen = startListen;
module.exports = app;

if (require.main === module) {
  startListen();
}
