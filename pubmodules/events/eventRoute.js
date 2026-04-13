var express = require('express');
var router = express.Router({mergeParams: true});
var Event = require("./event");
var winston = require('../../config/winston');
var validtoken = require('../../middleware/valid-token');
const eventService = require('./eventService');
const { check, validationResult } = require('express-validator');
var passport = require('passport');
require('../../middleware/passport')(passport);
var roleChecker = require('../../middleware/has-role');

const messageEvent = require('../../event/messageEvent');


router.post('/', [
  passport.authenticate(['basic', 'jwt'], 
  { session: false }), 
  validtoken, 
  // roleChecker.hasRole('guest'),

  // >Cannot read property 'id' of undefined</h1>

  roleChecker.hasRoleOrTypes('guest', ['bot','subscription']),
  check('name').notEmpty(),  
],function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

    
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

    var pu = undefined;
    if (req.projectuser) { //if the bot creates the event -> pu is undefined
      pu = req.projectuser.id
    }   
    // // emit(name, attributes, id_project, project_user, createdBy, status, user) {
    eventService.emit(req.body.name, req.body.attributes, req.projectid, pu, req.user.id, undefined, req.user).then(function(event) {

      res.json(event);
    }).catch(function(err) {
      winston.error('Error saving the event', err);
      return res.status(500).send({success: false, msg: 'Error saving the event', error: err.message });
    });

});



router.get('/:eventid', 
  [passport.authenticate(['basic', 'jwt'], 
  { session: false }), 
  validtoken, 
  roleChecker.hasRole('agent')],
  function (req, res) {

  winston.debug(req.body);

  Event.findById(req.params.eventid, function (err, event) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!event) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(event);
  });
});



router.get('/',   [passport.authenticate(['basic', 'jwt'], 
  { session: false }), 
  validtoken, 
  roleChecker.hasRole('agent')],
  function (req, res) {
  var limit = 40; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Event ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid};

  if (req.query.project_user) {
    var project_user = req.query.project_user;
    query.project_user = project_user;
  }

  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  //console.log("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  //console.log("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  return Event.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, events) {
      if (err) {
        winston.error('Event ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      //  collection.count is deprecated, and will be removed in a future version. Use Collection.countDocuments or Collection.estimatedDocumentCount instead
      return Event.countDocuments(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          events: events
        };

        return res.json(objectToReturn);
      });
    });
});




module.exports = router;
