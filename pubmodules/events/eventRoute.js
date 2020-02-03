var express = require('express');
var router = express.Router();
var Event = require("./event");
var winston = require('../../config/winston');
const eventEvent = require('./eventEvent');
const eventService = require('./eventService');
const { check, validationResult } = require('express-validator');


router.post('/', [
  check('name').notEmpty(),  
],function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

    
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // emit(name, attributes, id_project, project_user, createdBy) {
  // eventService.emit2(req.body.name, req.body.attributes, req.projectid, req.projectuser.id, req.body.id_user, req.user.id).then(function(event) {
    eventService.emit(req.body.name, req.body.attributes, req.projectid, req.projectuser.id, req.user.id).then(function(event) {
    res.json(event);
  }).catch(function(err) {
    winston.error('Error saving the event '+ JSON.stringify(savedEvent), err)
    return res.status(500).send({success: false, msg: 'Error saving the event '+ JSON.stringify(savedEvent)});
  });

  // var newEvent = new Event({
  //   name: req.body.name,
  //   attributes: req.body.attributes,
  //   id_project: req.projectid,
  //   createdBy: req.user.id,
  //   updatedBy: req.user.id
  // });

  // newEvent.save(function(err, savedEvent) {
  //   if (err) {
  //     winston.error('Error saving the event '+ JSON.stringify(savedEvent), err)
  //     return res.status(500).send({success: false, msg: 'Error saving the event '+ JSON.stringify(savedEvent)});
  //   }

  //   res.json(savedEvent);
  // });
});



router.get('/:eventid', function (req, res) {
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



router.get('/', function (req, res) {
  var limit = 40; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Event ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid};

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

      return Event.count(query, function (err, totalRowCount) {

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
