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
var cors = require('cors')

var validtoken = require('./middleware/valid-token')


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
var person = require('./routes/person');
var firebaseAuth = require('./routes/firebaseauth');
var project_user = require('./routes/project_user');
var request = require('./routes/request');

var group = require('./routes/group');

// new 
var users = require('./routes/users');
var publicRequest = require('./routes/public-request');
var analytics = require('./routes/analytics');

var chat21Request = require('./routes/chat21-request');

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

  req.projectid = projectid;
  next()
}

app.use('/auth', auth);
app.use('/testauth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  res.send('{"success":true}');
});

app.use('/firebase/auth', firebaseAuth);

app.use('/:projectid', projectIdSetter);

//app.use('/:projectid', [passport.authenticate('jwt', { session: false}), passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('jwt', { session: false}), validtoken]);
//  app.use('/:projectid', [passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('basic', { session: false })]);

// http://aleksandrov.ws/2013/09/12/restful-api-with-nodejs-plus-mongodb/
// app.use('/:projectid', [passport.authenticate(['basic','jwt'], { session: false }), validtoken]);

app.use('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], users);
// app.use('/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], request);

app.use('/:projectid/leads', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], lead);
app.use('/:projectid/messages', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], message);

app.use('/:projectid/departments', department);
app.use('/public/requests', publicRequest);

// http://localhost:3000/chat21/requests
app.use('/chat21/requests',  chat21Request);



app.use('/:projectid/faq', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], faq);
app.use('/:projectid/bots', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], bot);
app.use('/:projectid/faq_kb', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], faq_kb);
app.use('/projects', project);
app.use('/:projectid/people', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], person);
app.use('/:projectid/project_users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], project_user);
app.use('/:projectid/requests', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], request);

app.use('/:projectid/groups', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], group);
app.use('/:projectid/analytics', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], analytics);


//app.use('/apps', tenant);


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
