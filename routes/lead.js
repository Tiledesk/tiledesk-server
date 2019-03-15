var express = require('express');
var router = express.Router();
var Lead = require("../models/lead");
var winston = require('../config/winston');

var ObjectId = require('mongoose').Types.ObjectId;
csv = require('csv-express');
csv.separator = ';';

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newLead = new Lead({
    fullname: req.body.fullname,
    lead_id: req.body.lead_id,
    email: req.body.email,
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


// DOWNLOAD CONTACTS AS CSV
router.get('/csv', function (req, res, next) {
  var limit = 100000; // Number of leads per page
  var page = 0;
  if (req.query.page) {
    page = req.query.page;
  }
  var skip = page * limit;
  console.log('LEAD ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid };

  if (req.query.full_text) {
    console.log('LEAD ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.email) {
    console.log('LEAD ROUTE req.query.email', req.query.email);
    query.email = req.query.email;
  }

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
  return Lead.find(query, '-attributes -__v').
    skip(skip).limit(limit).
    sort(sortQuery).lean().
    exec(function (err, leads) {
      if (err) {
        winston.error('LEAD ROUTE - EXPORT CONTACT TO CSV ERR ', err)
        return next(err);
      }
      winston.error('LEAD ROUTE - EXPORT CONTACT TO CSV LEADS', leads)
      // return Lead.count(query, function (err, totalRowCount) {

      //   var objectToReturn = {
      //     perPage: limit,
      //     count: totalRowCount,
      //     leads: leads
      //   };

      return res.csv(leads, true);
      // });
    });
});

router.get('/:leadid', function (req, res) {
  console.log(req.body);

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!lead) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(lead);
  });
});

// NEW - accept '_id' and requester id
// router.get('/:id', function (req, res) {
//   console.log('GET LEAD BY ID REQUEST BODY ', req.body);
//   console.log('++ ++ ++ GET LEAD BY ID REQUEST req.param.length ', req.params.id);
//   // var objId = new ObjectId( (req.params.id.length != 24) ? "NOID56789012" : req.params.id );
//   var objId = (req.params.id.length != 24) ? "NOID56789012" : req.params.id ;

//   console.log('++ ++ ++ + GET LEAD BY ID REQUEST objId ', objId);
//   console.log('++ ++ ++ + GET LEAD BY ID REQUEST req.param.length ', req.params.id.length);
//   // 5bf6f696a5d49a0015d3513d
//   // 6Hs47HiHpOajpK4rYf20CgNTIcs1
//   Lead.findOne({ $or: [{ _id: objId }, { lead_id: req.params.id, id_project: req.projectid}] }, function (err, lead) {
//     if (err) {
//       winston.error('Error getting lead.' , err);
//       // return res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!lead) {
//       return res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     return res.json(lead);
//   });
// });



router.get('/', function (req, res) {
  var limit = 40; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  console.log('LEAD ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid };

  if (req.query.full_text) {
    console.log('LEAD ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.email) {
    console.log('LEAD ROUTE req.query.email', req.query.email);
    query.email = req.query.email;
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

  console.log("sort query", sortQuery);

  // Lead.find({ "id_project": req.projectid }, function (err, leads, next) {
  return Lead.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, leads) {
      if (err) {
        winston.error('LEAD ROUTE - REQUEST FIND ERR ', err)
        return (err);
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
