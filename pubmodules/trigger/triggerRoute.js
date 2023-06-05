var express = require('express');
var router = express.Router();
var Trigger = require("./models/trigger");
var triggerEventEmitter = require("./event/triggerEventEmitter");
var DefaultTrigger = require('./default');

var winston = require('../../config/winston');


winston.debug("trigger route");

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
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }

    triggerEventEmitter.emit('trigger.create', savedTrigger);

    res.json(savedTrigger);
  });
});

router.put('/:triggerid', function (req, res) {

  winston.debug(req.body);      

  
  var update = {};
  update.name = req.body.name;
  update.description = req.body.description;
  update.trigger = req.body.trigger;
  update.conditions = req.body.conditions;

  update.actions = req.body.actions;
  update.enabled = req.body.enabled;
  update.id_project = req.projectid;
  update.updatedBy = req.user.id;


  Trigger.findByIdAndUpdate(req.params.triggerid, update, { new: true, upsert: true }, function (err, updatedTrigger) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    triggerEventEmitter.emit('trigger.update', updatedTrigger);

    res.json(updatedTrigger);
  });
});

// curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e9eca85696a55a7eb4615f2/modules/triggers/s_invite_bot_01/reset

router.put('/:triggercode/reset', function (req, res) {

  winston.debug(req.body);

  var query = {code:req.params.triggercode, id_project:  req.projectid};
  winston.verbose("query resetting trigger: " , query);


  let triggerObj = Object.assign({}, DefaultTrigger.defTrigger[req.params.triggercode].toJSON());
  triggerObj.id_project = req.projectid;

  winston.verbose("reset triggerObj: " ,triggerObj);

  let trigger = new Trigger(triggerObj);
  // var trigger = DefaultTrigger.defTrigger[req.params.triggercode];
  // winston.verbose("trigger: ", trigger.toJSON());

  Trigger.remove(query, function (errOld, triggerOld) {
    if (errOld) {
      winston.error('Error deleting trigger ', errOld);
      // return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    trigger.save(function (err, updatedTrigger) {
      if (err) {
            winston.error('--- > ERROR ', {triggerObj:triggerObj, err: err, query: query});
            return res.status(500).send({ success: false, msg: 'Error updating object.' });
          }
        triggerEventEmitter.emit('trigger.update', updatedTrigger); 
        res.json(updatedTrigger);
    });
  });

  
});



router.delete('/:triggerid', function (req, res) {

  winston.debug(req.body);
  Trigger.findByIdAndRemove(req.params.triggerid, { new: false}, function (err, trigger) {
  // Trigger.remove({ _id: req.params.triggerid }, function (err, trigger) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    triggerEventEmitter.emit('trigger.delete', trigger); 

    res.json(trigger);
  });
});


router.get('/:triggerid', function (req, res) {

  winston.debug(req.body);

  Trigger.findById(req.params.triggerid, function (err, trigger) {
    if (err) {
      winston.error('--- > ERROR ', err)
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
