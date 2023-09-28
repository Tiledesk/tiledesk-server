var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
var Segment = require("../models/segment");


router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newSegment = new Segment({
    name: req.body.name,
    match: req.body.match,
    filters: req.body.filters,
    id_project: req.projectid,    
    createdBy: req.user.id
  });

  newSegment.save(function(err, segment) {
    if (err) {
      winston.error('Error saving the segment '+ JSON.stringify(segment), err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });

    }            
    winston.verbose('segment created ', segment.toJSON());

   
    res.json(segment);
  })

});

router.put('/:segmentid', function (req, res) {
  winston.debug(req.body);
  var update = {};
  
    if (req.body.name!=undefined) {
      update.name = req.body.name;
    }
   
    if (req.body.match!=undefined) {
      update.match = req.body.match;
    }
    if (req.body.filters!=undefined) {
      update.filters = req.body.filters;
    }
    


    Segment.findByIdAndUpdate(req.params.segmentid, update, { new: true, upsert: true }, function (err, updatedSegment) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    res.json(updatedSegment);
  });
});



router.delete('/:segmentid', function (req, res) {
  winston.debug(req.body);

  Segment.findByIdAndUpdate(req.params.segmentid, {status:0}, { new: true, upsert: true }, function (err, updatedSegment) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    res.json(updatedSegment);
  });
});


router.get('/:segmentid', function (req, res) {
  winston.debug(req.body);

  Segment.findById(req.params.segmentid, function (err, segment) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!segment) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(segment);
  });
});


router.get('/', function (req, res) {

  var limit = 40; // Number of request per page

  if (req.query.limit) {    
    limit = parseInt(req.query.limit);
    winston.debug('LEAD ROUTE - limit: '+limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('LEAD ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid, "status": 100};

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

  

  return Segment.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, segments) {
      if (err) {
        winston.error('segments ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      // blocked to 1000 TODO increases it
      //  collection.count is deprecated, and will be removed in a future version. Use Collection.countDocuments or Collection.estimatedDocumentCount instead
      return Segment.countDocuments(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          segments: segments
        };

        return res.json(objectToReturn);
      });
    });
});




module.exports = router;
