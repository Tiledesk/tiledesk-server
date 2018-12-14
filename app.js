var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
require('./config/passport')(passport);
var config = require('./config/database');
var cors = require('cors');
var Project = require("./models/project");
var Project_user = require("./models/project_user");
var validtoken = require('./middleware/valid-token');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
if (!databaseUri) {
  console.error('DATABASE_URI not specified, falling back to localhost.');
}
var autoIndex = true;
if (process.env.MONGOOSE_AUTOINDEX) {
  autoIndex = process.env.MONGOOSE_AUTOINDEX;
}
console.info("autoIndex", autoIndex);

mongoose.connect(databaseUri || config.database, { "autoIndex": autoIndex });

var auth = require('./routes/auth');
var lead = require('./routes/lead');
//var tenant = require('./routes/tenant');
var message = require('./routes/message');
var department = require('./routes/department');
var faq = require('./routes/faq');
var bot = require('./routes/bot');
var faq_kb = require('./routes/faq_kb');
var project = require('./routes/project');
// var person = require('./routes/person.old');
var firebaseAuth = require('./routes/firebaseauth');
var project_user = require('./routes/project_user');
var request = require('./routes/request');

var group = require('./routes/group');

// new 
var users = require('./routes/users');
var publicRequest = require('./routes/public-request');
var analytics = require('./routes/analytics');
var publicAnalytics = require('./routes/public-analytics');
var pendinginvitation = require('./routes/pending-invitation');

var chat21Request = require('./routes/chat21-request');
var firebase = require('./routes/firebase');
var jwtroute = require('./routes/jwt');
var key = require('./routes/key');
var app = express();

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
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(passport.initialize());

app.use(cors());


app.get('/', function (req, res) {
  res.send('Chat21 API index page. See the documentation.');
});



var projectIdSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  console.log("projectIdSetter projectid", projectid);

  // if (projectid) {
    req.projectid = projectid;
  // }
  
  next()
}

// function HasRole(role) {
//   return function(req, res, next) {

//     Project_user.find({ id_user: req.user.id, id_project: req.params.projectid }).
//     exec(function (err, project_user) {
//       // if (err) return next(err);
//       console.log("project_user",project_user);
//       if (project_user &&  project_user.role== role) {
//         next(); 
//       }
//       else {
//         var err = new Error('You dont have required role');
//         err.status = 403;
//         next(err);
//       }
//     });

   
//   }
// }
var ROLES =  {
  "agent": ["agent"],
  "admin": ["agent", "admin"],
  "owner": ["agent", "admin", "owner"],
};


function HasRole(role) {
  // console.log("HasRole");
  return function(req, res, next) {
    console.log("req.projectuser", req.projectuser);
    console.log("req.user", req.user);
    console.log("role", role);

    Project_user.find({ id_user: req.user.id, id_project: req.params.projectid }).
      exec(function (err, project_user) {
        if (err) {
          console.error(err);
          return next(err);
        }
        
        req.projectuser = project_user;
        console.log("req.projectuser", req.projectuser);

        if (req.projectuser && req.projectuser.length>0) {
          
          var userRole = project_user[0].role;
          console.log("userRole", userRole);

          if (!role) {
            next();
          }else {

            var hierarchicalRoles = ROLES[userRole];
            console.log("hierarchicalRoles", hierarchicalRoles);

            if ( hierarchicalRoles.includes(role)) {
              next();
            }else {
              res.status(403).send({success: false, msg: 'you dont have the required role.'});
            }
          }
        }else {
        
          res.status(403).send({success: false, msg: 'you dont belongs to the project.'});
        }

    });

  }
  
}

// var getProjectUser = function (req, res, next) {
//   console.log("getProjectUser");
//   Project_user.find({ id_user: req.user.id, id_project: req.params.projectid }).
//     exec(function (err, project_user) {
//       if (err) {
//         console.error(err);
//         return next(err);
//       }
      
//       req.projectuser = project_user;
//       console.log("req.projectuser", req.projectuser);
//       next();

//   });
// }


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
        console.warn("Project not found for id", req.projectid);
        next();
      } else {
        req.project = project;
        console.log("req.project", req.project);
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

app.use('/:projectid/leads', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], lead);
app.use('/:projectid/messages', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], message);

app.use('/:projectid/departments', department);
app.use('/public/requests', publicRequest);

app.use('/chat21/requests',  chat21Request);



app.use('/:projectid/faq', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], faq);
app.use('/:projectid/bots', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], bot);

//attention don't use hasRole. It is used by chatsupportApi.getBot with a fixed basic auth credetials.TODO change it
app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], faq_kb);
// app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], faq_kb);


//ATTENZIOne aggiungi auth check qui.i controlli stanno i project
app.use('/projects',project);


// non mettere ad admin perchà la dashboard  richiama il servizio router.get('/:user_id/:project_id') spesso
app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], project_user);
// app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole('admin')], project_user);


app.use('/:projectid/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], request);

app.use('/:projectid/groups', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole('admin')], group);
app.use('/:projectid/analytics', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], analytics);
app.use('/:projectid/publicanalytics', publicAnalytics);

app.use('/:projectid/keys', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, HasRole()], key);
app.use('/:projectid/jwt', jwtroute);
app.use('/:projectid/firebase', firebase);

app.use('/:projectid/pendinginvitations', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], pendinginvitation);
//app.use('/apps', tenant);
// app.use('/:projectid/people', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], person);





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


// function keepalive() {
//   console.log('keepalive2 ');

//   var options = {
//     url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/requests?token=chat21-secret-orgAa,',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     json: {"sender_fullname": "Bash", "text":"ping from API","projectid":"5b45e1c75313c50014b3abc6"}
//   };

//   setInterval(function() {
//     request(options, function (err, res, body) {
    
//       console.log('keepalive  ok');

//       if (err) {
//         console.log('keepalive ERROR ', err);
//       }
//     });
//   }, 3000);
// }
// app.use(keepalive());



module.exports = app;
