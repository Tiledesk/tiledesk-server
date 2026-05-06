require('dotenv').config({
  path: process.env.DOTENV_PATH || undefined
});

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const winston = require('./config/winston');
const version = require('./package.json').version;
require('./middleware/passport')(passport);

const app = express();

// =====================
// VIEW ENGINE
// =====================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// =====================
// BASIC MIDDLEWARE
// =====================
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json({ limit: process.env.JSON_BODY_LIMIT || '500KB' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// =====================
// PROJECT MIDDLEWARE
// =====================
const authMiddleware = require('./middleware/auth.middleware');
const projectMiddleware = require('./middleware/project.middleware');

// =====================
// SESSION (NO REDIS SETUP HERE)
// =====================
const sessionSecret = process.env.SESSION_SECRET || "tiledesk-session-secret";

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
}));


// =====================
// ROUTES
// =====================
const answered = require('./routes/answered');
const auth = require('./routes/auth');
const authtest = require('./routes/authtest');
const authtestWithRoleCheck = require('./routes/authtestWithRoleCheck');
const cacheUtil = require('./utils/cacheUtil');
const campaigns = require('./routes/campaigns');
const copilot = require('./routes/copilot');
const department = require('./routes/department');
const email = require('./routes/email');
const faq = require('./routes/faq');
const faqpub = require('./routes/faqpub');
const faq_kb = require('./routes/faq_kb');
const fetchLabels = require('./middleware/fetchLabels');
const files = require('./routes/files');
const filesp = require('./routes/filesp');
const group = require('./routes/group');
const jwtroute = require('./routes/jwt');
const kb = require('./routes/kb');
const kbsettings = require('./routes/kbsettings');
const key = require('./routes/key');
const images = require('./routes/images');
const integration = require('./routes/integration');
const labels = require('./routes/labels');
const lead = require('./routes/lead');
const llm = require('./routes/llm');
const logs = require('./routes/logs');
const mcp = require('./routes/mcp');
const message = require('./routes/message');
const messagesRootRoute = require('./routes/messagesRoot');
const openai = require('./routes/openai');
const orgUtil = require("./utils/orgUtil");
const quotes = require('./routes/quotes');
const pendinginvitation = require('./routes/pending-invitation');
const project = require('./routes/project');
const project_user = require('./routes/project_user');
const project_users_test = require('./routes/project_user_test');
const property = require('./routes/property');
const publicAnalytics = require('./routes/public-analytics');
const publicRequest = require('./routes/public-request');
const request = require('./routes/request');
const requestUtilRoot = require('./routes/requestUtilRoot');
const resthook = require('./routes/subscription');
const roles = require('./routes/roles');
const segment = require('./routes/segment');
const tag = require('./routes/tag');
const troubleshooting = require('./routes/troubleshooting');
const unanswered = require('./routes/unanswered');
const urls = require('./routes/urls');
const users = require('./routes/users');
const userRequest = require('./routes/user-request');
const usersUtil = require('./routes/users-util');
const webhook = require('./routes/webhook');
const webhooks = require('./routes/webhooks');
const widgets = require('./routes/widget');
const widgetsLoader = require('./routes/widgetLoader');

// TEMP ROUTES
const aiagents = require('./routes/aiagent');
const permissions = require('./routes/permissions_test');

app.get('/', (req, res) => {
  res.send(`Hello from Tiledesk server v${version}. It\'s UP. See the documentation here http://developer.tiledesk.com`);
});

app.use(passport.session());
app.use(authMiddleware);


// =====================
// PRIVATE ROUTES MIDDLEWARE
// =====================
app.use("/:projectid", projectMiddleware);

// =====================
// PUBLIC ROUTES MIDDLEWARE
// =====================
app.use('/auth', auth);
app.use('/files', files);
app.use('/images', images);
app.use('/logs', [passport.authenticate(['basic', 'jwt'], { session: false })], logs);
app.use('/requests_util', [passport.authenticate(['basic', 'jwt'], { session: false })], requestUtilRoot);
app.use('/testauth', [passport.authenticate(['basic', 'jwt'], { session: false })], authtest);
app.use('/troubleshooting', troubleshooting);
app.use('/urls', urls);
app.use('/users', [passport.authenticate(['basic', 'jwt'], { session: false })], users);
app.use('/users_util', usersUtil);
app.use('/w', widgetsLoader);
app.use('/widgets', widgetsLoader);










module.exports = app;