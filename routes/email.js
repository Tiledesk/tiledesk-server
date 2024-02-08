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


if (process.env.ENABLE_TEST_EMAIL_ENDPOINT==true || process.env.ENABLE_TEST_EMAIL_ENDPOINT=="true") {


  router.post('/test/sendNewAssignedRequestNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }

    emailService.sendNewAssignedRequestNotification(to, request, req.project);
    
    res.json({"status":"delivering"});
      
  });


  router.post('/test/sendNewAssignedAgentMessageEmailNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
    let message = {
      "text": "text",
      "request": request
    }
                                                              //(to, request, project, message)
    emailService.sendNewAssignedAgentMessageEmailNotification(to, request, req.project, message);
    
    res.json({"status":"delivering"});
      
  });





  router.post('/test/sendNewPooledRequestNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
                                                              
    emailService.sendNewPooledRequestNotification(to, request, req.project);
    
    res.json({"status":"delivering"});
      
  });





  router.post('/test/sendNewPooledMessageEmailNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
    let message = {
      "text": "text",
      "request": request
    }
                                                              
    emailService.sendNewPooledMessageEmailNotification(to, request, req.project, message);
    
    res.json({"status":"delivering"});
      
  });





  router.post('/test/sendNewMessageNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
    let message = {
      "text": "text",
      "request": request
    }
                    
    // sendNewMessageNotification(to, message, project, tokenQueryString, sourcePage)
    emailService.sendNewMessageNotification(to, message, req.project, "tokenQueryString", "sourcePage");
    
    res.json({"status":"delivering"});
      
  });



  router.post('/test/sendEmailChannelNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
    let message = {
      "text": "text",
      "request": request
    }
                    
    // (to, message, project, tokenQueryString, sourcePage) 
      emailService.sendEmailChannelNotification(to, message, req.project, "tokenQueryString", "sourcePage");
    
    res.json({"status":"delivering"});
      
  });




  router.post('/test/sendFollowerNotification', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text"
    }
    let message = {
      "text": "text",
      "request": request
    }
                    
      emailService.sendFollowerNotification(to, message, req.project);
    
    res.json({"status":"delivering"});
      
  });



  router.post('/test/sendRequestTranscript', 
  async (req, res) => {

    let to = req.body.to;
    winston.debug("to",to);

    let configEmail = req.body.config;
    winston.debug("configEmail", configEmail);

    let request = {
      "_id" : "6316fe117c04320341200e8a",
      "status" : 50,
      "preflight" : true,
      "hasBot" : false,
      "participants" : [],
      "priority" : "medium",
      "request_id" : "support-group-123",
      "first_text" : "first_text",
      createdAt: new Date()

    }
    let messages = [{
      "text": "text",
      "request": request,
      createdAt: new Date()
    }]

    // sendRequestTranscript(to, messages, request, project)

                    
      emailService.sendRequestTranscript(to, messages, request, req.project);
    
    res.json({"status":"delivering"});
      
  });


}




//TODO add cc
router.post('/internal/send', 
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

  let replyto = req.body.replyto;
  winston.debug("replyto: " + replyto);

  winston.info("Sending an email with text : " + text + " to " + to);

  let quoteManager = req.app.get('quote_manager');

  //sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage, payload)
  emailService.sendEmailDirect(newto, text, req.project, request_id, subject, undefined, undefined, undefined, replyto, quoteManager);
  
  res.json({"queued": true});
    
});




module.exports = router;