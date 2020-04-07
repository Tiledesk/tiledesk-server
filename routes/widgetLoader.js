var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var winston = require('../config/winston');
var widgetConfig = require('../config/widget');

var widgetLocation = process.env.WIDGET_LOCATION || widgetConfig.location;
var url = require('url');

router.get('/load', function(req, res) {
  var query = url.parse(req.url).query;
  winston.info(query);
  res.redirect(widgetLocation+'?'+query);
});
  

var widgetTestLocation = process.env.WIDGET_TEST_LOCATION || widgetConfig.testLocation;

router.get('/test/load', function(req, res) {
  var query = url.parse(req.url).query;
  res.redirect(widgetTestLocation+'?'+query);
});

module.exports = router;
