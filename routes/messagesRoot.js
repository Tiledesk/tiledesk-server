var express = require('express');

// https://stackoverflow.com/questions/28977253/express-router-undefined-params-with-router-use-when-split-across-files
var router = express.Router();

var MessageConstants = require("../models/MessageConstants");
var messageService = require("../services/messageService");
var winston = require('../config/winston');

// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456td -d '{"senderFullname":"Bot","recipient":"USERID", "text":"ciao"}' https://tiledesk-server-pre.herokuapp.com/5f86c201189063003453a045/messages/
// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"senderFullname":"Bot","recipient":"USERID", "text":"ciao"}' http://localhost:3000/609e3fd8e049553972114b88/messages/

router.post('/', 
  async (req, res)  => {

  winston.debug('req.body post message', req.body);
  winston.debug('req.params: ', req.params);
  winston.debug('req.params.request_id: ' + req.params.request_id);

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, req.body.recipient, req.body.text,
    req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata,  req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function(savedMessage){                    
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