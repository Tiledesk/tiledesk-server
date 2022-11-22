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
  winston.debug("to",to);

  let configEmail = req.body.config;
  winston.debug("configEmail", configEmail);

  emailService.sendTest(to, configEmail, function(err,obj) {
    // winston.info("sendTest rest", err, obj);
    res.json({error: err, response:obj});
  });
    
});


router.post('/send', 
 async (req, res) => {
  let to = req.body.to;
  winston.info("to: " + to);

  let text = req.body.text;
  winston.info("text: " + text);

  let request_id = req.body.request_id;
  winston.info("request_id: " + request_id);

  let subject = req.body.subject;
  winston.info("subject: " + subject);

  winston.info("req.project", req.project);

             //sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage)
  emailService.sendEmailDirect(to, text, req.project, request_id, subject, undefined, undefined);
  
  res.json({"queued": true});
    
});

module.exports = router;