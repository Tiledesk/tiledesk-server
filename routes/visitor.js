var express = require('express');
var router = express.Router();
var Visitor = require("../models/visitor");
var winston = require('../config/winston');

csv = require('csv-express');
csv.separator = ';';

//var Activity = require("../models/activity");
//const activityEvent = require('../event/activityEvent');

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var visitor = new Visitor({
    fullname: req.body.fullname,
    lead_id: req.body.lead_id,
    email: req.body.email,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  visitor.save(function (err, saved) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(saved);
  });
});

router.put('/:visitorid', function (req, res) {
  winston.debug(req.body);

  Visitor.findByIdAndUpdate(req.params.visitorid, req.body, { new: true, upsert: true }, function (err, updated) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
   
    res.json(updated);
  });
});


router.delete('/:visitorid', function (req, res) {
  winston.debug(req.body);

  Visitor.remove({ _id: req.params.visitorid }, function (err, visitor) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
  
    res.json(visitor);
  });
});


router.get('/:visitorid', function (req, res) {
  winston.debug(req.body);

  Visitor.findById(req.params.leadid, function (err, visitor) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!visitor) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(visitor);
  });
});


router.get('/', function (req, res) {
  var limit = 40; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Visitor ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid };

  
  return Visitor.find(query).
    skip(skip).limit(limit).
    exec(function (err, visitors) {
      if (err) {
        winston.error('Visitor ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      return Visitor.count(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          visitors: visitors
        };

        return res.json(objectToReturn);
      });
    });
});




module.exports = router;
