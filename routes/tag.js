var express = require('express');
var router = express.Router();
var Tag = require("../models/tag");
var winston = require('../config/winston');


router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newTag = new Tag({
    tag: req.body.tag,  
    color: req.body.color,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newTag.save(function (err, savedTag) {
    if (err) {
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
  
  
  Tag.findByIdAndUpdate(req.params.tagid, update, { new: true, upsert: true }, function (err, updatedTag) {
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

  Tag.remove({ _id: req.params.tagid }, function (err, tag) {
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

  Tag.findById(req.params.tagid, function (err, tag) {
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

  return Tag.find(query).
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
