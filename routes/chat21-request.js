var express = require('express');
var router = express.Router();
var Request = require("../models/request");
var Message = require("../models/message");
var Lead = require("../models/lead");
var requestService = require('../services/requestService');
var messageService = require('../services/messageService');
var leadService = require('../services/leadService');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;


var admin = require('../utils/firebaseConnector');

 const firestore = admin.firestore();


router.post('/', function(req, res) {

  //console.log("chat21-request req.body", req.body);




  // console.log("req.projectid", req.projectid);
  // console.log("req.user.id", req.user.id);


  // if (req.body.event_type == "first-message") {

  //   console.log("event_type","first-message");


  //   var message = req.body.data;

    
  //   console.log("chat21 message", message);

  //   var departmentid = "default";

  //   var language = message.language;
  //   console.log("chat21 language", language);

  //   var sourcePage;
  //   var client;
  //   var userEmail;
  //   var userFullname;
  //   var projectid;


  //   if (message.attributes) {

  //     projectid = message.attributes.projectId;
  //     console.log("chat21 projectid", projectid);

  //     departmentid = message.attributes.departmentId;
  //     console.log("chat21 departmentid", departmentid);

  //     sourcePage = message.attributes.sourcePage;
  //     console.log("chat21 sourcePage", sourcePage);
      
  //     client = message.attributes.client;
  //     console.log("chat21 client", client);
  
     

  //     userEmail = message.attributes.userEmail;
  //     console.log("chat21 userEmail", userEmail);

  //     userFullname = message.attributes.userFullname;
  //     console.log("chat21 userFullname", userFullname);
  //   }
    

     

  //   if (!projectid) {
  //     console.log("projectid is null. Not a support message");
  //     return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
  //   }
  //   if (!message.recipient.startsWith("support-group")) {
  //     console.log("recipient not starts wiht support-group. Not a support message");
  //     return res.status(400).send({success: false, msg: "recipient not starts wiht support-group. Not a support message"});
  //   }

   

  //   if (userEmail) {

  //     console.log("userEmail is defined");
  //                       // ccreateIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy)
  //       return leadService.createIfNotExistsWithLeadId(message.sender, userFullname, userEmail, projectid).then(function(createdLead) {
  //           // createWithId(request_id, requester_id, id_project, first_text, departmentid='default', sourcePage, language, userAgent, status) {
  //             return requestService.createWithId(message.recipient, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client).then(function (result) {
  //               return res.json(result);
  //             }).catch(function (err) {
  //               console.log( 'Error creating the request object.', err);
  //               return res.status(500).send({success: false, msg: 'Error creating the request object.', err:err});
  //             });
  //       });
          

  //   }else {

  //                       // createWithId(request_id, requester_id, id_project, first_text, departmentid='default', sourcePage, language, userAgent, status) {
  //         return requestService.createWithId(message.recipient, message.sender, projectid, message.text, departmentid, sourcePage, language, client).then(function (result) {
  //           return res.json(result);
  //         }).catch(function (err) {
  //           console.log("err", err);

  //           return res.status(500).send({success: false, msg: 'Error creating the request object.', err:err});
  //         });

  //   }


   





  // } 
  // else 
  if (req.body.event_type == "new-message") {
    //with projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
    //with recipient with existing projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests

    //with recipient with no projectid
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"1234567891234567891", "recipient_fullname":"Andrea Leo","text":"text"}}' http://localhost:3000/chat21/requests


    console.log("event_type", "new-message");

    var message = req.body.data;
 
    console.log("chat21 message", message);


        return Request.findOne({request_id: message.recipient}, function(err, request) {
          // return Request.findOne({request_id: message.recipient, id_project: projectid}, function(err, request) {

          if (err) {
            return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
          }

          if (!request) { //the request doen't exists create it

                console.log("request not exists", request);
                
                var departmentid = "default";

                var language = message.language;
                console.log("chat21 language", language);
            
                var sourcePage;
                var client;
                var userEmail;
                var userFullname;
                var projectid;
            
            
                if (message.attributes) {
            
                  projectid = message.attributes.projectId;
                  console.log("chat21 projectid", projectid);
            
                  departmentid = message.attributes.departmentId;
                  console.log("chat21 departmentid", departmentid);
            
                  sourcePage = message.attributes.sourcePage;
                  console.log("chat21 sourcePage", sourcePage);
                  
                  client = message.attributes.client;
                  console.log("chat21 client", client);
              
                
            
                  userEmail = message.attributes.userEmail;
                  console.log("chat21 userEmail", userEmail);
            
                  userFullname = message.attributes.userFullname;
                  console.log("chat21 userFullname", userFullname);
                }
                
            
                
            
                if (!projectid) {
                  console.log("projectid is null. Not a support message");
                  return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
                }
                if (!message.recipient.startsWith("support-group")) {
                  console.log("recipient not starts wiht support-group. Not a support message");
                  return res.status(400).send({success: false, msg: "recipient not starts wiht support-group. Not a support message"});
                }
            
              
                if (!userFullname) {
                  userFullname = message.sender_fullname;
                }
              
                  // console.log("userEmail is defined");
                                    // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy)
                  return leadService.createIfNotExistsWithLeadId(message.sender, userFullname, userEmail, projectid)
                  .then(function(createdLead) {
                    // createWithId(request_id, requester_id, id_project, first_text, departmentid='default', sourcePage, language, userAgent, status) {
                      return requestService.createWithId(message.recipient, createdLead._id, projectid, message.text, departmentid, sourcePage, language, client).then(function (savedRequest) {
                        // create(sender, senderFullname, recipient, text, id_project, createdBy) {
                        return messageService.create(message.sender, message.sender_fullname, message.recipient, message.text,
                          projectid).then(function(savedMessage){
                                      // console.log("savedMessageXXX ");
                                      //get projectid from savedMessage.id_project
                            return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {
                              return res.json(savedRequestWithIncrement);
                            });
                          
                        
                      }).catch(function (err) {
                        console.log( 'Error creating the request object.', err);
                        return res.status(500).send({success: false, msg: 'Error creating the request object.', err:err});
                      });
                  });
                });
                  
            
              


          } else {

        

            console.log("request  exists", request);

            // var projectid;
            // if (message.attributes) {
        
            //   projectid = message.attributes.projectId;
            //   console.log("chat21 projectid", projectid);
            // }
        
            // if (!projectid) {
            //   console.log("projectid is null. Not a support message");
            //   return res.status(400).send({success: false, msg: 'projectid is null. Not a support message'});
            // }
            
            if (!message.recipient.startsWith("support-group")) {
              console.log("recipient not starts wiht support-group. Not a support message");
              return res.status(400).send({success: false, msg: "recipient not starts wiht support-group. Not a support message"});
            }
        
                            // create(sender, senderFullname, recipient, recipientFullname, text, id_project, createdBy) {
                return messageService.create(message.sender, message.sender_fullname, message.recipient, message.text,
                  request.id_project).then(function(savedMessage){
                    return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                      // console.log("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                       
                      if (savedRequest.participants && savedRequest.participants.indexOf(message.sender) > -1) { //update waiitng time if write an  agent (member of participants)
                        console.log("updateWaitingTimeByRequestId");
                        return requestService.updateWaitingTimeByRequestId(request.request_id, request.id_project).then(function(upRequest) {
                          return res.json(upRequest);
                        });
                      }else {
                        return res.json(savedRequest);
                      }
                    });
                  }).catch(function(err){
                    console.error("Error creating message", err);
                    return res.status(500).send({success: false, msg: 'Error creating message', err:err });
                  });



          }
        


        });

 
   
      
      // curl -X POST -H 'Content-Type:application/json'  -d '{ "event_type": "deleted-conversation", "createdAt": 1537973334802, "app_id": "tilechat", "user_id": "system", "recipient_id": "support-group-LNPQ57JnotOEEwDXr9b"}' http://localhost:3000/chat21/requests

    } else if (req.body.event_type == "deleted-conversation") {
      console.log("event_type","deleted-conversation");

      var conversation = req.body.data;
      console.log("conversation",conversation);

      var user_id = req.body.user_id;
      console.log("user_id",user_id);

      var recipient_id = req.body.recipient_id;
      console.log("recipient_id",recipient_id);

 
      if (!recipient_id.startsWith("support-group")){
        console.log("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        console.log("not a system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }


      var conversationRef = firestore.collection('conversations').doc(recipient_id);
      return conversationRef.get()
          .then(doc => {
            if (!doc.exists) {
              console.log('No such document!');
            } else {
              var firestoreConversation =  doc.data();
              console.log('firestoreConversation',firestoreConversation);

              var firestoreSupportStatus = firestoreConversation.support_status;
              console.log('firestoreSupportStatus', firestoreSupportStatus);

              var firestoreMembers = firestoreConversation.members;
              console.log('firestoreMembers', firestoreMembers);

              var firestoreMembersAsArray = Object.keys(firestoreMembers);

              //remove system and requester_id
              var systemIndex = firestoreMembersAsArray.indexOf("system");      
              if (systemIndex > -1) {
                firestoreMembersAsArray.splice(systemIndex, 1);
              }     


                 //TODO get project_id  from the conversation 
              // SSDS firestoreProjectid is NOT unique
              //TODO READ PROJECTID FROM CONVESATION
              var firestoreProjectid = firestoreConversation.projectid;
              console.log('firestoreProjectid', firestoreProjectid);
              


              var query = {request_id: recipient_id, id_project: firestoreProjectid};
              return Request.findOne(query, function(err, request) {

                if (err) {
                  console.error("Error finding request with query ", query);
                  return res.status(500).send({success: false, msg: "Error finding request with query " + query, err:err });
                }
                if (!request) {
                  return res.status(404).send({success: false, msg: "Request with query " + JSON.stringify(query) + " not found" });
                }
              
                


                  //TODO remove requester id from participants                 
                  
                  return Lead.findById(request.requester_id, function(err, lead){
                    console.log("lead",lead);
                    console.log("request",request);
                    if (lead && firestoreMembersAsArray.indexOf(lead.lead_id)>-1) {
                      var requesterLeadIdIndex = firestoreMembersAsArray.indexOf(lead.lead_id);      
                      if (requesterLeadIdIndex > -1) {
                        firestoreMembersAsArray.splice(requesterLeadIdIndex, 1);
                      }
                    }


                    console.log('firestoreMembersAsArray', firestoreMembersAsArray);

              
                    return requestService.setParticipantsByRequestId(recipient_id, firestoreProjectid, firestoreMembersAsArray).then(function(updatedParticipantsRequest) {
                      // console.log('updatedParticipantsRequest', updatedParticipantsRequest);
                      // manca id
                      return requestService.closeRequestByRequestId(recipient_id, firestoreProjectid).then(function(updatedStatusRequest) {
                        console.log('updatedStatusRequest', updatedStatusRequest);
                        return res.json(updatedStatusRequest);
                      });
                    }).catch(function(err){
                      console.error("Error closing request", err);
                      return res.status(500).send({success: false, msg: 'Error closing request', err:err });
                    });



                  });
            });


             

            }
          })
          .catch(err => {
            console.log('Error getting document', err);
          });





      

    }else if (req.body.event_type == "join-member") {
      console.log("event_type","join-member");

      console.log("req.body", JSON.stringify(req.body));

      var data = req.body.data;
      //console.log("data",data);

      var group = data.group;
      // console.log("group",group);

      var new_member = req.body.member_id;
      console.log("new_member",new_member);

      if (new_member=="system") {
        console.warn("new_member "+ new_member+ " not added to participants");
        return res.status(400).send({success: false, msg: "new_member "+ new_member+ " not added to participants" });
      }

      var request_id = req.body.group_id;
      console.log("request_id", request_id);

      var id_project;
      if (group && group.attributes) {
        id_project = group.attributes.projectId;
      }else {
        console.error("id_project "+ id_project+ "isn't a support joining");
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      console.log("id_project", id_project);

      return Request.findOne({request_id: request_id, id_project: id_project}, function(err, request) {
        if (err){
          console.error(err);
           return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
        }
        if (!request) {
          return res.status(404).send({success: false, msg: 'Request not found for request_id '+ request_id + ' and id_project '+ id_project});
        }

        return Lead.findOne({lead_id: new_member, id_project: id_project}, function(err, lead){
          console.log("lead",lead);
          console.log("request",request);
          if (lead && lead._id.toString() == request.requester_id.toString()) {
            console.log("don't  joining requester_id or a lead");
            return res.status(400).send({success: false, msg: "don't  joining requester_id or a lead" });
          }else {
            return requestService.addParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
              console.error("Join memeber ok");
              return res.json(updatedRequest);
            }).catch(function(err){
              console.error("Error joining memeber", err);
              return res.status(500).send({success: false, msg: 'Error joining memeber', err:err });
            });
          }
         


        });

       
    });


  }else if (req.body.event_type == "leave-member") {
    console.log("event_type","leave-member");
    
    console.log("req.body", JSON.stringify(req.body));


    var data = req.body.data;
    // console.log("data",data);

    var group = data.group;
    console.log("group",group);

    var new_member = req.body.member_id;
    console.log("new_member",new_member);

    var request_id = req.body.group_id;
    console.log("request_id", request_id);


    var id_project;
      if (group && group.attributes) {
        id_project = group.attributes.projectId;
      }else {
        return res.status(400).send({success: false, msg: "not a support joining" });
      }
      console.log("id_project", id_project);

    return requestService.removeParticipantByRequestId(request_id, id_project, new_member).then(function(updatedRequest) {
      console.error("Leave memeber ok");
      return res.json(updatedRequest);
    }).catch(function(err){
      console.error("Error leaving memeber", err);
      return res.status(500).send({success: false, msg: 'Error leaving memeber', err:err });
    });
  }
  
  else if (req.body.event_type == "deleted-archivedconversation") {

      console.log("event_type","deleted-archivedconversation");

      console.log("req.body",req.body);


      var conversation = req.body.data;
      // console.log("conversation",conversation);

      var user_id = req.body.user_id;
      console.log("user_id",user_id);

      var recipient_id = req.body.recipient_id;
      console.log("recipient_id",recipient_id);

     


      if (!recipient_id.startsWith("support-group")){
        console.log("not a support conversation");
        return res.status(400).send({success: false, msg: "not a support conversation" });
      }

      if (user_id!="system"){
        console.log("not a system conversation");
        return res.status(400).send({success: false, msg: "not a system conversation" });
      }


      var id_project;
      if (conversation && conversation.attributes) {
        id_project = conversation.attributes.projectId;
      }else {
        return res.status(400).send({success: false, msg: "not a support deleting archived conversation" });
      }
      console.log("id_project", id_project);


      return requestService.reopenRequestByRequestId(recipient_id, id_project).then(function(updatedRequest) {
        return res.json(updatedRequest);
      }).catch(function(err){
        console.error("Error reopening request", err);
        return res.status(500).send({success: false, msg: 'Error reopening request', err:err });
      });


}

    else {
      res.json("Not implemented");
    }

  

});













module.exports = router;
