var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var winston = require('../config/winston');
var widgetConfig = require('../config/widget');

var widgetLocation = process.env.WIDGET_LOCATION || widgetConfig.location;

router.get('/load', function(req, res) {
  // winston.debug(req.projectid);
  res.redirect(widgetLocation);
});
  

var widgetTestLocation = process.env.WIDGET_TEST_LOCATION || widgetConfig.testLocation;

router.get('/test/load', function(req, res) {
  // winston.debug(req.projectid);
  res.redirect(widgetTestLocation);
});

module.exports = router;
