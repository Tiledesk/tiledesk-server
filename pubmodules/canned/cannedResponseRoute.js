var express = require('express');
var router = express.Router();
var CannedResponse = require("./cannedResponse");
var winston = require('../../config/winston');
// const CannedResponseEvent = require('../event/CannedResponseEvent');


router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newCannedResponse = new CannedResponse({
    title: req.body.title,  
    text: req.body.text,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  if (req.projectuser.role == 'owner' || req.projectuser.role == 'admin') {
    newCannedResponse.shared = true;
  } else {
    newCannedResponse.shared = false;
  }

  newCannedResponse.save(function (err, savedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err)

      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }

    res.json(savedCannedResponse);
  });
});

router.put('/:cannedResponseid', function (req, res) {
  winston.debug(req.body);
  var update = {};
  
  if (req.body.title!=undefined) {
    update.title = req.body.title; 
  }  
  if (req.body.text!=undefined) {
    update.text = req.body.text;   
  }
  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }
  
  
  CannedResponse.findByIdAndUpdate(req.params.cannedResponseid, update, { new: true, upsert: true }, function (err, updatedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

  

    // CannedResponseEvent.emit('CannedResponse.update', updatedCannedResponse);
    res.json(updatedCannedResponse);
  });
});

router.delete('/:cannedResponseid', function (req, res) {
  winston.debug(req.body);

  CannedResponse.findByIdAndUpdate(req.params.cannedResponseid, {status: 1000}, { new: true, upsert: true }, function (err, updatedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

   

    // CannedResponseEvent.emit('CannedResponse.delete', updatedCannedResponse);
    res.json(updatedCannedResponse);
  });
});

router.delete('/:cannedResponseid/physical', function (req, res) {
  winston.debug(req.body);

  CannedResponse.remove({ _id: req.params.cannedResponseid }, function (err, cannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

  
    // CannedResponseEvent.emit('CannedResponse.delete', CannedResponse);

    res.json(cannedResponse);
  });
});

router.get('/:cannedResponseid', function (req, res) {
  winston.debug(req.body);

  CannedResponse.findById(req.params.cannedResponseid, function (err, cannedResponse) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!cannedResponse) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(cannedResponse);
  });
});

router.get('/', function (req, res) {
  var limit = 1000; // Number of CannedResponses per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('CannedResponse ROUTE - SKIP PAGE ', skip);

  // var query = { "id_project": req.projectid, "status": {$lt:1000}};
  var query = {"id_project": req.projectid, "status": { $lt:1000 }, $or:[ { shared: true }, { shared : { $exists: false }}, { createdBy: req.user._id } ] }

  if (req.query.full_text) {
    winston.debug('CannedResponse ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  return CannedResponse.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, cannedResponses) {
      if (err) {
        winston.error('CannedResponse ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }
    
        return res.json(cannedResponses);
    });
});




module.exports = router;
