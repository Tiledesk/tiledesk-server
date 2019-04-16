var express = require('express');
var router = express.Router();
var Activity = require("../models/activity");
var winston = require('../config/winston');

// csv = require('csv-express');
// csv.separator = ';';

// router.post('/', function (req, res) {

//   winston.debug(req.body);
//   winston.debug("req.user", req.user);

//   var newLead = new Lead({
//     fullname: req.body.fullname,
//     lead_id: req.body.lead_id,
//     email: req.body.email,
//     id_project: req.projectid,
//     createdBy: req.user.id,
//     updatedBy: req.user.id
//   });

//   newLead.save(function (err, savedLead) {
//     if (err) {
//       winston.debug('--- > ERROR ', err)
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     }
//     res.json(savedLead);
//   });
// });

// router.get('/:leadid', function (req, res) {
//   winston.debug(req.body);

//   Lead.findById(req.params.leadid, function (err, lead) {
//     if (err) {
//       return res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!lead) {
//       return res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     res.json(lead);
//   });
// });



router.get('/', function (req, res) {
  var limit = 40; // Number of activities per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Activity ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid };


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  return Activity.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, activities) {
      if (err) {
        winston.error('Activity ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      return Activity.count(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          activities: activities
        };

        return res.json(objectToReturn);
      });
    });
});




module.exports = router;
