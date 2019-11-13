var express = require('express');
var router = express.Router();
var winston = require('../config/winston');

var VisitorCounter = require("../models/visitorCounter");






router.get('/', function (req, res) {
  var projectid = req.projectid;

  console.log()

  VisitorCounter.find({ id_project: projectid }, function (err, visitorcounter) {
    if (err) {
      console.log('GET visitorcounter err ', err)
      return err
    };
    console.log('GET visitorcounter  ', visitorcounter)
    res.json(visitorcounter);
  });

});


module.exports = router;
