var express = require('express');
var router = express.Router();
var Subscription = require("../models/subscription");
var SubscriptionLog = require("../models/subscriptionLog");
var subscriptionEvent = require("../event/subscriptionEvent");
var winston = require('../config/winston');

//space

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var subscription = new Subscription({
    target: req.body.target,
    event: req.body.event,
    id_project: req.projectid,
    createdBy: req.user.id
  });

  subscription.save(function (err, subscriptionSaved) {
    if (err) {
      if (err.code === 11000) { //error for dupes
        return Subscription.findOne({id_project:req.projectid, event: req.body.event}).select("+secret")
                  .exec(function (err, subscriptionSaved) {
          res.setHeader('x-hook-secret', subscriptionSaved.secret);
          res.json(subscriptionSaved);
        });
      }    
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    // http://resthooks.org/docs/security/

    res.setHeader('x-hook-secret', subscriptionSaved.secret);

    subscriptionEvent.emit('subscription.create', subscriptionSaved );
    res.json(subscriptionSaved);
  });
});


router.post('/test', function (req, res) {

  winston.debug("test subscription body", req.body);
  
  res.json(req);
});

router.put('/:subscriptionid', function (req, res) {

  winston.debug(req.body);

  Subscription.findByIdAndUpdate(req.params.subscriptionid, req.body, { new: true, upsert: true }, function (err, subscriptionUpd) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    subscriptionEvent.emit('subscription.update', subscriptionUpd );
    res.json(subscriptionUpd);
  });
});


router.delete('/:subscriptionid', function (req, res) {

  winston.debug(req.body);

  Subscription.findByIdAndRemove(req.params.subscriptionid, { new: false}, function (err, subscriptionUpd) {
    // Subscription.remove({ _id: req.params.subscriptionid }, function (err, subscriptionUpd) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    subscriptionEvent.emit('subscription.delete', subscriptionUpd );
    res.json(subscriptionUpd);
  });
});




router.get('/', function (req, res) {

  return Subscription.find({ "id_project": req.projectid }).
    exec(function (err, subscriptions, next) {
      if (err) {
        winston.error('Subscription ROUTE - REQUEST FIND ERR ', err)
        return next(err);
      }

        return res.json(subscriptions);
      });
  
});

router.get('/history', function (req, res) {

  var limit = 40; // Number of leads per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Subscription ROUTE - SKIP PAGE ', skip);


  return SubscriptionLog.find({ "id_project": req.projectid }).
    skip(skip).limit(limit)
    .sort({createdAt: 'desc'}).
    exec(function (err, subscriptions, next) {
      if (err) {
        winston.error('Subscription ROUTE - REQUEST FIND ERR ', err)
        return next(err);
      }

        return res.json(subscriptions);
      });
  
});


router.get('/:subscriptionid', function (req, res) {

  winston.debug(req.body);

  Subscription.findById(req.params.subscriptionid, function (err, subscriptionUpd) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!subscriptionUpd) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(subscriptionUpd);
  });
});



module.exports = router;
