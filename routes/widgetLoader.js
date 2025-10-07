let express = require('express');
let router = express.Router();
let Project = require("../models/project");
let winston = require('../config/winston');
let widgetConfig = require('../config/widget');

let widgetLocation = process.env.WIDGET_LOCATION || widgetConfig.location;
let url = require('url');

router.get('/load', function(req, res) {
  let query = url.parse(req.url).query;
  winston.debug(query);
  // TODO chech if query is null
  res.redirect(widgetLocation+'?'+query);

});
  

router.get('/v5/:project_id', function(req, res) {

  let project_id = req.params.project_id;
  winston.debug("project_id: " + project_id);

  res.type('.js');

  let js = `
    window.tiledeskSettings= 
    {
        projectid: "${project_id}"
    };
    (function(d, s, id) { 
        let w=window; let d=document; let i=function(){i.c(arguments);};
        i.q=[]; i.c=function(args){i.q.push(args);}; w.Tiledesk=i;                    
        let js, fjs=d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js=d.createElement(s); 
        js.id=id; js.async=true; js.src="${widgetLocation}launch.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document,'script','tiledesk-jssdk'));
  `;

  winston.debug("js: " + js);

  res.send(js);

});


let widgetTestLocation = process.env.WIDGET_TEST_LOCATION || widgetConfig.testLocation;

router.get('/test/load', function(req, res) {
  let query = url.parse(req.url).query;
  res.redirect(widgetTestLocation+'?'+query);
});

module.exports = router;
