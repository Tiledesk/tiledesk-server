require('dotenv').config();

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
// var Project_user = require("./models/project_user");
var validtoken = require('./middleware/valid-token');
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
winston.info("autoIndex: " + autoIndex);

if (process.env.NODE_ENV == 'test')  {
  mongoose.connect(config.databasetest, { "autoIndex": true });
}else {
  mongoose.connect(databaseUri, { "autoIndex": autoIndex });
}

var auth = require('./routes/auth');
var lead = require('./routes/lead');
var message = require('./routes/message');
var department = require('./routes/department');
var faq = require('./routes/faq');
var bot = require('./routes/bot');
var faq_kb = require('./routes/faq_kb');
var project = require('./routes/project');
var firebaseAuth = require('./routes/firebaseauth');
var project_user = require('./routes/project_user');
var request = require('./routes/request');
//var setting = require('./routes/setting');

var group = require('./routes/group');

// new 
var users = require('./routes/users');
var publicRequest = require('./routes/public-request');
var analytics = require('./routes/analytics');
var publicAnalytics = require('./routes/public-analytics');
var pendinginvitation = require('./routes/pending-invitation');
var subscription = require('./routes/subscription');
var firebase = require('./routes/firebase');
var jwtroute = require('./routes/jwt');
var key = require('./routes/key');
var activities = require('./routes/activity');
var widgets = require('./routes/widget');

var appRules = require('./rules/global/appRules');
appRules.start();


//var cache = require('express-redis-cache')();

var subscriptionNotifier = require('./services/SubscriptionNotifier');
subscriptionNotifier.start();

var botSubscriptionNotifier = require('./services/BotSubscriptionNotifier');
botSubscriptionNotifier.start();


var faqBotHandler = require('./services/faqBotHandler');
faqBotHandler.listen();

var activityArchiver = require('./services/activityArchiver');
activityArchiver.listen();

var channelManager = require('./channels/channelManager');
channelManager.listen();


var ReqLog = require("./models/reqlog");
var VisitorCounter = require("./models/visitorCounter");

if (process.env.QUEQUE_ENABLED) {
  var queue = require('./queue/reconnect');
}

if (process.env.CACHE_ENABLED) {
  // https://github.com/rv-kip/express-redis-cache
  var cache = require('express-redis-cache')();
}


var app = express();



// var messageWsService = require('./services/messageWsService');
// messageWsService.init(app);
// end uncomment

// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 40510 });

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });

//   setInterval(
//     () => ws.send(`ciao il ${new Date()}`),
//     1000
//   )
// });

// var expressWs = require('express-ws')(express());
// var app = expressWs.app;
// var expressWs = require('express-ws')(app);

// //var expressWs = expressWs(express());
// // var app2 = expressWs.app;

// app.ws('/', function(ws, req) {
//   ws.on('message', function(msg) {
//     console.log("messageXXXXX", msg);
//   });
//   console.log('socketXXXXX', req.testing);
// });



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(morgan('dev'));
// app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use(morgan('dev'));
app.use(morgan('combined', { stream: winston.stream }));


app.use(passport.initialize());

app.use(cors());

// unused
var reqLogger = function (req, res, next) {
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
    //console.log('Reqlog saved ', reqlogSaved)
  });

  next()
}

var visitorCounter = function (req, res, next) {
  var projectid = req.projectid;
  winston.info("visitorCounter projectIdSetter projectid:" + projectid);

 var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
 winston.info("fullUrl:"+ fullUrl);
 winston.info("req.get('origin'):" + req.get('origin'));

 VisitorCounter.findOneAndUpdate({ origin: req.get('origin'),id_project:  projectid}, 
 { path: req.originalUrl,origin: req.get('origin'),  id_project:  projectid, $inc: { totalViews: 1 } }, {new: true, upsert:true },function(err, VisitorCounterSaved) {
   if (err) {
     winston.error('Error saving reqlog ', err)
   }
   winston.info("visitorCounter saved "+ VisitorCounterSaved);
 });

 next()
}




app.get('/', function (req, res) {  
  res.send('Hello from Tiledesk server. It\'s UP. See the documentation here http://docs.tiledesk.com.');
});

  


var projectIdSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  //console.log("projectIdSetter projectid", projectid);

  // if (projectid) {
    req.projectid = projectid;
  // }
  
  next()
}





var projectSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  //console.log("projectSetter projectid", projectid);

  if (projectid) {
    Project.findById(projectid, function(err, project){
      if (err) {
         console.warn("Problem getting project with id",projectid);
        //console.warn("Error getting project with id",projectid, err);
      }
  
      if (!project) {
        //console.warn("Project not found for id", req.projectid);
        next();
      } else {
        req.project = project;
        // console.log("req.project", req.project);
        next(); //call next one time for projectSetter function
      }
    
    });
  
  }else {
    next()
  }
  

}


app.use('/auth', auth);
app.use('/testauth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  res.send('{"success":true}');
});

// deprecated
app.use('/firebase/auth', firebaseAuth);




//  app.use('/:projectid', [projectIdSetter]);
app.use('/:projectid', [projectIdSetter, projectSetter]);

// http://aleksandrov.ws/2013/09/12/restful-api-with-nodejs-plus-mongodb/
// app.use('/:projectid', [passport.authenticate(['basic','jwt'], { session: false }), validtoken]);

app.use('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], users);
app.use('/:projectid/leads', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], lead);

//TODO crud hasrole ma create per BelongsToProject anche bot,visitor, lead,etc..
app.use('/:projectid/requests/:request_id/messages', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], message);

// department internal auth check
app.use('/:projectid/departments', visitorCounter, department);
// app.use('/:projectid/departments', reqLogger, department);

app.use('/public/requests', publicRequest);

channelManager.use(app);


app.use('/:projectid/faq', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], faq);
app.use('/:projectid/bots', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], bot);

//attention don't use hasRole. It is used by chatsupportApi.getBot with a fixed basic auth credetials.TODO change it
app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], faq_kb);
// app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], faq_kb);


// project internal auth check
app.use('/projects',project);

//app.use('/settings',setting);

app.use('/:projectid/widgets', widgets);

// non mettere ad admin perchà la dashboard  richiama il servizio router.get('/:user_id/:project_id') spesso
app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], project_user);
// app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole('admin')], project_user);

//TODO crud hasrole ma create per BelongsToProject anche bot,visitor, lead,etc..
app.use('/:projectid/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], request);

app.use('/:projectid/groups', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], group);
app.use('/:projectid/analytics', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], analytics);
app.use('/:projectid/publicanalytics', publicAnalytics);

app.use('/:projectid/keys', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], key);
app.use('/:projectid/jwt', jwtroute);
app.use('/:projectid/firebase', firebase);
app.use('/:projectid/subscriptions', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], subscription);
app.use('/:projectid/activities', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], activities);


app.use('/:projectid/pendinginvitations', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], pendinginvitation);





// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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
