require('dotenv').config()

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
require('./config/passport')(passport);
var config = require('./config/database');
var cors = require('cors');
var Project = require("./models/project");
// var Project_user = require("./models/project_user");
var validtoken = require('./middleware/valid-token');
var roleChecker = require('./middleware/has-role');

var winston = require('./config/winston');

//bin start
// https://bretkikehara.wordpress.com/2013/05/02/nodejs-creating-your-first-global-module/

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
if (!databaseUri) {
  winston.error('DATABASE_URI not specified, falling back to localhost.');
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
  mongoose.connect(databaseUri || config.database, { "autoIndex": autoIndex });
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


var chat21Enabled = process.env.CHAT21_ENABLED;

var chat21Request;
// if (chat21Enabled && chat21Enabled===true){ 
   chat21Request = require('./routes/chat21-request');
// }

var firebase = require('./routes/firebase');
var jwtroute = require('./routes/jwt');
var key = require('./routes/key');
var activities = require('./routes/activity');
var widgets = require('./routes/widget');

var appRules = require('./rules/appRules');
appRules.start();


//var cache = require('express-redis-cache')();

var subscriptionNotifier = require('./services/SubscriptionNotifier');
subscriptionNotifier.start();

var botSubscriptionNotifier = require('./services/BotSubscriptionNotifier');
botSubscriptionNotifier.start();


//var faqBotHandler = require('./services/faqBotHandler');
//faqBotHandler.listen();

var activityArchiver = require('./services/activityArchiver');
activityArchiver.listen();

//var chat21Handler = require('./channels/chat21/chat21Handler');
//chat21Handler.listen();


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


//traffic counter
// // var TrafficCounter = require('traffic-counter');
// var TrafficCounter = require('./utils/TrafficCounter');
// TrafficCounter.on(TrafficCounter.Event.Error, function(Err) {
//   //This is an error that occured during the initial object creation
//   //Probably ok to exit here
//   console.log(Err);
// });

// TrafficCounter.on(TrafficCounter.Event.RequestError, function(Err) {
//   //This is an error that occured once the web server is up and running
//   //Probably advisable to recover gracefull from this one
//   console.log(Err);
// });

// TrafficCounter.on(TrafficCounter.Event.SetupFinished, function() {
//   //We are now ready to use the traffic counter in app.VERB
//   //Putting the app.VERB logic here is a viable alternative to
//   //using a callback
//   console.log('Setup of the TrafficCounter object complete!');
// });

// // var connection = mongoose.connection;
// // console.log("connection", connection);
// //var MongoClient = require('mongodb').MongoClient;
// // Connect to the db
// //MongoClient.connect("mongodb://localhost:27017/", function(err, connectionTC) {
//   //TrafficCounter.Setup(connectionTC.db('tiledesk-test'), function () {
//     TrafficCounter.Setup(mongoose.connection, function () {
//     console.log("here1");
//     // app.get('/aa', function (req, res, next) {
//       // app.use( function (req, res, next) {
//         app.use('/aa',TrafficCounter.CountTraffic(TrafficCounter.TimeUnit.Hour, 30, app));

//         app.get('/aa', function (req, res) {
//           //console.log("ss")
          
//           res.send('Chat21 API index page. See the documentation.');
//         });
//         // app.all('/', [console.log("herereeeeee2222"), TrafficCounter.CountTraffic(TrafficCounter.TimeUnit.Hour, 30, app)]);
//       //   console.log("herereeeeee2222");
//       //   TrafficCounter.CountTraffic(TrafficCounter.TimeUnit.Hour, 30, app);
//       // });
//   });
// });

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


var reqLogger = function (req, res, next) {

// app.use(function (req, res, next) {
  // try {

  // }catch(e) {

  // }
  
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
}

app.get('/', function (req, res) {  
  res.send('Hello from Tiledesk server. It\'s UP. See the documentation here http://docs.tiledesk.com.');
});


// app.use(function (req, res, next) {
//  Setting.findOne({}, function (err, setting) {
//     if (err) {
//       winston.error("Error getting setting", err);
//       next();
//     }
//     if (!setting) {
//       // console.log("setting doesnt exist. Creare it from serviceAccount", setting);
//       //     var setting = new Setting({firebase: {private_key: serviceAccount.private_key, client_email: serviceAccount.client_email, project_id: serviceAccount.project_id}})
//       //     setting.save(function(err, ssetting) {
//       //       if (err) {
//       //         winston.error('Error saving ssetting ', err);
//       //       }else {
//       //         winston.error('ssetting saved', ssetting)
//       //       }
//       //     });
//       next();   
//     } else {
//       console.log("setting", setting);
//       //req.appSetting = setting;

//       // https://stackoverflow.com/questions/16452123/how-to-create-global-variables-accessible-in-all-views-using-express-node-js
//       app.locals({appSetting: appSetting});
//       next();   
//     }
    
//   });
  
// });

//app.use(reqLogger);

// var reqLogger = function (req, res, next) {
  


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

app.use('/firebase/auth', firebaseAuth);




//  app.use('/:projectid', [projectIdSetter]);
app.use('/:projectid', [projectIdSetter, projectSetter]);


//app.use('/:projectid', [passport.authenticate('jwt', { session: false}), passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('jwt', { session: false}), validtoken]);
//  app.use('/:projectid', [passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('basic', { session: false })]);

// http://aleksandrov.ws/2013/09/12/restful-api-with-nodejs-plus-mongodb/
// app.use('/:projectid', [passport.authenticate(['basic','jwt'], { session: false }), validtoken]);

app.use('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], users);
// app.use('/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], request);

app.use('/:projectid/leads', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], lead);
app.use('/:projectid/requests/:request_id/messages', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], message);

app.use('/:projectid/departments', visitorCounter, department);
// app.use('/:projectid/departments', department);
// app.use('/:projectid/departments', reqLogger, department);

app.use('/public/requests', publicRequest);

if (chat21Request) {
  app.use('/chat21/requests',  chat21Request);
}


app.use('/:projectid/faq', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], faq);
app.use('/:projectid/bots', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], bot);

//attention don't use hasRole. It is used by chatsupportApi.getBot with a fixed basic auth credetials.TODO change it
app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], faq_kb);
// app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], faq_kb);


//ATTENZIOne aggiungi auth check qui.i controlli stanno i project
app.use('/projects',project);
//app.use('/settings',setting);

app.use('/:projectid/widgets', widgets);


// non mettere ad admin perchà la dashboard  richiama il servizio router.get('/:user_id/:project_id') spesso
app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], project_user);
// app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole('admin')], project_user);


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
