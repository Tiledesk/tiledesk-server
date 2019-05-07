var express = require('express');
var router = express.Router();
var Subscription = require("../models/subscription");
var winston = require('../config/winston');



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
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    // http://resthooks.org/docs/security/

    res.setHeader('x-hook-secret', subscriptionSaved.secret);
   // console.log('--- > HEREEEEEEEEEEE ', subscriptionSaved);
    res.json(subscriptionSaved);
  });
});


router.post('/test', function (req, res) {

  console.log("test subscription body", req.body);
  
    res.json(req);
});

router.put('/:subscriptionid', function (req, res) {

  console.log(req.body);

  Subscription.findByIdAndUpdate(req.params.subscriptionid, req.body, { new: true, upsert: true }, function (err, subscriptionUpd) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(subscriptionUpd);
  });
});


router.delete('/:subscriptionid', function (req, res) {

  console.log(req.body);

  Subscription.remove({ _id: req.params.subscriptionid }, function (err, subscriptionUpd) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(subscriptionUpd);
  });
});


router.get('/:subscriptionid', function (req, res) {

  console.log(req.body);

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



router.get('/', function (req, res) {

    return Subscription.find({ "id_project": req.projectid }).
    exec(function (err, subscriptions, next) {
      if (err) {
        winston.error('LEAD ROUTE - REQUEST FIND ERR ', err)
        return next(err);
      }

        return res.json(subscriptions);
      });
  
});

module.exports = router;
