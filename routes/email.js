var express = require('express');

var router = express.Router();

var emailService = require("../services/emailService");
var winston = require('../config/winston');

router.get('/templates/:templateid', 
 async (req, res) => {
  let templateid = req.params.templateid+".html";
  winston.debug("templateid",templateid);

  var html = await emailService.readTemplateFile(templateid);
    res.json({template:html});
});
 
router.post('/test/send', 
 async (req, res) => {
  let to = req.body.to;
  winston.info("to",to);

  let configEmail = req.body.config;
  winston.info("configEmail", configEmail);

  emailService.sendTest(to, configEmail, function(err,obj) {
    // winston.info("sendTest rest", err, obj);
    res.json({error: err, response:obj});
  });
    
});

module.exports = router;