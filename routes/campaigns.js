var express = require('express');
var router = express.Router();
var Lead = require("../models/lead");
var LeadConstants = require("../models/leadConstants");
var winston = require('../config/winston');
var leadService = require("../services/leadService");
var requestService = require("../services/requestService");
var messageService = require("../services/messageService");
var MessageConstants = require("../models/messageConstants");
const uuidv4 = require('uuid/v4');




// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"ciao"}' http://localhost:3000/5f897142c9e7ad9602a744c9/campaigns/
// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"ciao", "leadid":"213213221"}' http://localhost:3000/5f897142c9e7ad9602a744c9/campaigns/


// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"ciao", "leadid":"5f8972c82db41c003473cb03"}' https://tiledesk-server-pre.herokuapp.com/5f86c201189063003453a045/campaigns/
// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"ciao", "leadid":"5f8972c82db41c003473cb03", "request_id":"group-123456789112233"}' https://tiledesk-server-pre.herokuapp.com/5f86c201189063003453a045/campaigns/


// this endpoint supports support-group- or groups. this create a conversation for the sender (agent console)
router.post('/', function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);
  var request_id = req.body.request_id || 'support-group-'+uuidv4();
  
  // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel) {
  return requestService.createWithIdAndRequester(request_id, req.projectuser._id, req.body.leadid, req.projectid, 
    req.body.text, req.body.departmentid, req.body.sourcePage, 
    req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes, req.body.subject, true, req.body.channel).then(function (savedRequest) {

      winston.info("savedRequest", savedRequest);

      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
      return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, savedRequest.request_id, req.body.text,
        req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata,  req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function(savedMessage){                    
          res.json(savedMessage);
       });

  });
});

// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"ciao", "recipient":"5f8972c82db41c003473cb03"}' https://tiledesk-server-pre.herokuapp.com/5f86c201189063003453a045/campaigns/direct
router.post('/direct', function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);
  

  // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
  return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, req.body.recipient, req.body.text,
    req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata,  req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function(savedMessage){                    
      res.json(savedMessage);
    });

  
});




module.exports = router;
