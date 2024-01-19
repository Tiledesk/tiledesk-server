var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var winston = require('../config/winston');
var widgetConfig = require('../config/widget');

var widgetLocation = process.env.WIDGET_LOCATION || widgetConfig.location;
var url = require('url');

router.get('/load', function(req, res) {
  var query = url.parse(req.url).query;
  winston.debug(query);
  // TODO chech if query is null
  res.redirect(widgetLocation+'?'+query);

});
  

router.get('/v5/:project_id', function(req, res) {

  var project_id = req.params.project_id;
  winston.debug("project_id: " + project_id);

  res.type('.js');

  var js = `
    window.tiledeskSettings= 
    {
        projectid: "${project_id}"
    };
    (function(d, s, id) { 
        var w=window; var d=document; var i=function(){i.c(arguments);};
        i.q=[]; i.c=function(args){i.q.push(args);}; w.Tiledesk=i;                    
        var js, fjs=d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js=d.createElement(s); 
        js.id=id; js.async=true; js.src="${widgetLocation}launch.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document,'script','tiledesk-jssdk'));
  `;

  winston.debug("js: " + js);

  res.send(js);

});


var widgetTestLocation = process.env.WIDGET_TEST_LOCATION || widgetConfig.testLocation;

router.get('/test/load', function(req, res) {
  var query = url.parse(req.url).query;
  res.redirect(widgetTestLocation+'?'+query);
});

module.exports = router;
