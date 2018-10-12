var express = require('express');
var router = express.Router();
var Message = require("../models/message");





  router.get('/:requestid/messages', function(req, res) {
  
    console.log(req.params);
    console.log("here");    
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
  
    console.log(req.params);
    console.log("here");    
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
