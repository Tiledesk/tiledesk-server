var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Lead = require("../models/lead");



router.post('/', function (req, res) {

  console.log(req.body);
  console.log("req.user", req.user);

  var newLead = new Lead({
    fullname: req.body.fullname,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newLead.save(function (err, savedLead) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedLead);
  });
});

router.put('/:leadid', function (req, res) {

  console.log(req.body);

  Lead.findByIdAndUpdate(req.params.leadid, req.body, { new: true, upsert: true }, function (err, updatedLead) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedLead);
  });
});


router.delete('/:leadid', function (req, res) {

  console.log(req.body);

  Lead.remove({ _id: req.params.leadid }, function (err, lead) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(lead);
  });
});


router.get('/:leadid', function (req, res) {

  console.log(req.body);

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!Lead) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(lead);
  });
});



router.get('/', function (req, res) {

  var limit = 5; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  console.log('REQUEST ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid };

  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  console.log("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  console.log("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  console.log("sort query", sortQuery);

  // Lead.find({ "id_project": req.projectid }, function (err, leads, next) {
  return Lead.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, leads, next) {
      if (err) {
        console.error('LEAD ROUTE - REQUEST FIND ERR ', err)
        return next(err);
      }

      return Lead.count(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          leads: leads
        };

        return res.json(objectToReturn);
      });
    });
});

module.exports = router;
