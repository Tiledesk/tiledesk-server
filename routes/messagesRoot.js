var express = require('express');

// https://stackoverflow.com/questions/28977253/express-router-undefined-params-with-router-use-when-split-across-files
var router = express.Router();

var MessageConstants = require("../models/messageConstants");
var messageService = require("../services/messageService");
var winston = require('../config/winston');


router.post('/', 
  async (req, res)  => {

  winston.debug('req.body post message', req.body);
  winston.debug('req.params: ', req.params);
  winston.debug('req.params.request_id: ' + req.params.request_id);


  let message = {
    sender: req.body.sender || req.user._id, 
    senderFullname: req.body.senderFullname || req.user.fullName, 
    recipient: req.body.recipient, 
    text: req.body.text, 
    id_project: req.projectid, // rendilo opzionale?
    createdBy: req.user._id, 
    status:  MessageConstants.CHAT_MESSAGE_STATUS.SENDING, 
    attributes: req.body.attributes, 
    type: req.body.type, 
    metadata: req.body.metadata, 
    language: req.body.language, 
    channel_type: req.body.channel_type || MessageConstants.CHANNEL_TYPE.DIRECT, 
    channel: req.body.channel
};
  return messageService.save(message).then(function(savedMessage){                    
      res.json(savedMessage);
    });

});


//TODO reenable it with role owner
/*
router.get('/csv', function(req, res) {

  return Message.find({id_project: req.projectid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) return next(err);
      res.csv(messages, true);
    });
});
*/

module.exports = router;