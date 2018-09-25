var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Message = require("../models/message");





  router.get('/:requestid/messages', function(req, res) {
  
    console.log(req.params);
    console.log("here");    
    Message.find({"request_id": req.params.requestid}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      res.json(messages);
    });

  });


  router.get('/:requestid/messages.html', function(req, res) {
  
    console.log(req.params);
    console.log("here");    
    Message.find({"request_id": req.params.requestid}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      res.render('messages', { title: 'Tiledesk', messages: messages});
    });

  });


  


module.exports = router;
