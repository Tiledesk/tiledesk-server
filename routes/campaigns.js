var express = require('express');
var router = express.Router();
var Group = require("../models/group");
var winston = require('../config/winston');
var requestService = require("../services/requestService");
var messageService = require("../services/messageService");
var MessageConstants = require("../models/messageConstants");
const uuidv4 = require('uuid/v4');





// this endpoint supports support-group- or groups. this create a conversation for the sender (agent console)
router.post('/', function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);
  var request_id = req.body.request_id || 'support-group-' + req.projectid + "-" + uuidv4();

  // TODO cicla su segment


  // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel) {

  //TODO USE NEW requestService.create()
  return requestService.createWithIdAndRequester(request_id, req.projectuser._id, req.body.leadid, req.projectid,
    req.body.text, req.body.departmentid, req.body.sourcePage,
    req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes, req.body.subject, true, req.body.channel).then(function (savedRequest) {

      winston.info("savedRequest", savedRequest);

      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
      return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, savedRequest.request_id, req.body.text,
        req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function (savedMessage) {
          res.json(savedMessage);
        });

    });
});

router.post('/direct', async function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var recipients = [];

  var recipient = req.body.recipient;
  if (recipient) {
    recipients.push(recipient);
  }

  // TODO cicla su segment
  var segment_id = req.body.segment_id;
  if (segment_id) {

  }

  var group_id = req.body.group_id;
  if (group_id) {
    var group = await Group.findOne({ _id: group_id, id_project: req.projectid }).exec();
    winston.info("group", group);

    var recipients = group.members;
    // winston.info("members", members);


  }

  winston.info("recipients", recipients);
  winston.info("recipients.length: " + recipients.length);

  if (recipients.length == 0) {
    // return res
  }

  if (recipients.length == 1) {
    return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, req.body.recipient, req.body.text,
      req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function (savedMessage) {

        if (req.body.returnobject) {
          return res.json(savedMessage);
        } else {
          return res.json({ success: true });
        }

      });
  }


  var promises = [];
  recipients.forEach(recipient => {

    // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
    var promise = messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, recipient, req.body.text,
      req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel);
    promises.push(promise);
    // .then(function(savedMessage){                    
    // result.push(savedMessage);
    // res.json(savedMessage);
  });

  Promise.all(promises).then(function (data) {
    if (req.body.returnobject) {
      return res.json(data);
    }
  });

  if (!req.body.returnobject) {
    return res.json({ success: true });
  }




});









module.exports = router;
