var express = require('express');
var router = express.Router();
var Message = require("../models/message");
var Request = require("../models/request");
var User = require("../models/user");
var Project = require("../models/project");
var emailService = require("../services/emailService");
var winston = require('../config/winston');





  router.get('/:requestid/messages', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.json(messages);
    });

  });


  router.get('/:requestid/messages.html', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.render('messages', { title: 'Tiledesk', messages: messages});
    });

  });


module.exports = router;
