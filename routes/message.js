var express = require('express');

// https://stackoverflow.com/questions/28977253/express-router-undefined-params-with-router-use-when-split-across-files
var router = express.Router({mergeParams: true});

var Message = require("../models/message");
var Request = require("../models/request");

var requestService = require('../services/requestService');
var messageService = require('../services/messageService');
var leadService = require('../services/leadService');
var winston = require('../config/winston');
var MessageConstants = require("../models/messageConstants");


router.post('/', function(req, res) {

  winston.debug('req.body', req.body);
  winston.debug('req.params: ', req.params);
  winston.debug('req.params.request_id: ' + req.params.request_id);

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;
  winston.debug('messageStatus: ' + messageStatus);

      // return Request.findOne({request_id: req.params.request_id}, function(err, request) {
      return Request.findOne({request_id: req.params.request_id, id_project: req.projectid}, function(err, request) {

        if (err) {
          return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
        }

        if (!request) { //the request doen't exists create it

              winston.debug("request not exists", request);                                     
            
              return leadService.createIfNotExistsWithLeadId(req.body.sender, req.body.senderFullname, req.body.email, req.projectid, null, req.body.attributes)
              .then(function(createdLead) {
                // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
                  return requestService.createWithId(req.params.request_id, req.body.sender, req.projectid, 
                      req.body.text, req.body.departmentid, req.body.sourcePage, 
                      req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes).then(function (savedRequest) {
                    // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes) {
                    return messageService.create(req.body.sender, req.body.senderFullname, req.params.request_id, req.body.text,
                      req.projectid, req.user._id, messageStatus, req.body.attributes).then(function(savedMessage){                    
                        return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {

                          let message = savedMessage.toJSON();
                          message.request = savedRequestWithIncrement;
                          return res.json(message);
                        });
                      });
                    });                           
                      
                  });
                            


        } else {

      

          winston.debug("request  exists", request.toObject());
      
          // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes) {
                          
              return messageService.create(req.body.sender, req.body.senderFullname, req.params.request_id, req.body.text,
                request.id_project, null, messageStatus, req.body.attributes).then(function(savedMessage){

                  return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                    // console.log("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                     
                    if (savedRequest.participants && savedRequest.participants.indexOf(req.body.sender) > -1) { //update waiitng time if write an  agent (member of participants)
                      winston.debug("updateWaitingTimeByRequestId");
                      return requestService.updateWaitingTimeByRequestId(request.request_id, request.id_project).then(function(upRequest) {
                          let message = savedMessage.toJSON();
                          message.request = upRequest;
                          return res.json(message);
                      });
                    }else {
                      let message = savedMessage.toJSON();
                      message.request = savedRequest;
                      return res.json(message);
                    }
                  });
                }).catch(function(err){
                  winston.error("Error creating message", err);
                  return res.status(500).send({success: false, msg: 'Error creating message', err:err });
                });



        }
      


      });






  // var newMessage = new Message({
  //   sender: req.body.sender,
  //   senderFullname: req.body.sender_fullname,
  //   recipient: req.body.recipient,
  //   recipientFullname: req.body.recipient_fullname,
  //   text: req.body.text,
  //   id_project: req.projectid,
  //   createdBy: req.user.id,
  //   updatedBy: req.user.id
  // });

  // newMessage.save(function(err, savedMessage) {
  //   if (err) {
  //     console.log(err);

  //     return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
  //   }
  //   res.json(savedMessage);
  // });
});




// router.put('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.findByIdAndUpdate(req.params.messageid, req.body, {new: true, upsert:true}, function(err, updatedMessage) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error updating object.'});
//       }
//       res.json(updatedMessage);
//     });
//   });


//   router.delete('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.remove({_id:req.params.messageid}, function(err, Message) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error deleting object.'});
//       }
//       res.json(Message);
//     });
//   });


  router.get('/:messageid', function(req, res) {
  
    console.log(req.body);
    
    Message.findById(req.params.messageid, function(err, message) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }
      if(!message){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      res.json(message);
    });
  });



router.get('/', function(req, res) {

  return Message.find({"recipient": req.params.request_id, id_project: req.projectid}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
      if (err) return next(err);
      res.json(messages);
    });
});

module.exports = router;
