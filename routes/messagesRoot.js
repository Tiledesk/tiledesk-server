var express = require('express');

// https://stackoverflow.com/questions/28977253/express-router-undefined-params-with-router-use-when-split-across-files
var router = express.Router({mergeParams: true});

var MessageConstants = require("../models/messageConstants");
var Message = require("../models/message");
var messageService = require("../services/messageService");
var winston = require('../config/winston');
var fastCsv = require("fast-csv");
var roleChecker = require('../middleware/has-role');
const { check, validationResult } = require('express-validator');


router.post('/', 
[
  check('recipient').notEmpty(),  
  check('recipientFullname').notEmpty(),
  check('text').notEmpty()
],
  async (req, res)  => {

  winston.debug('req.body post message', req.body);
  winston.debug('req.params: ', req.params);
  winston.debug('req.params.request_id: ' + req.params.request_id);


  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    winston.error("Signup validation error", errors);
    return res.status(422).json({ errors: errors.array() });
  }

  let message = {
    sender: req.body.sender || req.user._id, 
    senderFullname: req.body.senderFullname || req.user.fullName, 
    recipient: req.body.recipient, 
    recipientFullname: req.body.recipientFullname,
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



router.get('/csv', roleChecker.hasRoleOrTypes('owner'), function(req, res) {

  
  // return Message.find({id_project: req.projectid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
  //     if (err) return next(err);
  //     res.csv(messages, true);
  //   });


  const cursor = Message.find({id_project: req.projectid}).select("-channel -attributes -metadata");

  const transformer = (doc)=> {
    return {
        Id: doc._id,
        Name: doc.fullname,
        Email: doc.email,
        Type: doc.registration_type,
        RegisterOn: doc.registered_on
    };
  }

  const filename = 'export.csv';

  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.writeHead(200, { 'Content-Type': 'text/csv' });

  res.flushHeaders();

  console.log("fastCsv",fastCsv)
  var csvStream = fastCsv.format({headers: true})//.transform(transformer)
  // var csvStream = fastCsv.createWriteStream({headers: true}).transform(transformer)
  cursor.stream().pipe(csvStream).pipe(res);

});


module.exports = router;
