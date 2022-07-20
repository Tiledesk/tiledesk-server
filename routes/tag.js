var express = require('express');
var router = express.Router();
var TagLibrary = require("../models/tagLibrary");
var winston = require('../config/winston');

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newTag = new TagLibrary({
    tag: req.body.tag,  
    color: req.body.color,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newTag.save(function (err, savedTag) {
    if (err) {
      // winston.error('--- > ERROR ', err)    
      if (err.code === 11000) { //error for dupes
          return TagLibrary.findOne({id_project:req.projectid, tag: req.body.tag },function (err, savedTag) {
            res.json(savedTag);
          });
      }    
      winston.error('--- > ERROR ', err)          
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }

    res.json(savedTag);
  });
});

router.put('/:tagid', function (req, res) {
  winston.debug(req.body);
  var update = {};
  

  update.tag = req.body.tag;   
  update.color = req.body.color;
  
  
  TagLibrary.findByIdAndUpdate(req.params.tagid, update, { new: true, upsert: true }, function (err, updatedTag) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

  

    // TagEvent.emit('Tag.update', updatedTag);
    res.json(updatedTag);
  });
});

router.delete('/:tagid', function (req, res) {
  winston.debug(req.body);

  TagLibrary.remove({ _id: req.params.tagid }, function (err, tag) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

  
    // TagEvent.emit('Tag.delete', Tag);

    res.json(tag);
  });
});

router.get('/:tagid', function (req, res) {
  winston.debug(req.body);

  TagLibrary.findById(req.params.tagid, function (err, tag) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!tag) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(tag);
  });
});

router.get('/', function (req, res) {
  var limit = 40; // Number of Tags per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Tag ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid};

  // if (req.query.full_text) {
  //   winston.debug('Tag ROUTE req.query.fulltext', req.query.full_text);
  //   query.$text = { "$search": req.query.full_text };
  // }


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

  return TagLibrary.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, tags) {
      if (err) {
        winston.error('Tag ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }
    
        return res.json(tags);
    });
});




module.exports = router;
