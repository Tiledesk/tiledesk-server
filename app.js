/**
 * Express application only (routes + middleware). Infrastructure runs from server.js first.
 */

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var passport = require("passport");

var cors = require("cors");
var validtoken = require("./middleware/valid-token");
var projectMw = require("./middlewares/project.middleware");
var authMw = require("./middlewares/auth.middleware");

var winston = require("./config/winston");

var troubleshooting = require("./routes/troubleshooting");
var auth = require("./routes/auth");
var authtest = require("./routes/authtest");
var authtestWithRoleCheck = require("./routes/authtestWithRoleCheck");

var lead = require("./routes/lead");
var message = require("./routes/message");
var messagesRootRoute = require("./routes/messagesRoot");
var department = require("./routes/department");
var group = require("./routes/group");
var resthook = require("./routes/subscription");
var tag = require("./routes/tag");
var faq = require("./routes/faq");
var faq_kb = require("./routes/faq_kb");
var project = require("./routes/project");
var project_user = require("./routes/project_user");
var project_users_test = require("./routes/project_user_test");
var request = require("./routes/request");
var users = require("./routes/users");
var usersUtil = require("./routes/users-util");
var publicRequest = require("./routes/public-request");
var userRequest = require("./routes/user-request");
var publicAnalytics = require("./routes/public-analytics");
var pendinginvitation = require("./routes/pending-invitation");
var jwtroute = require("./routes/jwt");
var key = require("./routes/key");
var widgets = require("./routes/widget");
var widgetsLoader = require("./routes/widgetLoader");
var openai = require("./routes/openai");
var llm = require("./routes/llm");
var quotes = require("./routes/quotes");
var integration = require("./routes/integration");
var kbsettings = require("./routes/kbsettings");
var kb = require("./routes/kb");
var unanswered = require("./routes/unanswered");
var answered = require("./routes/answered");

var faqpub = require("./routes/faqpub");
var labels = require("./routes/labels");
var fetchLabels = require("./middleware/fetchLabels");
var images = require("./routes/images");
var files = require("./routes/files");
let filesp = require("./routes/filesp");
var campaigns = require("./routes/campaigns");
var logs = require("./routes/logs");
var requestUtilRoot = require("./routes/requestUtilRoot");
var urls = require("./routes/urls");
var email = require("./routes/email");
var property = require("./routes/property");
var segment = require("./routes/segment");
var webhook = require("./routes/webhook");
var webhooks = require("./routes/webhooks");
var roles = require("./routes/roles");
var copilot = require("./routes/copilot");
var mcp = require("./routes/mcp");

var RouterLogger = require("./models/routerLogger");
const session = require("express-session");
const bootstrapContext = require("./bootstrapContext");

var channelManager = require("./channels/channelManager");

var IPFilter = require("./middleware/ipFilter");

const { ChatbotService } = require("./services/chatbotService");

var pubModulesManager = require("./pubmodules/pubModulesManager");

var modulesManager = undefined;
try {
  modulesManager = require("./services/modulesManager");
} catch (err) {
  winston.info("ModulesManager not present");
}

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.set("chatbot_service", new ChatbotService());

if (process.env.ENABLE_ALTERNATIVE_CORS_MIDDLEWARE === "true") {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token, x-api-key"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    next();
  });

  winston.info("Enabled alternative cors middleware");
} else {
  winston.info("Used standard cors middleware");
}

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "500KB";
winston.debug("JSON_BODY_LIMIT : " + JSON_BODY_LIMIT);

const WEBHOOK_BODY_LIMIT = process.env.WEBHOOK_BODY_LIMIT || "5mb";
winston.debug("WEBHOOK_BODY_LIMIT : " + WEBHOOK_BODY_LIMIT);

const webhookParser = bodyParser.json({ limit: WEBHOOK_BODY_LIMIT });

app.use("/webhook", webhookParser, webhook);

app.use(
  bodyParser.json({
    limit: JSON_BODY_LIMIT,
    verify: function (req, res, buf) {
      req.rawBody = buf.toString();
      winston.debug("bodyParser verify stripe", req.rawBody);
    },
  })
);

app.use(
  bodyParser.urlencoded({ limit: JSON_BODY_LIMIT, extended: true })
);

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

if (process.env.ENABLE_ACCESSLOG) {
  app.use(morgan("combined", { stream: winston.stream }));
}

app.use(passport.initialize());
app.set("trust proxy", 1);

if (
  process.env.DISABLE_SESSION_STRATEGY == true ||
  process.env.DISABLE_SESSION_STRATEGY == "true"
) {
  winston.info("Express Session disabled");
} else {
  let sessionSecret =
    process.env.SESSION_SECRET || "tiledesk-session-secret";

  if (
    process.env.ENABLE_REDIS_SESSION == true ||
    process.env.ENABLE_REDIS_SESSION == "true"
  ) {
    console.log("Starting redis...");

    app.use(
      session({
        store: bootstrapContext.redisSessionStore,
        resave: false,
        saveUninitialized: false,
        secret: sessionSecret,
        cookie: {
          secure: true,
          httpOnly: true,
          sameSite: "None",
        },
      })
    );
    winston.info(
      "Express Session with Redis enabled with Secret: " + sessionSecret
    );
  } else {
    app.use(session({ secret: sessionSecret }));
    winston.info(
      "Express Session enabled with Secret: " + sessionSecret
    );
  }

  app.use(passport.session());
}

app.use(cors());
app.options("*", cors());

console.log("MAX_UPLOAD_FILE_SIZE: ", process.env.MAX_UPLOAD_FILE_SIZE);

if (process.env.ROUTELOGGER_ENABLED === "true") {
  winston.info("RouterLogger enabled ");
  app.use(function (req, res, next) {
    try {
      var projectid = req.projectid;
      winston.debug(
        "RouterLogger projectIdSetter projectid:" + projectid
      );

      var fullUrl =
        req.protocol + "://" + req.get("host") + req.originalUrl;
      winston.debug("fullUrl:" + fullUrl);
      winston.debug(" req.get('host'):" + req.get("host"));

      winston.debug("req.get('origin'):" + req.get("origin"));
      winston.debug("req.get('referer'):" + req.get("referer"));

      var routerLogger = new RouterLogger({
        origin: req.get("origin"),
        fullurl: fullUrl,
        url: req.originalUrl.split("?").shift(),
        id_project: projectid,
      });

      routerLogger.save(function (err, savedRouterLogger) {
        if (err) {
          winston.error("Error saving RouterLogger ", err);
        }
        winston.debug("RouterLogger saved " + savedRouterLogger);
        next();
      });
    } catch (e) {
      winston.error("Error saving RouterLogger ", e);
      next();
    }
  });
} else {
  winston.info("RouterLogger disabled ");
}

app.get("/", function (req, res) {
  res.send(
    "Hello from Tiledesk server. It's UP. See the documentation here http://developer.tiledesk.com"
  );
});

app.use("/troubleshooting", troubleshooting);
app.use("/auth", auth);
app.use("/testauth", [authMw.authenticateRequired, validtoken], authtest);

app.use("/widgets", widgetsLoader);
app.use("/w", widgetsLoader);

app.use("/images", images);
app.use("/files", files);
app.use("/urls", urls);
app.use("/users", [authMw.authenticateRequired, validtoken], users);
app.use("/users_util", usersUtil);
app.use("/logs", [authMw.authenticateRequired, validtoken], logs);
app.use(
  "/requests_util",
  [authMw.authenticateRequired, validtoken],
  requestUtilRoot
);

if (process.env.DISABLE_TRANSCRIPT_VIEW_PAGE) {
  winston.info(" Transcript view page is disabled");
} else {
  app.use("/public/requests", publicRequest);
}

app.use("/projects", project);

channelManager.use(app);

if (pubModulesManager) {
  pubModulesManager.use(app);
}

if (modulesManager) {
  modulesManager.use(app);
}

app.use("/:projectid/", [
  projectMw.projectIdSetter,
  projectMw.projectSetter,
  IPFilter.projectIpFilter,
  IPFilter.projectIpFilterDeny,
  IPFilter.decodeJwt,
  IPFilter.projectBanUserFilter,
]);

app.use(
  "/:projectid/authtestWithRoleCheck",
  [authMw.authenticateRequired, validtoken],
  authtestWithRoleCheck
);

app.use(
  "/:projectid/project_users_test",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  project_users_test
);

app.use(
  "/:projectid/leads",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  lead
);
app.use(
  "/:projectid/requests/:request_id/messages",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  message
);

app.use(
  "/:projectid/messages",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  messagesRootRoute
);

app.use("/:projectid/departments", department);

channelManager.useUnderProjects(app);

app.use(
  "/:projectid/groups",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  group
);
app.use(
  "/:projectid/tags",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  tag
);
app.use(
  "/:projectid/subscriptions",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  resthook
);

app.use(
  "/:projectid/faq",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  faq
);
app.use(
  "/:projectid/intents",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  faq
);

app.use("/:projectid/faqpub", faqpub);

app.use(
  "/:projectid/faq_kb",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  faq_kb
);
app.use(
  "/:projectid/bots",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  faq_kb
);

app.use("/:projectid/widgets", widgets);

app.use("/:projectid/project_users", project_user);

app.use(
  "/:projectid/requests",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  userRequest
);

app.use(
  "/:projectid/requests",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  request
);

app.use("/:projectid/publicanalytics", publicAnalytics);

app.use(
  "/:projectid/keys",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  key
);

app.use("/:projectid/jwt", jwtroute);

app.use(
  "/:projectid/pendinginvitations",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  pendinginvitation
);
app.use("/:projectid/labels", [fetchLabels], labels);

app.use(
  "/:projectid/campaigns",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  campaigns
);

app.use(
  "/:projectid/emails",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  email
);

app.use(
  "/:projectid/properties",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  property
);
app.use(
  "/:projectid/segments",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  segment
);

app.use(
  "/:projectid/llm",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  llm
);
app.use("/:projectid/openai", openai);
app.use(
  "/:projectid/quotes",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  quotes
);

app.use(
  "/:projectid/integration",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  integration
);

app.use(
  "/:projectid/mcp",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  mcp
);

app.use(
  "/:projectid/kbsettings",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  kbsettings
);
app.use(
  "/:projectid/kb/unanswered",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  unanswered
);
app.use(
  "/:projectid/kb/answered",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  answered
);
app.use(
  "/:projectid/kb",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  kb
);

app.use(
  "/:projectid/logs",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  logs
);

app.use(
  "/:projectid/webhooks",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  webhooks
);
app.use(
  "/:projectid/copilot",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  copilot
);
app.use(
  "/:projectid/roles",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  roles
);

app.use("/:projectid/files", filesp);

if (pubModulesManager) {
  pubModulesManager.useUnderProjects(app);
}

if (modulesManager) {
  modulesManager.useUnderProjects(app);
}

app.use((err, req, res, next) => {
  winston.debug("err.name", err.name);
  if (err.name === "IpDeniedError") {
    winston.debug("IpDeniedError");
    return res.status(401).json({ err: "error ip filter" });
  }

  const realIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.ip;

  if (err.code === "LIMIT_FILE_SIZE") {
    winston.debug("LIMIT_FILE_SIZE");
    winston.warn(`LIMIT_FILE_SIZE on ${req.originalUrl}`, {
      limit: process.env.MAX_UPLOAD_FILE_SIZE,
      ip: req.ip,
      realIp: realIp,
    });
    return res.status(413).json({
      err: "Content Too Large",
      limit_file_size: process.env.MAX_UPLOAD_FILE_SIZE,
    });
  }

  if (
    err.type === "entity.too.large" ||
    err.name === "PayloadTooLargeError"
  ) {
    winston.warn("Payload too large", {
      expected: err.expected,
      limit: err.limit,
      length: err.length,
    });
    return res
      .status(413)
      .json({ err: "Request entity too large", limit: err.limit });
  }

  winston.error("General error: ", err);
  return res.status(500).json({ err: "error" });
});

module.exports = app;
