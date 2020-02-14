var express = require('express');
var router = express.Router();
var Request = require("../../models/request");
var Message = require("../../models/message");
var Lead = require("../../models/lead");
var requestService = require('../../services/requestService');
var messageService = require('../../services/messageService');
var leadService = require('../../services/leadService');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;

var admin = require('../../channels/chat21/firebaseConnector');
const firestore = admin.firestore();

var winston = require('../../config/winston');
var MessageConstants = require("../../models/messageConstants");


router.post('/', function(req, res) {


   



  if (req.body.event_type == "new-message") {
    //with projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
    //with recipient with existing projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests

    //with recipient with no projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"1234567891234567891", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests


    winston.debug("event_type", "new-message");

    var message = req.body.data;
 
    winston.info("chat21 message", message);


        return Request.findOne({request_id: message.recipient}, function(err, request) {
          // return Request.findOne({request_id: message.recipient, id_project: projectid}, function(err, request) {

          if (err) {
            return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
          }

          if (!request) { //the request doen't exists create it

                winston.info("request not exists with request_id: " + message.recipient);
                
                var departmentid = "default";

                var language = message.language;
                winston.debug("chat21 language", language);
            
                var sourcePage;
                var client;
                var userEmail;
                var userFullname;
                var projectid;
            
                var requestStatus = undefined;

                if (message.attributes) {
            
                  projectid = message.attributes.projectId;
                  winston.debug("chat21 projectid", projectid);
            
                  departmentid = message.attributes.departmentId;
                  winston.debug("chat21 departmentid", departmentid);
            
                  sourcePage = message.attributes.sourcePage;
                  winston.debug("chat21 sourcePage", sourcePage);
                  
                  client = message.attributes.client;
                  winston.debug("chat21 client", client);
              
                
            
                  userEmail = message.attributes.userEmail;
                  winston.debug("chat21 userEmail", userEmail);
            
                  userFullname = message.attributes.userFullname;
                  winston.debug("chat21 userFullname", userFullname);

                  // TODO proactive status
                  // if (message.attributes.subtype === "info") {                    
                  //   requestStatus = 50;
                  // }
                }
                
                winston.debug("requestStatus "+ requestStatus);
                
            
                if (!projectid) {
                  winston.info("projectid is null. Not a support message");
                  return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
                }
                if (!message.recipient.startsWith("support-group")) {
                  winston.info("recipient not starts wiht support-group. Not a support message");
                  return res.status(400).send({success: false, msg: "recipient not starts wiht support-group. Not a support message"});
                }
            
              
                if (!userFullname) {
                  userFullname = message.sender_fullname;
                }

              
               

                var leadAttributes = message.attributes;
                leadAttributes["senderAuthInfo"] = message.senderAuthInfo;
              
                  // winston.debug("userEmail is defined");
                                    // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy)
                  return leadService.createIfNotExistsWithLeadId(message.sender, userFullname, userEmail, projectid, null, leadAttributes)
                  .then(function(createdLead) {

                    var rAttributes = message.attributes;
                    rAttributes["senderAuthInfo"] = message.senderAuthInfo;   
                    winston.debug("rAttributes", rAttributes);



                    // se /welcome devi mettere stato temporanedo della richiesta esempio 300 

                    // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
                      // message.sender is the project_user id created with firebase custom auth
                     // vedi su
                    //  ATTENTO QUI
                      return requestService.createWithIdAndRequester(message.recipient, null, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client, requestStatus, null, rAttributes).then(function (savedRequest) {
                        // return requestService.createWithIdAndRequester(message.recipient, message.sender, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client, null, null, rAttributes).then(function (savedRequest) {
                    
                    // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {                    
                       //return requestService.createWithId(message.recipient, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client, null, null, rAttributes).then(function (savedRequest) {


                        var messageId = undefined;
                        if (message.attributes && message.attributes.tiledesk_message_id) {
                          messageId = message.attributes.tiledesk_message_id;
                        }

                       // upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes)
                        return messageService.upsert(messageId, message.sender, message.sender_fullname, message.recipient, message.text,
                          projectid, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes, message.type, message.metadata).then(function(savedMessage){

                             // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes) {
                        // return messageService.create(message.sender, message.sender_fullname, message.recipient, message.text,
                        //   projectid, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes).then(function(savedMessage){
                                       

                            return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {
                              return res.json(savedRequestWithIncrement);
                            });
                          
                        
                      }).catch(function (err) {
                        winston.error( 'Error creating the request object.', err);
                        return res.status(500).send({success: false, msg: 'Error creating the request object.', err:err});
                      });
                  });
                });
                  
            
              


          } else {

        

            winston.debug("request  exists", request.toObject());

            // var projectid;
            // if (message.attributes) {
        
            //   projectid = message.attributes.projectId;
            //   winston.debug("chat21 projectid", projectid);
            // }
        
            // if (!projectid) {
            //   winston.debug("projectid is null. Not a support message");
            //   return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
            // }
            
            if (!message.recipient.startsWith("support-group")) {
              winston.info("recipient not starts with support-group. Not a support message");
              return res.status(400).send({success: false, msg: "recipient not starts with support-group. Not a support message"});
            }
        
            var messageId = undefined;
            if (message.attributes && message.attributes.tiledesk_message_id) {
              messageId = message.attributes.tiledesk_message_id;
            }
            // upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes) {
            return messageService.upsert(messageId, message.sender, message.sender_fullname, message.recipient, message.text,
              request.id_project, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes, message.type, message.metadata).then(function(savedMessage){

            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes) {                          
                // return messageService.create(message.sender, message.sender_fullname, message.recipient, message.text,
                //   request.id_project, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes).then(function(savedMessage){



                // TOOD update also request attributes and sourcePage
                
                    return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                      // winston.debug("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                       
                      if (savedRequest.participants && savedRequest.participants.indexOf(message.sender) > -1) { //update waiitng time if write an  agent (member of participants)
                        winston.debug("updateWaitingTimeByRequestId");
                        return requestService.updateWaitingTimeByRequestId(request.request_id, request.id_project).then(function(upRequest) {
                          return res.json(upRequest);
                        });
                      }else {
                        return res.json(savedRequest);
                      }
                    });
                  }).catch(function(err){
                    winston.error("Error creating message", err);
                    return res.status(500).send({success: false, msg: 'Error creating message', err:err });
                  });



          }
        


        });

 
   
      
      // curl -X POST -H 'Content-Type:application/json'  -d '{ "event_type": "deleted-conversation", "createdAt": 1537973334802, "app_id": "tilechat", "user_id": "system", "recipient_id": "support-group-LNPQ57JnotOEEwDXr9b"}' http://localhost:3000/chat21/requests

    } else if (req.body.event_type == "deleted-conversation") {
      winston.info("event_type deleted-conversation");

      var conversation = req.body.data;
      winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id: "+user_id);

      var recipient_id = req.body.recipient_id;
      winston.debug("recipient_id: "+recipient_id);

      winston.debug("attributes",conversation.attributes);

 
      if (!recipient_id.startsWith("support-group")){
        winston.info("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        winston.info("we close request only for system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }

// chiudi apri e chiudi. projectid nn c'è in attributes

              var projectId = conversation.attributes.projectId;
              winston.debug('projectId: '+ projectId);

              if (!projectId) {
                return res.status(500).send({success: false, msg: "Error projectid is not presents in attributes " });
              }
              
              var query = {request_id: recipient_id, id_project: projectId};
              winston.debug('query:'+ projectId);
              return Request.findOne(query, function(err, request) {

                if (err) {
                  winston.error("Error finding request with query ", query);
                  return res.status(500).send({success: false, msg: "Error finding request with query " + query, err:err });
                }
                if (!request) {
                  winston.warn("request not found for query ", query);
                  return res.status(404).send({success: false, msg: "Request with query " + JSON.stringify(query) + " not found" });
                }
              
                


                    // se agente archivia conversazione allora chiude anche richiesta
                    // return requestService.setParticipantsByRequestId(recipient_id, firestoreProjectid, firestoreMembersAsArray).then(function(updatedParticipantsRequest) {
                      // winston.debug('updatedParticipantsRequest', updatedParticipantsRequest);
                      // manca id
                      return requestService.closeRequestByRequestId(recipient_id, projectId).then(function(updatedStatusRequest) {
                        // if (req.project && req.project.settings && req.project.settings.email &&  req.project.settings.email.autoSendTranscriptToRequester) {
                        //   requestService.sendTranscriptByEmail(sendTo, req.params.requestid, req.projectid);
                        // }
                        winston.debug('updatedStatusRequest', updatedStatusRequest.toObject());
                        return res.json(updatedStatusRequest);
                      // });
                    }).catch(function(err){
                      winston.error("Error closing request", err);
                      return res.status(500).send({success: false, msg: 'Error closing request', err:err });
                    });



                  // });
            });


          


      

    }else if (req.body.event_type == "join-member") {
      winston.info("event_type","join-member");

      winston.debug("req.body", JSON.stringify(req.body));

      var data = req.body.data;
      //winston.debug("data",data);

      var group = data.group;
      // winston.debug("group",group);

      var new_member = req.body.member_id;
      winston.debug("new_member: " + new_member);

      if (new_member=="system") {
        winston.warn("new_member "+ new_member+ " not added to participants");
        return res.status(400).send({success: false, msg: "new_member "+ new_member+ " not added to participants" });
      }

      var request_id = req.body.group_id;
      winston.debug("request_id: " + request_id);

      var id_project;
      if (group && group.attributes) {
        id_project = group.attributes.projectId;
      }else {
        winston.error("id_project "+ id_project+ " isn't a support joining");
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      winston.debug("id_project: " + id_project);

      return Request.findOne({request_id: request_id, id_project: id_project})
          .populate('lead')
          .exec(function(err, request) {
        if (err){
          winston.error(err);
           return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
        }
        if (!request) {
          return res.status(404).send({success: false, msg: 'Request not found for request_id '+ request_id + ' and id_project '+ id_project});
        }

        // return Lead.findOne({lead_id: new_member, id_project: id_project}, function(err, lead) {

          winston.debug("request",request.toObject());
          
          // if (lead) {
          //   winston.info("lead",lead.toObject());
          // }
          
          //if (lead && lead._id.toString() == request.requester_id.toString()) {
            // if (lead && lead._id == request.lead) {
          if (request.lead.lead_id==new_member) {            
            winston.info("don't  joining request.lead or a lead");
            return res.status(400).send({success: false, msg: "don't  joining request.lead or a lead" });
          }else {

            // se gia in participants scarta
            return requestService.addParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
              winston.info("Join memeber ok");
              return res.json(updatedRequest);
            }).catch(function(err){
              winston.error("Error joining memeber", err);
              return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
            });
          }
         


        // });

       
    });


  }else if (req.body.event_type == "leave-member") {
    winston.info("event_type","leave-member");
    
    winston.debug("req.body", JSON.stringify(req.body));


    var data = req.body.data;
    // winston.debug("data",data);

    var group = data.group;
    winston.debug("group",group);

    var new_member = req.body.member_id;
    winston.debug("new_member",new_member);

    var request_id = req.body.group_id;
    winston.debug("request_id", request_id);


    var id_project;
      if (group && group.attributes) {
        id_project = group.attributes.projectId;
      }else {
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      winston.debug("id_project", id_project);

    return requestService.removeParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
      winston.info("Leave memeber ok");
      return res.json(updatedRequest);
    }).catch(function(err){
      winston.error("Error leaving memeber", err);
      return res.status(500).send({success: false, msg: 'Error leaving memeber', err:err });
    });
  }
  
  else if (req.body.event_type == "deleted-archivedconversation") {

    winston.info("event_type","deleted-archivedconversation");

    winston.debug("req.body",req.body);


      var conversation = req.body.data;
      // winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id",user_id);

      var recipient_id = req.body.recipient_id;
      winston.debug("recipient_id",recipient_id);

     


      if (!recipient_id.startsWith("support-group")){
        winston.info("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        winston.info("not a system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }


      var id_project;
      if (conversation && conversation.attributes) {
        id_project = conversation.attributes.projectId;
      }else {
        return res.status(400).send({success: false, msg: "not a support deleting archived conversation" });
      }
      winston.debug("id_project", id_project);


      return requestService.reopenRequestByRequestId(recipient_id, id_project).then(function(updatedRequest) {
        return res.json(updatedRequest);
      }).catch(function(err){
        winston.error("Error reopening request", err);
        return res.status(500).send({success: false, msg: 'Error reopening request', err:err });
      });


}

    else {
      res.json("Not implemented");
    }

  

});













module.exports = router;
