var express = require('express');
var router = express.Router();
var Bot = require("../models/bot");

var winston = require('../config/winston');


router.post('/', function (req, res) {

  winston.debug(req.body);
  var newBot = new Bot({
    id_faq_kb: req.body.id_faq_kb,
    fullname: req.body.fullname,
    id_project: req.id_projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newBot.save(function (err, savedBot) {
    if (err) {
      winston.debug('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedBot);
  });
});

router.put('/:botid', function (req, res) {

  winston.debug(req.body);

  Bot.findByIdAndUpdate(req.params.botid, req.body, { new: true, upsert: true }, function (err, updatedBot) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedBot);
  });
});


router.delete('/:botid', function (req, res) {

  winston.debug(req.body);

  Bot.remove({ _id: req.params.botid }, function (err, bot) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(bot);
  });
});


router.get('/:botid', function (req, res) {

  winston.debug(req.body);

  Bot.findById(req.params.botid, function (err, bot) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!bot) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(bot);
  });
});



router.get('/', function (req, res) {

  Bot.find(function (err, bots) {
    if (err) return next(err);
    res.json(bots);
  });
});

module.exports = router;
