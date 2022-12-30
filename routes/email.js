var express = require('express');

var router = express.Router();

var emailService = require("../services/emailService");
var winston = require('../config/winston');
const recipientEmailUtil = require("../utils/recipientEmailUtil");



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

//TODO add cc
router.post('/send', 
 async (req, res) => {
  let to = req.body.to;
  winston.debug("to: " + to);

  let text = req.body.text;
  winston.debug("text: " + text);

  let request_id = req.body.request_id;
  winston.debug("request_id: " + request_id);

  let subject = req.body.subject;
  winston.debug("subject: " + subject);

  winston.debug("req.project", req.project);

  let newto = await recipientEmailUtil.process(to, req.projectid);
  winston.debug("newto: " + newto);

             //sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage)
  emailService.sendEmailDirect(newto, text, req.project, request_id, subject, undefined, undefined);
  
  res.json({"queued": true});
    
});

module.exports = router;