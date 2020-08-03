var express = require('express');
var router = express.Router();
var Request = require("../../models/request");
var requestService = require('../../services/requestService');
var messageService = require('../../services/messageService');
var leadService = require('../../services/leadService');
var eventService = require('../../pubmodules/events/eventService');
var Project_user = require("../../models/project_user");

var cacheUtil = require('../../utils/cacheUtil');

var mongoose = require('mongoose');
var winston = require('../../config/winston');
var MessageConstants = require("../../models/messageConstants");
var ProjectUserUtil = require("../../utils/project_userUtil");
const authEvent = require('../../event/authEvent');


router.post('/', function (req, res) {


   

  // 2020-05-21T17:56:50.215257+00:00 heroku[router]: at=info method=POST path="/chat21/requests" host=tiledesk-server-pre.herokuapp.com request_id=94c9541f-bff9-4a3a-9086-3653e0e1781a fwd="107.178.200.218" dyno=web.1 connect=4ms service=3ms status=500 bytes=1637 protocol=https
  // 2020-05-21T17:56:50.397555+00:00 app[web.1]: error: message validation failed: text: Path `text` is required. {"errors":{"text":{"message":"Path `text` is required.","name":"ValidatorError","properties":{"message":"Path `text` is required.","type":"required","path":"text","value":""},"kind":"required","path":"text","value":""}},"_message":"message validation failed","name":"ValidationError"}
  // 2020-05-21T17:56:50.397891+00:00 app[web.1]: error: Error creating messagemessage validation failed: text: Path `text` is required. {"errors":{"text":{"message":"Path `text` is required.","name":"ValidatorError","properties":{"message":"Path `text` is required.","type":"required","path":"text","value":""},"kind":"required","path":"text","value":""}},"_message":"message validation failed","name":"ValidationError","stack":"ValidationError: message validation failed: text: Path `text` is required.\n    at new ValidationError (/app/node_modules/mongoose/lib/error/validation.js:31:11)\n    at model.Document.invalidate (/app/node_modules/mongoose/lib/document.js:2461:32)\n    at p.doValidate.skipSchemaValidators (/app/node_modules/mongoose/lib/document.js:2310:17)\n    at /app/node_modules/mongoose/lib/schematype.js:1064:9\n    at processTicksAndRejections (internal/process/next_tick.js:74:9)"}

  if (req.body.event_type == "new-message") {
    //with projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
    //with recipient with existing projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests

    //with recipient with no projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"1234567891234567891", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests


    winston.debug("event_type", "new-message");

    var message = req.body.data;
 
    winston.info("Chat21 message", message);

        // requestcachefarequi nocachepopulatereqired
        return Request.findOne({request_id: message.recipient})      
          // .cache(cacheUtil.defaultTTL, req.projectid+":requests:request_id:"+requestid) project_id not available
          .exec(function(err, request) {
          // return Request.findOne({request_id: message.recipient, id_project: projectid}, function(err, request) {

          if (err) {
            return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
          }

          if (!request) { //the request doen't exists create it

                winston.info("request not exists with request_id: " + message.recipient);
                
                var departmentid = "default";

//                TODO 2020-04-20T14:38:56.954323+00:00 app[web.1]: info: MessageTransformerInterceptor message.create.simple.before {"beforeMessage":{"sender":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2","senderFullname":"dario","recipient":"support-group-M5N0kHtNohGt8iCJiQy","text":"test 3","id_project":"5b55e806c93dde00143163dd","createdBy":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2","status":200,"attributes":{"client":"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4106.0 Mobile Safari/537.36","departmentId":"5c04ed747608f10015378fe8","departmentName":"Dipartimento 1","projectId":"5b55e806c93dde00143163dd","requester_id":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2","sourcePage":"http://localhost:4200/test-custom-auth.html?tiledesk_callouttimer=2&tiledesk_isLogEnabled=true","userEmail":"test1@tiledesk.com","userFullname":"dario","senderAuthInfo":{"authType":"USER","authVar":{"token":{"aud":"chat21-pre-01","auth_time":1587392396,"exp":1587395996,"firebase":{"sign_in_provider":"custom"},"iat":1587392396,"iss":"https://securetoken.google.com/chat21-pre-01","sub":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2","user_id":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2"},"uid":"e06e10e8-24e9-47b1-b0c4-0ab8f8f576d2"}}},"type":"text","metadata":"","language":"it-IT"}}
// 2020-04-20T14:38:56.986907+00:00 app[web.1]: error: undefined {"driver":true,"name":"MongoError","index":0,"code":17262,"errmsg":"language override unsupported: IT-IT"}
// 2020-04-20T14:38:56.987274+00:00 app[web.1]: error: Error creating the request object.language override unsupported: IT-IT {"driver":true,"name":"MongoError","index":0,"code":17262,"errmsg":"language override unsupported: IT-IT","stack":"MongoError: language override unsupported: IT-IT\n    at Function.create (/app/node_modules/mongodb/lib/core/error.js:44:12)\n    at toError (/app/node_modules/mongodb/lib/utils.js:150:22)\n    at coll.s.topology.insert (/app/node_modules/mongodb/lib/operations/common_functions.js:265:39)\n    at handler (/app/node_modules/mongodb/lib/core/topologies/replset.js:1209:22)\n    at /app/node_modules/mongodb/lib/core/connection/pool.js:420:18\n    at processTicksAndRejections (internal/process/next_tick.js:74:9)"}
// 2020-04-20T14:38:57.027369+00:00 app[we

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
                  winston.warn("projectid is null. Not a support message");
                  return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
                }
                if (!message.recipient.startsWith("support-group")) {
                  winston.warn("recipient not starts wiht support-group. Not a support message");
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




                      // message.sender is the project_user id created with firebase custom auth

                      var isObjectId = mongoose.Types.ObjectId.isValid(message.sender);
                      winston.debug("isObjectId:"+ isObjectId);

                      var queryProjectUser = {id_project:projectid};
                      // var queryProjectUser = {id_project:projectid,  $or:[ {uuid_user: message.sender}, {id_user:  message.sender }]};
                      if (isObjectId) {
                        queryProjectUser.id_user = message.sender;
                      }else {
                        queryProjectUser.uuid_user = message.sender;
                      }
                      winston.info("queryProjectUser", queryProjectUser);
                      

                    return Project_user.findOne(queryProjectUser)
                    // .cache(cacheUtil.defaultTTL, projectid+":project_users:request_id:"+requestid)
                    .exec(function (err, project_user) {

                      var project_user_id = null; 

                      if (err) {
                        winston.error("Error getting the project_user_id", err);
                      }

                      if (project_user) {
                        winston.info("project_user", project_user);
                        project_user_id = project_user.id;
                        winston.info("project_user_id: " + project_user_id);
                      }

                      // });
                    // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
                      return requestService.createWithIdAndRequester(message.recipient, project_user_id, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client, requestStatus, null, rAttributes).then(function (savedRequest) {
                 

                        var messageId = undefined;
                        if (message.attributes && message.attributes.tiledesk_message_id) {
                          messageId = message.attributes.tiledesk_message_id;
                        }

                       // upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language)
                        return messageService.upsert(messageId, message.sender, message.sender_fullname, message.recipient, message.text,
                          projectid, null, MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED, message.attributes, message.type, message.metadata, language).then(function(savedMessage){
                                                                
                            return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {
                              return res.json(savedRequestWithIncrement);
                            });
                          
                        
                      }).catch(function (err) {
                        winston.error( 'Error creating the request object.', err);
                        return res.status(500).send({success: false, msg: 'Error creating the request object.', err:err});
                      });
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
                
                    return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                      // winston.debug("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                       
                      // TODO it doesn't work for internal requests bacause participanets == message.sender⁄
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
      winston.debug("event_type deleted-conversation");

      var conversation = req.body.data;
      winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id: "+user_id);

      var recipient_id = req.body.recipient_id;
      winston.debug("recipient_id: "+recipient_id);

      winston.debug("attributes",conversation.attributes);

 
      if (!recipient_id.startsWith("support-group")){
        winston.debug("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        winston.debug("we close request only for system conversation");
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
              
              return Request.findOne(query)
              .cache(cacheUtil.defaultTTL, projectId+":requests:request_id:"+recipient_id)
              .exec(function(err, request) {

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
      
      // requestcachefarequi populaterequired
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


          winston.debug("request",request.toObject());
          
         
          if (request.lead.lead_id==new_member) {            
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
      winston.debug("Leave memeber ok");
      return res.json(updatedRequest);
    }).catch(function(err){
      winston.error("Error leaving memeber", err);
      return res.status(500).send({success: false, msg: 'Error leaving memeber', err:err });
    });
  }
  
  else if (req.body.event_type == "deleted-archivedconversation") {

    winston.debug("event_type","deleted-archivedconversation");

    winston.debug("req.body",req.body);


      var conversation = req.body.data;
      // winston.debug("conversation",conversation);

      var user_id = req.body.user_id;
      winston.debug("user_id",user_id);

      var recipient_id = req.body.recipient_id;
      winston.debug("recipient_id",recipient_id);

     


      if (!recipient_id.startsWith("support-group")){
        winston.debug("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        winston.debug("not a system conversation");
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
else if (req.body.event_type == "typing-start") {

  winston.debug("event_type","typing-start");

  winston.debug("req.body",req.body);


  var recipient_id = req.body.recipient_id;
  winston.debug("recipient_id",recipient_id);

  var writer_id = req.body.writer_id;
  winston.debug("writer_id",writer_id);
  

  var data = req.body.data;
  winston.debug("data",data);

  if (!recipient_id.startsWith("support-group")){
    winston.debug("not a support conversation");
    return res.status(400).send({success: false, msg: "not a support conversation" });
  }

  
  // requestcachefarequi nocachepopulatereqired
  return Request.findOne({request_id: recipient_id})
  .cache(cacheUtil.defaultTTL, req.projectid+":requests:request_id:"+recipient_id)
  .exec(function(err, request) {
  if (err){
    winston.error(err);
    return res.status(500).send({success: false, msg: 'Error finding request', err:err });
  }
  if (!request) {
    return res.status(404).send({success: false, msg: 'Request not found for request_id '+ request_id + ' and id_project '+ id_project});
  }


  // return Project_user.findOne({id_user: writer_id, id_project: request.id_project}, function(err, pu){
  //   if (err){
  //     winston.error(err);
  //     return res.status(500).send({success: false, msg: 'Error finding pu', err:err });
  //   }
  // eventService.emit("typing-start", attributes, request.id_project, pu, pu.id_user).then(function (data) {
    var attr = {recipient_id: recipient_id, writer_id:writer_id, data: data}
    eventService.emit("typing.start", attr, request.id_project, null, "system").then(function (data) {
      return res.json(data);
    });
  // });
 


  });
  

}

// curl -X POST -H 'Content-Type:application/json'  -d '{"event_type":"presence-change","presence":"online","createdAt":1596448898776,"app_id":"tilechat","user_id":"a9109ed4-ceda-4118-b934-c9b83c2eaf12","data":true}' http://localhost:3000/chat21/requests


else if (req.body.event_type == "presence-change") {

  winston.info("event_type","presence-change");

  winston.info("req.body", req.body);
  

  var data = req.body.data;
  winston.info("data", data);
  
  var user_id = req.body.user_id;
  winston.info("user_id: "+ user_id);

  var presence = req.body.presence;
  winston.info("presence: "+  presence);

  // var update = {"$set":{online_status: presence}};

  var isObjectId = mongoose.Types.ObjectId.isValid(user_id);
  winston.info("isObjectId:"+ isObjectId);

  var queryProjectUser = {};
  // var queryProjectUser = {id_project:projectid,  $or:[ {uuid_user: message.sender}, {id_user:  message.sender }]};
  if (isObjectId) {
    queryProjectUser.id_user = user_id;
  }else {
    queryProjectUser.uuid_user = user_id;
  }
  winston.info("queryProjectUser:", queryProjectUser);



  Project_user.find(queryProjectUser, function (err, project_users) {
    // Project_user.updateMany(queryProjectUser, update, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user", err);
      return res.status(500).send({ success: false, msg: 'Error getting objects.' });
    }
    winston.info("project_users:", project_users);


    project_users.forEach(project_user => { 
      winston.info("project_user:", project_user);
      project_user.online_status = presence;

      project_user.save(function (err, savedProjectUser) {
        if (err) {
         return winston.error('Error saving project_user ', err)
        }
        winston.info('project_user saved ', savedProjectUser);


        savedProjectUser
          // .populate({path:'id_user', select:{'firstname':1, 'lastname':1}})
          // .populate({path:'id_project', select:{'settings':1}})
          .populate([{path:'id_user', select:{'firstname':1, 'lastname':1}}, {path:'id_project'}])
          // .populate('id_user id_project')
          .execPopulate(function (err, updatedProject_userPopulated){    
          if (err) {
            return winston.error("Error gettting updatedProject_userPopulated for update", err);
          }            
          winston.info("updatedProject_userPopulated:", updatedProject_userPopulated);
          var pu = updatedProject_userPopulated.toJSON();
          pu.id_project =  updatedProject_userPopulated.id_project._id;
          pu.id_user =  updatedProject_userPopulated.id_user._id;
          pu.isBusy = ProjectUserUtil.isBusy(updatedProject_userPopulated, updatedProject_userPopulated.id_project.settings && updatedProject_userPopulated.id_project.settings.max_agent_served_chat);
          
          winston.info("pu:", pu);
  
          authEvent.emit('project_user.update', {updatedProject_userPopulated:pu, req: req, skipArchive:true});
          winston.info("after pu:");
  
          


      });



    }); 


    
    });
 
    winston.info("return");
    return res.json({ok:true});


  });
  

}

else {
  res.json("Not implemented");
}

  

});













module.exports = router;
