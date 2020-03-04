var dotenvPath = undefined;

if (process.env.DOTENV_PATH) {
  dotenvPath = process.env.DOTENV_PATH;
  console.log("load dotenv form DOTENV_PATH", dotenvPath);
}

if (process.env.LOAD_DOTENV_SUBFOLDER ) {
  console.log("load dotenv form LOAD_DOTENV_SUBFOLDER");
  dotenvPath = __dirname+'/confenv/.env';
}

require('dotenv').config({ path: dotenvPath});


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var passport = require('passport');
require('./middleware/passport')(passport);

var config = require('./config/database');
var cors = require('cors');
var Project = require("./models/project");
var validtoken = require('./middleware/valid-token');
var noentitycheck = require('./middleware/noentitycheck');
var roleChecker = require('./middleware/has-role');

var winston = require('./config/winston');

//bin start
// https://bretkikehara.wordpress.com/2013/05/02/nodejs-creating-your-first-global-module/
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

if (!databaseUri) {
  winston.warn('DATABASE_URI not specified, falling back to localhost.');
}

winston.info("databaseUri: " + databaseUri);

var autoIndex = true;
if (process.env.MONGOOSE_AUTOINDEX) {
  autoIndex = process.env.MONGOOSE_AUTOINDEX;
}

winston.info("DB AutoIndex: " + autoIndex);

if (process.env.NODE_ENV == 'test')  {
  mongoose.connect(config.databasetest, { "useNewUrlParser": true, "autoIndex": true });
}else {
  mongoose.connect(databaseUri, { "useNewUrlParser": true, "autoIndex": autoIndex });
}

var auth = require('./routes/auth');
var authtest = require('./routes/authtest');
var authtestWithRoleCheck = require('./routes/authtestWithRoleCheck');

var lead = require('./routes/lead');
var message = require('./routes/message');
var department = require('./routes/department');
var faq = require('./routes/faq');
var faq_kb = require('./routes/faq_kb');
var project = require('./routes/project');
var project_user = require('./routes/project_user');
var request = require('./routes/request');
// var setting = require('./routes/setting');

var group = require('./routes/group');

var users = require('./routes/users');
var publicRequest = require('./routes/public-request');
var publicAnalytics = require('./routes/public-analytics');
var pendinginvitation = require('./routes/pending-invitation');
var jwtroute = require('./routes/jwt');
var key = require('./routes/key');
var widgets = require('./routes/widget');
var widgetsLoader = require('./routes/widgetLoader');

// var admin = require('./routes/admin');
var faqpub = require('./routes/faqpub');
var labels = require('./routes/labels');
var fetchLabels = require('./middleware/fetchLabels');
var cannedResponse = require("./routes/cannedResponse");
var tag = require("./routes/tag");

var botSubscriptionNotifier = require('./services/BotSubscriptionNotifier');
botSubscriptionNotifier.start();
 

var faqBotHandler = require('./services/faqBotHandler');
faqBotHandler.listen();

var pubModulesManager = require('./pubmodules/pubModulesManager');
  pubModulesManager.init();

  
var channelManager = require('./channels/channelManager');
channelManager.listen(); 

var modulesManager = undefined;
try {
  // modulesManager = require('@tiledesk-ent/tiledesk-server-modules').modulesManager;
  modulesManager = require('./services/modulesManager');
  modulesManager.init();
} catch(err) {
  winston.info("ModulesManager not present");
}







if (process.env.ReqLog_ENABLED) {
  var ReqLog = require("./models/reqlog");
}

if (process.env.VisitorCounter_ENABLED) {
  var VisitorCounter = require("./models/visitorCounter");
}

if (process.env.QUEQUE_ENABLED) {
  var queue = require('./modules/queue/reconnect');
}

if (process.env.CACHE_ENABLED) {
  // https://github.com/rv-kip/express-redis-cache
  var cache = require('express-redis-cache')();
}

/*re-enable it
if (process.env.CREATE_INITIAL_DATA!=false) {
    userService.signup("superadmin@td.com", process.env.SUPER_PASSWORD || "superadmin", "Superadmin name", "Superadmin surname", true)
      .then(function (savedUser) {
        winston.info("Created initial user");
      }).catch(function(err) {
        if (err.code == 11000) {
          winston.info("Initial user already exists");
        }else {
          winston.error("Error creating initial data ", err);
        }
        
      }); 
}
*/



var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); //qui dice cequens attento
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-XSRF-Token");
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(morgan('dev'));
// app.use(morgan('combined'));



// app.use(bodyParser.json());

// https://stackoverflow.com/questions/18710225/node-js-get-raw-request-body-using-express

app.use(bodyParser.json({
  verify: function (req, res, buf) {
    // var url = req.originalUrl;
    // if (url.indexOf('/stripe/')) {
      req.rawBody = buf.toString();
      winston.debug("bodyParser verify stripe", req.rawBody);
    // } 
  }
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use(morgan('dev'));
app.use(morgan('combined', { stream: winston.stream }));


app.use(passport.initialize());

app.use(cors());

// unused
var reqLogger = function (req, res, next) {
  if (process.env.ReqLog_ENABLED) {
      var projectid = req.params.projectid;
      winston.debug("projectIdSetter projectid", projectid);

      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      winston.debug("fullUrl", fullUrl);

      var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      winston.debug("ip", ip);

      var reqlog = new ReqLog({
        path: req.originalUrl,
        host: req.host,
        origin: req.get('origin'),
        ip: ip,
        id_project: projectid,
      });

      reqlog.save(function (err, reqlogSaved) {
        if (err) {
          winston.error('Error saving reqlog ', err)
        }
        winston.debug('Reqlog saved ', reqlogSaved)
      });

      next()
  }else {
    next();
  }
}

var visitorCounter = function (req, res, next) {
  if (process.env.VisitorCounter_ENABLED) {
      try {
        var projectid = req.projectid;
        winston.debug("visitorCounter projectIdSetter projectid:" + projectid);

      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      winston.debug("fullUrl:"+ fullUrl);
      winston.debug("req.get('origin'):" + req.get('origin'));

      VisitorCounter.findOneAndUpdate({ origin: req.get('origin'),id_project:  projectid}, 
      { path: req.originalUrl,origin: req.get('origin'),  id_project:  projectid, $inc: { totalViews: 1 } }, {new: true, upsert:true },function(err, VisitorCounterSaved) {
        if (err) {
          winston.error('Error saving reqlog ', err)
        }
        winston.debug("visitorCounter saved "+ VisitorCounterSaved);
      });

      next()
      }
      catch(e){}
  }else {
    next();
  }
}




app.get('/', function (req, res) {  
  res.send('Hello from Tiledesk server. It\'s UP. See the documentation here http://developer.tiledesk.com');
});

  


var projectIdSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  winston.debug("projectIdSetter projectid: "+ projectid);

  // if (projectid) {
    req.projectid = projectid;
  // }
  
  next()
}





var projectSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  winston.debug("projectSetter projectid:" + projectid);

  if (projectid) {
    Project.findById(projectid, function(err, project){
      if (err) {
        winston.warn("Problem getting project with id: " + projectid);
      }
  
      winston.debug("projectSetter project:" + project);
      if (!project) {
        next();
      } else {
        req.project = project;
        next(); //call next one time for projectSetter function
      }
    
    });
  
  }else {
    next()
  }
  

}

// app.use('/admin', admin);

//oauth2
// app.get('/dialog/authorize', oauth2.authorization);
// app.post('/dialog/authorize/decision', oauth2.decision);
// app.post('/oauth/token', oauth2.token);


app.use('/auth', auth);
app.use('/testauth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], authtest);

app.use('/widgets', widgetsLoader);

app.use('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], users);

// TODO security issues
if (process.env.DISABLE_TRANSCRIPT_VIEW_PAGE ) {
  winston.info(" Transcript view page is disabled");
}else {
  app.use('/public/requests', publicRequest);
}

app.use('/:projectid', [projectIdSetter, projectSetter]);


app.use('/:projectid/authtestWithRoleCheck', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], authtestWithRoleCheck);

app.use('/:projectid/leads', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])], lead);

app.use('/:projectid/requests/:request_id/messages', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes(null, ['bot','subscription'])] , message);

// department internal auth check
app.use('/:projectid/departments', department);
//app.use('/:projectid/departments', visitorCounter, department);
// app.use('/:projectid/departments', reqLogger, department);



channelManager.use(app);


app.use('/:projectid/faq', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], faq);

//Deprecated??
app.use('/:projectid/faqpub', faqpub);

app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], faq_kb);

// project internal auth check. TODO check security issues?
app.use('/projects',project);

// app.use('/settings',setting);

app.use('/:projectid/widgets', visitorCounter, widgets);

if (process.env.VisitorCounter_ENABLED) {
  var visitor_Counter = require('./routes/visitorCounter');
  // TODO add check permissions
  app.use('/:projectid/visitorcounter', visitor_Counter);
}

// non mettere ad admin perchà la dashboard  richiama il servizio router.get('/:user_id/:project_id') spesso
// TOOD security issues. internal route check 
// app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], project_user);
app.use('/:projectid/project_users', project_user);

// app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], project_user);

app.use('/:projectid/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])], request);

app.use('/:projectid/groups', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], group);
app.use('/:projectid/publicanalytics', publicAnalytics);

app.use('/:projectid/keys', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], key);

//TODO deprecated?
app.use('/:projectid/jwt', jwtroute);


app.use('/:projectid/pendinginvitations', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], pendinginvitation);
app.use('/:projectid/labels', [fetchLabels],labels);
app.use('/:projectid/canned', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], cannedResponse);
app.use('/:projectid/tags', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], tag);



if (pubModulesManager) {
  pubModulesManager.use(app);
}

if (modulesManager) {
  modulesManager.use(app);
}
 
  
// REENABLEIT
// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
