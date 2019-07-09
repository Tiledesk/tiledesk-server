var express = require('express');
var router = express.Router();
var Trigger = require("./models/trigger");

var winston = require('../../config/winston');


winston.info("trigger route");

router.post('/', function (req, res) {

  winston.debug(req.body);

  var trigger = new Trigger({
    name: req.body.name,
    description: req.body.description,
    id_project: req.projectid,
    trigger: req.body.trigger,
    conditions: req.body.conditions,
    actions: req.body.actions,
    enabled:true,
    createdBy: req.user.id,
    updatedBy: req.user.id
    });

    trigger.save(function (err, savedTrigger) {
    if (err) {
      winston.debug('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedTrigger);
  });
});

router.put('/:triggerid', function (req, res) {

  winston.debug(req.body);

  Trigger.findByIdAndUpdate(req.params.triggerid, req.body, { new: true, upsert: true }, function (err, updatedTrigger) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedTrigger);
  });
});


router.delete('/:triggerid', function (req, res) {

  winston.debug(req.body);

  Trigger.remove({ _id: req.params.triggerid }, function (err, trigger) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(trigger);
  });
});


router.get('/:triggerid', function (req, res) {

  winston.debug(req.body);

  Trigger.findById(req.params.triggerid, function (err, trigger) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!trigger) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(trigger);
  });
});



router.get('/', function (req, res) {

  Trigger.find({ "id_project": req.projectid }, function (err, triggers) {
    if (err) return next(err);
    res.json(triggers);
  });
});

module.exports = router;
