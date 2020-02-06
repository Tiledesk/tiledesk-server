var express = require('express');
var router = express.Router();
var winston = require('../config/winston');

var VisitorCounter = require("../models/visitorCounter");






router.get('/', function (req, res) {
  var projectid = req.projectid;

  winston.debug()

  VisitorCounter.find({ id_project: projectid }, function (err, visitorcounter) {
    if (err) {
      winston.debug('GET visitorcounter err ', err)
      return err
    };
    winston.debug('GET visitorcounter  ', visitorcounter)
    res.json(visitorcounter);
  });

});


module.exports = router;
