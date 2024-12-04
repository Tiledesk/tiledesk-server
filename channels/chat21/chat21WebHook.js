var express = require('express');
var router = express.Router();
var Request = require("../../models/request");
var requestService = require('../../services/requestService');
var messageService = require('../../services/messageService');
var leadService = require('../../services/leadService');
var eventService = require('../../pubmodules/events/eventService');
var Project_user = require("../../models/project_user");
var RequestConstants = require("../../models/requestConstants");

var cacheUtil = require('../../utils/cacheUtil');
var cacheEnabler = require("../../services/cacheEnabler");


var mongoose = require('mongoose');
var winston = require('../../config/winston');
var MessageConstants = require("../../models/messageConstants");
var ProjectUserUtil = require("../../utils/project_userUtil");
var RequestUtil = require("../../utils/requestUtil");
const authEvent = require('../../event/authEvent');

var syncJoinAndLeaveGroupEvent =  false;
if (process.env.SYNC_JOIN_LEAVE_GROUP_EVENT === true || process.env.SYNC_JOIN_LEAVE_GROUP_EVENT ==="true") {
  syncJoinAndLeaveGroupEvent = true;
}
winston.info("Chat21 Sync JoinAndLeave Support Group Event: " + syncJoinAndLeaveGroupEvent);

var allowReopenChat =  false;   //It's work only with firebase chat engine
if (process.env.ALLOW_REOPEN_CHAT === true || process.env.ALLOW_REOPEN_CHAT ==="true") {
  allowReopenChat = true;
}
winston.info("Chat21 allow reopen chat: " + allowReopenChat);


router.post('/', function (req, res) {


  winston.debug("req.body.event_type: " + req.body.event_type);

                                                    //Deprecated
  if (req.body.event_type == "message-sent" || req.body.event_type == "new-message") {
    //with projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
    //with recipient with existing projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests

    //with recipient with no projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"1234567891234567891", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests


    winston.debug("event_type", "new-message");

    var message = req.body.data;
    
    winston.debug("message text: " + message.text);


    // before request_id id_project unique commented
    /*
    var projectid;
    if (message.attributes) {            
      projectid = message.attributes.projectId;
      winston.debug("chat21 projectid", projectid);
    }

    if (!projectid) {
      winston.warn("projectid is null. Not a support message");
      return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
    }
    */
    // before request_id id_project unique commented



    winston.debug("Chat21 message", message);

        // requestcachefarequi nocachepopulatereqired        
        let q = Request.findOne({request_id: message.recipient}) 

        if (cacheEnabler.request) {
          q.cache(cacheUtil.defaultTTL, "requests:request_id:"+message.recipient+":simple"); //request_cache
                                                                                            // project_id not available //without project for chat21 webhook
          winston.debug('request cache enabled');
        }
        return q.exec(function(err, request) {

        // before request_id id_project unique - commented
               

          if (err) {
            return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
          }

          winston.debug('request cache simple 1', request);

          if (!request) { //the request doen't exists create it

            winston.debug("request not exists with request_id: " + message.recipient);

            var departmentid = "default";


            var language = message.language;
            winston.debug("chat21 language", language);

            var sourcePage;
            var client;
            var userEmail;
            var userFullname;
            var projectid;  // before request_id id_project unique - commented

            var requestStatus = undefined;

            if (message.attributes) {

              // before request_id id_project unique - commented
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

            winston.debug("requestStatus " + requestStatus);

            // before request_id id_project unique - commented
            if (!projectid) {
              winston.verbose("projectid is null. Not a support message");
              return res.status(400).send({ success: false, msg: 'projectid is null. Not a support message' });
            }


            if (!message.recipient.startsWith("support-group")) {
              winston.verbose("recipient not starts wiht support-group. Not a support message");
              return res.status(400).send({ success: false, msg: "recipient not starts wiht support-group. Not a support message" });
            }


            if (!userFullname) {
              userFullname = message.sender_fullname;
            }




            var leadAttributes = message.attributes;
            leadAttributes["senderAuthInfo"] = message.senderAuthInfo;

            // winston.debug("userEmail is defined");
            // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy)
            return leadService.createIfNotExistsWithLeadId(message.sender, userFullname, userEmail, projectid, null, leadAttributes)
              .then(function (createdLead) {

                var rAttributes = message.attributes;
                rAttributes["senderAuthInfo"] = message.senderAuthInfo;
                winston.debug("rAttributes", rAttributes);




                // message.sender is the project_user id created with firebase custom auth

                var isObjectId = mongoose.Types.ObjectId.isValid(message.sender);
                winston.debug("isObjectId:" + isObjectId);

                var queryProjectUser = { id_project: projectid, status: "active" };

                if (isObjectId) {
                  queryProjectUser.id_user = message.sender;
                } else {
                  queryProjectUser.uuid_user = message.sender;
                }
                winston.debug("queryProjectUser", queryProjectUser);


                return Project_user.findOne(queryProjectUser)
                  // .cache(cacheUtil.defaultTTL, projectid+":project_users:request_id:"+requestid)
                  .exec(function (err, project_user) {

                    var project_user_id = null;

                    if (err) {
                      winston.error("Error getting the project_user_id", err);
                    }

                    if (project_user) {
                      winston.debug("project_user", project_user);
                      project_user_id = project_user.id;
                      winston.debug("project_user_id: " + project_user_id);
                    } else {
                      // error->utente bloccato oppure non autenticator request.requester sarà nulll...⁄
                      return winston.error("project_user not found with query: ", queryProjectUser);
                    }


                    // var auto_close;

                    // // qui projecy nn c'è devi leggerlo
                    // // if (req.project.attributes.auto_close === false) {
                    // //   auto_close = 10;
                    // // }


                    var new_request = {
                      request_id: message.recipient, project_user_id: project_user_id, lead_id: createdLead._id, id_project: projectid, first_text: message.text,
                      departmentid: departmentid, sourcePage: sourcePage, language: language, userAgent: client, status: requestStatus, createdBy: undefined,
                      attributes: rAttributes, subject: undefined, preflight: false, channel: undefined, location: undefined,
                      lead: createdLead, requester: project_user
                      // , auto_close: auto_close
                    };

                    winston.debug("new_request", new_request);

                    return requestService.create(new_request).then(function (savedRequest) {


                      //return requestService.createWithIdAndRequester(message.recipient, project_user_id, createdLead._id, projectid, message.text, 
                      // departmentid, sourcePage, language, client, requestStatus, null, rAttributes).then(function (savedRequest) {


                      var messageId = undefined;
                      if (message.attributes && message.attributes.tiledesk_message_id) {
                        messageId = message.attributes.tiledesk_message_id;
                      }

                      // upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language)
                      return messageService.upsert(messageId, message.sender, message.sender_fullname, message.recipient, message.text,
                        projectid, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes, message.type, message.metadata, language).then(function (savedMessage) {
                          return res.json(savedRequest);
                          // return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {
                          // return res.json(savedRequestWithIncrement);
                          // });


                        }).catch(function (err) {
                          winston.error('Error creating the request object.', err);
                          return res.status(500).send({ success: false, msg: 'Error creating the request object.', err: err });
                        });
                    }).catch((err) => {
                      winston.error('(Chat21Webhook) Error creating the request object ', err);
                      return res.status(500).send({ success: false, msg: 'Error creating the request object.', err: err });
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
              winston.debug("recipient not starts with support-group. Not a support message");
              return res.status(400).send({success: false, msg: "recipient not starts with support-group. Not a support message"});
            }
        
            var messageId = undefined;
            var language = undefined;
            if (message.attributes) {
              if (message.attributes.tiledesk_message_id) {
                messageId = message.attributes.tiledesk_message_id;
              }
              if (message.attributes.language) {
                language = message.attributes.language;
              }
            }


            // upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language) {
            return messageService.upsert(messageId, message.sender, message.sender_fullname, message.recipient, message.text,
              request.id_project, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes, message.type, message.metadata, language).then(function(savedMessage){      

                // TODO se stato = 50 e scrive visitatotre sposto a stato 100 poi queuue lo smista

                // TOOD update also request attributes and sourcePage
                
                    // return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                      // winston.debug("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                      winston.debug("before updateWaitingTimeByRequestId*******",request.participants, message.sender);
                      winston.debug("updateWaitingTimeByRequestId******* message: "+ message.sender);
                      // TODO it doesn't work for internal requests bacause participanets == message.sender⁄
                      if (request.participants && request.participants.indexOf(message.sender) > -1) { //update waiitng time if write an  agent (member of participants)
                        winston.debug("updateWaitingTimeByRequestId*******");
                                                                                                                  //leave this parameter to true because it is used by websocket to notify request.update                                 
                        return requestService.updateWaitingTimeByRequestId(request.request_id, request.id_project, true).then(function(upRequest) {
                          return res.json(upRequest);
                        });
                      }else {
                        return res.json(savedMessage);
                      }
                    // });
              }).catch(function(err){ 
                winston.error("Error creating chat21 webhook message: "+ JSON.stringify({err: err, message: message}));
                return res.status(500).send({success: false, msg: 'Error creating message', err:err });
              });



          }
        


        });

 
   
      
      // curl -X POST -H 'Content-Type:application/json'  -d '{ "event_type": "deleted-conversation", "createdAt": 1537973334802, "app_id": "tilechat", "user_id": "system", "recipient_id": "support-group-LNPQ57JnotOEEwDXr9b"}' http://localhost:3000/chat21/requests
                                                                                         // depreated
// this is a deprecated method for closing request. In the past used by chat21 cloud function support api /close method called by old versions of ionic. The new version of the ionic (both for firebase and mqtt) chat call Tiledesk DELETE /requests/:req_id endpoint so  this will not be used                                                                                        
    } else if (req.body.event_type == "conversation-archived" || req.body.event_type == "deleted-conversation" ) {
      winston.debug("event_type deleted-conversation");

      var conversation = req.body.data;
      winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id: "+user_id);

      var recipient_id = req.body.convers_with;

      if (!recipient_id && req.body.recipient_id) { //back compatibility
        recipient_id = req.body.recipient_id;
      }
      winston.debug("recipient_id: "+recipient_id);

      

 
      if (!recipient_id.startsWith("support-group")){
        winston.debug("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

     

      if (user_id!="system"){
        winston.debug("we close request only for system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }

// chiudi apri e chiudi. projectid nn c'è in attributes

                // prendi id progetto dal recipient_id e nn da attributes. facciamo release intermedia nel cloud con solo questa modifica

              var projectId = RequestUtil.getProjectIdFromRequestId(recipient_id);

              var isObjectId = mongoose.Types.ObjectId.isValid(projectId);
              winston.debug("isObjectId:"+ isObjectId);

              winston.debug("attributes",conversation.attributes);

              if (!projectId || !isObjectId) { //back compatibility when projectId were always presents in the attributes (firebase)                
                projectId = conversation.attributes.projectId;
                winston.verbose('getting projectId from attributes (back compatibility): '+ projectId);
              }
                
              winston.debug('projectId: '+ projectId);

              if (!projectId) {
                return res.status(500).send({success: false, msg: "Error projectid is not presents in attributes " });
              }
              
              var query = {request_id: recipient_id, id_project: projectId};
              winston.debug('query:'+ projectId);
              
              winston.debug('conversation-archived Request.findOne(query);:');
              let q = Request.findOne(query);
              // if (cacheEnabler.request) {
              //   q.cache(cacheUtil.defaultTTL, projectId+":requests:request_id:"+recipient_id+":simple"); //request_cache NOT IMPORTANT HERE
              //   winston.debug('project cache enabled');
              // }
              return q.exec(function(err, request) {

                if (err) {
                  winston.error("Error finding request with query ", query);
                  return res.status(500).send({success: false, msg: "Error finding request with query " + query, err:err });
                }
                if (!request) {
                  winston.warn("request not found for query ", query);
                  return res.status(404).send({success: false, msg: "Request with query " + JSON.stringify(query) + " not found" });
                }
              
                if (request.status === RequestConstants.CLOSED) {
                   winston.verbose("request already closed with id: " + recipient_id);
                  return res.send({success: false, msg: "request already closed with id: " + recipient_id});
                }


                    // se agente archivia conversazione allora chiude anche richiesta
                    // return requestService.setParticipantsByRequestId(recipient_id, firestoreProjectid, firestoreMembersAsArray).then(function(updatedParticipantsRequest) {
                      // winston.debug('updatedParticipantsRequest', updatedParticipantsRequest);
                      // manca id

                      // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
                      const closed_by = user_id;
                      return requestService.closeRequestByRequestId(recipient_id, projectId, false, true,closed_by ).then(function(updatedStatusRequest) {
                        
                        winston.debug('updatedStatusRequest', updatedStatusRequest.toObject());
                        return res.json(updatedStatusRequest);                      
                    }).catch(function(err){
                      winston.error("Error closing request", err);
                      return res.status(500).send({success: false, msg: 'Error closing request', err:err });
                    });



                  // });
            });


          


      

    }else if (req.body.event_type == "join-member") {
      winston.debug("event_type","join-member");

      winston.debug("req.body", JSON.stringify(req.body));

      if (!syncJoinAndLeaveGroupEvent)  {
        winston.debug("syncJoinAndLeaveGroupEvent is disabled");
        return res.status(200).send({success: true, msg: "syncJoinAndLeaveGroupEvent is disabled" });
      }

      var data = req.body.data;
      //winston.debug("data",data);

      var group = data.group;
      // winston.debug("group",group);

      var new_member = req.body.member_id;
      winston.debug("new_member: " + new_member);

      if (new_member=="system") {
        winston.verbose("new_member "+ new_member+ " not added to participants");
        return res.status(400).send({success: false, msg: "new_member "+ new_member+ " not added to participants" });
      }

      var request_id = req.body.group_id;
      winston.debug("request_id: " + request_id);

      var id_project;
      if (group && group.attributes) {
        id_project = group.attributes.projectId;
      }else {
        winston.verbose("id_project "+ id_project+ " isn't a support joining");
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      winston.debug("id_project: " + id_project);
      
      // requestcachefarequi populaterequired
      winston.debug('join-member Request.findOne(query);:');
      return Request.findOne({request_id: request_id, id_project: id_project})
          .populate('lead') //TODO posso prenderlo da snapshot senza populate cache_attention
          .exec(function(err, request) {
        if (err){
          winston.error(err);
           return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
        }
        if (!request) {
          return res.status(404).send({success: false, msg: 'Request not found for request_id '+ request_id + ' and id_project '+ id_project});
        }


          winston.debug("request",request.toObject());
                   // lead_id used. Change it?

          // winston.info("request.snapshot.lead",request.snapshot.lead);
          // if (request.snapshot.lead && request.snapshot.lead.lead_id==new_member) {   

          if (request.lead && request.lead.lead_id==new_member) {            
            winston.debug("don't  joining request.lead or a lead");
            return res.status(400).send({success: false, msg: "don't  joining request.lead or a lead" });
          }else {

            // se gia in participants scarta
            return requestService.addParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
              winston.debug("Join memeber ok");
              return res.json(updatedRequest);
            }).catch(function(err){
              winston.error("Error joining memeber", err);
              return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
            });
          }

       
    });


  }else if (req.body.event_type == "leave-member") {
    winston.debug("event_type","leave-member");
    
    winston.debug("req.body", JSON.stringify(req.body));

    if (!syncJoinAndLeaveGroupEvent)  {
      winston.debug("syncJoinAndLeaveGroupEvent is disabled");
      return res.status(200).send({success: true, msg: "syncJoinAndLeaveGroupEvent is disabled" });
    }



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
      } else {
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      winston.debug("id_project", id_project);

    winston.verbose("Chat21WebHook: leaving member : " + new_member +" from the request with request_id: " + request_id +" from the project with id: " + id_project);

    return requestService.removeParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
      winston.debug("Leave memeber ok");
      return res.json(updatedRequest);
    }).catch(function(err){
      winston.error("Error leaving memeber", err);
      return res.status(500).send({success: false, msg: 'Error leaving memeber', err:err });
    });
  }
  
  else if (req.body.event_type == "deleted-archivedconversation" || req.body.event_type == "conversation-unarchived") {

    winston.debug("event_type","deleted-archivedconversation");

    winston.debug("req.body",req.body);

    if (!allowReopenChat)  {
      winston.debug("allowReopenChat is disabled");
      return res.status(200).send({success: true, msg: "allowReopenChat is disabled" });
    }


      var conversation = req.body.data; 
      // winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id",user_id);

      var recipient_id = req.body.recipient_id;
      winston.debug("recipient_id",recipient_id);

     
//   TODO leggi projectid from support-group

      if (!recipient_id.startsWith("support-group")){
        winston.debug("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }



      if (user_id!="system"){
        winston.debug("not a system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }



     // scrivo... nuova viene popolato projectid in attributes poi chiudo ed in archived c'è projectid 
      // quando scrivo viene cancellato archived e nuovo messaggio crea conv ma senza project id... lineare che è cosi
      // si verifica solo se admin (da ionic ) archivia di nuovo senza che widget abbia scritto nulla (widget risetta projectid in properties)

      var id_project;
      if (conversation && conversation.attributes) {
        id_project = conversation.attributes.projectId;
      }else {
        winston.debug( "not a support deleting archived conversation" );
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
else if (req.body.event_type == "typing-start") {

  winston.debug("event_type typing-start");

  winston.debug("typing-start req.body",req.body);


  var recipient_id = req.body.recipient_id;
  winston.debug("recipient_id",recipient_id);

  var writer_id = req.body.writer_id;
  winston.debug("writer_id",writer_id);
  

  if (writer_id=="system") {
    winston.debug("not saving system typings");
    return res.status(400).send({success: false, msg: "not saving system typings" });
  }
  var data = req.body.data;
  winston.debug("data",data);

  if (!recipient_id.startsWith("support-group")){
    winston.debug("not a support conversation");
    return res.status(400).send({success: false, msg: "not a support conversation" });
  }

  
  // requestcachefarequi nocachepopulatereqired
  winston.debug('typing-start Request.findOne(query);:');
  return Request.findOne({request_id: recipient_id})
                             //TOD  errore cache sistemare e riabbilitare->
  // .cache(cacheUtil.defaultTTL, req.projectid+":requests:request_id:"+recipient_id)   cache_attention
  .exec(function(err, request) {
  if (err){
    winston.error(err);
    return res.status(500).send({success: false, msg: 'Error finding request', err:err });
  }
  if (!request) {
    return res.status(404).send({success: false, msg: 'Request not found for request_id '+ request_id + ' and id_project '+ id_project});
  }

  if (writer_id.startsWith("bot_")){
      winston.debug('Writer  writer_id starts with bot_');
      return res.status(500).send({success: false, msg: 'Writer  writer_id starts with bot_' });
  }

  var isObjectId = mongoose.Types.ObjectId.isValid(writer_id);
  winston.debug("isObjectId:"+ isObjectId);

  var queryProjectUser = {id_project: request.id_project, status: "active"};

  if (isObjectId) {
    queryProjectUser.id_user = writer_id;
  }else {
    queryProjectUser.uuid_user = writer_id;
  }

  return Project_user.findOne(queryProjectUser, function(err, pu){
    if (err){
      winston.error(err);
      return res.status(500).send({success: false, msg: 'Error finding pu', err:err });
    }
    winston.debug("typing pu", pu);

    if (!pu) {
      return winston.warn("Project_user for typing not found", queryProjectUser);
    }
    var attr = {recipient_id: recipient_id, writer_id:writer_id, data: data};


    //       emit(name, attributes, id_project, project_user, createdBy, status, user) {
    eventService.emit("typing.start", attr, request.id_project, pu._id, writer_id).then(function (data) {
      // eventService.emit("typing.start", attr, request.id_project, pu._id, writer_id, "volatile").then(function (data) {      
      return res.json(data);
    });
  });
 


  });
  

}

// curl -X POST -H 'Content-Type:application/json'  -d '{"event_type":"presence-change","presence":"online","createdAt":1596448898776,"app_id":"tilechat","user_id":"a9109ed4-ceda-4118-b934-c9b83c2eaf12","data":true}' http://localhost:3000/chat21/requests


else if (req.body.event_type == "presence-change") {

  winston.debug("event_type","presence-change");

  winston.debug("req.body", req.body);
  

  var data = req.body.data;
  winston.debug("data", data);
  
  var user_id = req.body.user_id;
  winston.debug("user_id: "+ user_id);

  var presence = req.body.presence;
  winston.debug("presence: "+  presence);


  var isObjectId = mongoose.Types.ObjectId.isValid(user_id);
  winston.debug("isObjectId:"+ isObjectId);

  var queryProjectUser = {status: "active"};

  if (isObjectId) {
    queryProjectUser.id_user = user_id;
  }else {
    queryProjectUser.uuid_user = user_id;
  }
  winston.debug("queryProjectUser:", queryProjectUser);



  Project_user.find(queryProjectUser, function (err, project_users) {
    // Project_user.updateMany(queryProjectUser, update, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user", err);
      return res.status(500).send({ success: false, msg: 'Error getting objects.' });
    }
    if (!project_users) {
      winston.warn('Error getting Project_user.' );
      return res.status(404).send({ success: false, msg: 'Error getting Project_user.' });
    }
    winston.debug("project_users:", project_users);


    project_users.forEach(project_user => { 
      winston.debug("project_user:", project_user);
      var update = {status:presence};
      update.changedAt = new Date();

      project_user.presence = update

      
      project_user.save(function (err, savedProjectUser) {
        if (err) {
         winston.error('Error saving project_user ', err)
        //  return res.status(500).send({ success: false, msg: 'Error getting objects.' });         
        } else {
        winston.debug('project_user saved ', savedProjectUser);


        savedProjectUser
          // .populate({path:'id_user', select:{'firstname':1, 'lastname':1}})
          // .populate({path:'id_project', select:{'settings':1}})
          .populate([{path:'id_user', select:{'firstname':1, 'lastname':1}}, {path:'id_project'}])
          // .populate('id_user id_project')
                .execPopulate(function (err, updatedProject_userPopulated){    
                if (err) {
                  winston.error("Error gettting updatedProject_userPopulated for update", err);
                  // continue;
                  // return res.status(500).send({ success: false, msg: "Error gettting updatedProject_userPopulated for update" }); 
                } else {

                  if (!updatedProject_userPopulated) {
                    winston.warn('Error getting updatedProject_userPopulated.',savedProjectUser );
                    // continue;
                    // return res.status(404).send({ success: false, msg: 'Error getting updatedProject_userPopulated.' });
                  } else {

                    winston.debug("updatedProject_userPopulated:", updatedProject_userPopulated);
                    var pu = updatedProject_userPopulated.toJSON();
          
                    // urgente Cannot read property '_id' of null at /usr/src/app/channels/chat21/chat21WebHook.js:663:68 a
                    if (!updatedProject_userPopulated.id_project) {
                      winston.warn('Error updatedProject_userPopulated.id_project not found.',{updatedProject_userPopulated:updatedProject_userPopulated, savedProjectUser:savedProjectUser,project_user:project_user});
                      // return res.status(404).send({ success: false, msg: 'Error updatedProject_userPopulated.id_project not found.' });
                      // continue;
                    } else {
                      pu.id_project =  updatedProject_userPopulated.id_project._id;
          
            
                      if (updatedProject_userPopulated.id_user) {
                        pu.id_user = updatedProject_userPopulated.id_user._id;
                      }else {
                        // it's uuid_user user
                      }
                      
                      pu.isBusy = ProjectUserUtil.isBusy(updatedProject_userPopulated, updatedProject_userPopulated.id_project.settings && updatedProject_userPopulated.id_project.settings.max_agent_assigned_chat);
            
                      // winston.info("pu:", pu);
            
            
                      authEvent.emit('project_user.update', {updatedProject_userPopulated:pu, req: req, skipArchive:true});
                    // winston.info("after pu:");
                    }
                  
          

                  }   
                  
                }       
                
                


            });
        }


    }); 


    
    });
 
    if (project_users && project_users.length>0) {
      winston.verbose("Presence changed for user_id : "+  user_id + " and presence "+ presence +". Updated " + project_users.length + " project users");
    }
    

    return res.json({ok:true});


  });
  

}

else if (req.body.event_type == "new-group") {
  winston.debug("new-group is not implemented");
  res.json("new-group event_type is not implemented");
}
else {
  winston.debug("Chat21WebHook error event_type not implemented", req.body);
  res.json("Not implemented");
}

  

});













module.exports = router;
