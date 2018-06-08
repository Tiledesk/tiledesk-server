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
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

mongoose.connect(databaseUri || config.database);

var auth = require('./routes/auth');
var contact = require('./routes/contact');
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

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function(req, res, next) {
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


app.get('/', function(req, res) {
  res.send('Chat21 API index page. See the documentation.');
});



var projectIdSetter = function (req, res, next) {
  var projectid = req.params.projectid;
  console.log("projectid", projectid);

  req.projectid = projectid;
  next()
}

app.use('/auth', auth);
app.use('/firebase/auth', firebaseAuth);

app.use('/:projectid', projectIdSetter);

//app.use('/:projectid', [passport.authenticate('jwt', { session: false}), passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('jwt', { session: false}), validtoken]);
//  app.use('/:projectid', [passport.authenticate('basic', { session: false }), validtoken]);
// app.use('/:projectid', [passport.authenticate('basic', { session: false })]);

// http://aleksandrov.ws/2013/09/12/restful-api-with-nodejs-plus-mongodb/
// app.use('/:projectid', [passport.authenticate(['basic','jwt'], { session: false }), validtoken]);


app.use('/:projectid/contacts', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], contact);
app.use('/:projectid/messages',[passport.authenticate(['basic','jwt'], { session: false }), validtoken], message);
app.use('/:projectid/departments', department);
app.use('/:projectid/faq', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], faq);
app.use('/:projectid/bots', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], bot);
app.use('/:projectid/faq_kb', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], faq_kb);
app.use('/projects', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], project);
app.use('/:projectid/people', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], person);
app.use('/:projectid/project_users', project_user);
app.use('/:projectid/requests', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], request);

app.use('/:projectid/groups', [passport.authenticate(['basic','jwt'], { session: false }), validtoken], group);

//app.use('/apps', tenant);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
