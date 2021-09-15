'use strict';

var emailService = require("../../services/emailService");
var Project = require("../../models/project");
var Request = require("../../models/request");
var RequestConstants = require("../../models/requestConstants");
var Project_user = require("../../models/project_user");

var User = require("../../models/user");
var Lead = require("../../models/lead");
var Message = require("../../models/message");
const requestEvent = require('../../event/requestEvent');
var winston = require('../../config/winston');
var RoleConstants = require("../../models/roleConstants");
var cacheUtil = require('../../utils/cacheUtil');

const messageEvent = require('../../event/messageEvent');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
var config = require('../../config/database');

var widgetConfig = require('../../config/widget');
var widgetTestLocation = process.env.WIDGET_TEST_LOCATION || widgetConfig.testLocation;
let configSecret = process.env.GLOBAL_SECRET || config.secret;

class RequestNotification {


listen() {
    var that = this;
    


    var messageCreateKey = 'message.create';
    if (messageEvent.queueEnabled) {
      messageCreateKey = 'message.create.queue';
    }
    winston.info('RequestNotification messageCreateKey: ' + messageCreateKey);


    messageEvent.on(messageCreateKey, function(message) {

      setImmediate(() => {      
        winston.debug("sendUserEmail", message);
       
    
        
      });
     });

     var requestCreateKey = 'request.create';
     if (requestEvent.queueEnabled) {
       requestCreateKey = 'request.create.queue';
     }
     winston.info('RequestNotification requestCreateKey: ' + requestCreateKey);

     requestEvent.on(requestCreateKey, function(request) {
      // winston.info('quiiiiiiiiiiiii');
      setImmediate(() => {
   
        /*
        if (request && (request.channel.name===ChannelConstants.EMAIL || request.channel.name===ChannelConstants.FORM )) {
          winston.verbose("sending sendEmailChannelTakingNotification for EMAIL or FORM channel");
         that.sendEmailChannelTakingNotification(request.id_project, request)
        } 
        */
        
        that.sendAgentEmail(request.id_project, request);
        
      });
     });


     var requestParticipantsUpdateKey = 'request.participants.update';
    //  this is not queued
    //  if (requestEvent.queueEnabled) {
    //   requestParticipantsUpdateKey = 'request.participants.update.queue';
    //  }
     winston.info('RequestNotification requestParticipantsUpdateKey: ' + requestParticipantsUpdateKey);

     requestEvent.on(requestParticipantsUpdateKey, function(data) {

      winston.debug("requestEvent request.participants.update");

      var request = data.request;
      
      setImmediate(() => {
   
         that.sendAgentEmail(request.id_project, request);
      });
     });

    //  requestEvent.on("request.update.preflight", function(request) {
      
    //   winston.info("requestEvent request.update.preflight");

    //   setImmediate(() => {
   
    //      that.sendAgentEmail(request.id_project, request);
    //   });
    //  });


     

    //  TODO Send email also for addAgent and reassign. Alessio request for pooled only?

    var requestCloseExtendedKey = 'request.close.extended';
        //  this is not queued
    // if (requestEvent.queueEnabled) {
    //   requestCloseExtendedKey = 'request.close.extended.queue';
    // }
    winston.info('RequestNotification requestCloseExtendedKey: ' + requestCloseExtendedKey);
    requestEvent.on(requestCloseExtendedKey, function(data) {
      setImmediate(() => {
        var request = data.request;
        var notify = data.notify;
        if (notify==false) {
          winston.debug("sendTranscriptByEmail notify disabled", request);
          return;
        }
        var id_project = request.id_project;
        var request_id  = request.request_id;
 
        try {                
          Project.findOne({_id: id_project, status: 100}, function(err, project){   
            winston.debug("sendTranscriptByEmail", project);

            if (project && project.settings && project.settings.email && 
              project.settings.email.autoSendTranscriptToRequester &&  
              project.settings.email.autoSendTranscriptToRequester === true && 
              project.profile && 
              (
                (project.profile.type === 'free' && project.trialExpired === false) || 
                (project.profile.type === 'payment' && project.isActiveSubscription === true)
              )
            ) 
              {

              //send email to admin
              Project_user.find({ id_project: id_project,  role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN]}, status: "active"} ).populate('id_user')
              .exec(function (err, project_users) {

                if (project_users && project_users.length>0) {
                  project_users.forEach(project_user => {
                    if (project_user.id_user && project_user.id_user.email) {
                      return that.sendTranscriptByEmail(project_user.id_user.email, request_id, id_project);                              
                    } else {
                    }
                  });  
                }                      

              });
              //end send email to admin

              //send email to lead
              return Lead.findById(request.requester_id, function(err, lead){
                //if (lead && lead.email) {
                  if (lead && lead.email) {
                    return that.sendTranscriptByEmail(lead.email, request_id, id_project);
                  }
                  
              });
              //end send email to lead

            } else {
              winston.verbose("sendTranscriptByEmail disabled for project with id: "+ id_project);
            }
          });
        }catch(e) {
          winston.error("error sendTranscriptByEmail ", e);
        }

      });
  });
}



sendUserEmail(projectid, message) {
  try {

    if (!message.request) {
      return winston.debug("This is a direct message");
    }

    if (!message.request.lead || !message.request.lead.email) {
      return winston.debug("The lead object is undefined or has empty email");
    }

    Project.findOne({_id: projectid, status: 100}, function(err, project){
      if (err) {
        return winston.error(err);
      }
  
      if (!project) {
       //  console.warn("Project not found", req.projectid);
       return console.warn("Project not found", projectid);
      } 

      if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.blocked == true ) {
        return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for  the conversations is blocked");
      }
  

      if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.enabled == false ) {
        return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for the offline conversation is disabled");
      }



        var recipient = message.request.lead.lead_id;
        winston.debug("recipient:"+ recipient);

        var isObjectId = mongoose.Types.ObjectId.isValid(recipient);
        winston.debug("isObjectId:"+ isObjectId);

        var queryProjectUser ={ id_project: projectid, status: "active"};

        
        if (isObjectId) {          
          queryProjectUser.id_user = recipient
        }else {
          queryProjectUser.uuid_user = recipient
        }
        winston.debug("queryProjectUser", queryProjectUser);

        
        Project_user.findOne( queryProjectUser)
        .exec(function (err, project_user) {

          winston.debug("project_user", project_user);

          if (!project_user) {
            return winston.warn("Project_user not found with query ", queryProjectUser);
          }
         
          if (!project_user.presence || (project_user.presence && project_user.presence.status === "offline")) {

             //send email to lead
            return Lead.findOne({lead_id: recipient}, function(err, lead){
              winston.debug("lead", lead);
              if (lead && lead.email) {
                  winston.info("sending user email to  "+ lead.email);

                  var signOptions = {
                    issuer:  'https://tiledesk.com',
                    subject:  'guest',
                    audience:  'https://tiledesk.com',
                    jwtid: uuidv4()        
                  };

                  let userAnonym = {_id: recipient, firstname: lead.fullname, lastname: lead.fullname, email: lead.email, attributes: lead.attributes};
                  winston.info("userAnonym  ",userAnonym);

        
                  var token = jwt.sign(userAnonym, configSecret, signOptions);
                  winston.info("token  "+token);

                  var sourcePage = widgetTestLocation;


                  if (message.request.sourcePage) {
                    sourcePage = message.request.sourcePage;
                  }
                  
                  winston.info("sourcePage  "+sourcePage);

                  var tokenQueryString;
                  if(sourcePage && sourcePage.indexOf('?')>-1) {
                    tokenQueryString =  "&tiledesk_customToken=JWT "+token
                  }else {
                    tokenQueryString =  "?tiledesk_customToken=JWT "+token
                  }

                  emailService.sendNewMessageNotification(lead.email, message, project, tokenQueryString);
              } 
                
            });

          }

        });       


    });

  } catch(e) {
    winston.error("Error sending email", {error:e, projectid:projectid, message:message});
  }
}


sendAgentEmail(projectid, savedRequest) {
  //  console.log("savedRequest23", savedRequest);
    // send email
    try {
   
   
    Project.findOne({_id: projectid, status: 100}, async function(err, project){
       if (err) {
         return winston.error(err);
       }
   
       if (!project) {
        //  console.warn("Project not found", req.projectid);
        return console.warn("Project not found", projectid);
       } else {
         
          winston.debug("project", project);            

          if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.blocked == true ) {
            return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for all the conversations is blocked");
          }

          winston.debug("savedRequest", savedRequest);

              // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                 if (savedRequest.status==RequestConstants.UNASSIGNED) { //POOLED

                  if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.pooled == false ) {
                    return winston.info("RequestNotification email notification for the project with id : " + projectid + " for the pooled conversation is disabled");
                  }
                  if (!savedRequest.snapshot) {
                    return winston.warn("RequestNotification savedRequest.snapshot is null :(. You are closing an old request?");
                  }

                  var snapshotAgents = await Request.findById(savedRequest.id).select({"snapshot":1}).exec();
                  winston.info('snapshotAgents',snapshotAgents);                              


                  // winston.info("savedRequest.snapshot.agents", savedRequest.snapshot.agents);
                  // agents è selected false quindi nn va sicuro
                  if (!snapshotAgents.snapshot.agents) {
                    return winston.warn("RequestNotification snapshotAgents.snapshot.agents is null :(. You are closing an old request?", savedRequest);
                  }
                  
                  //  var allAgents = savedRequest.agents;
                   var allAgents = snapshotAgents.snapshot.agents;
            
                  // //  var allAgents = savedRequest.agents;
                  //  var allAgents = savedRequest.snapshot.agents;
                  // // winston.debug("allAgents", allAgents);
   
                  allAgents.forEach(project_user => {
                  //  winston.debug("project_user", project_user); //DON'T UNCOMMENT THIS. OTHERWISE this.agents.filter of models/request.js:availableAgentsCount has .filter not found.
   

                  var userid = project_user.id_user;
                  
                   if (project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.pooled == false ) {
                     return winston.verbose("RequestNotification email notification for the user with id " +  userid+ " the pooled conversation is disabled");
                   }                  
                    
                     User.findOne({_id: userid , status: 100})
                      .cache(cacheUtil.defaultTTL, "users:id:"+userid)
                      .exec(function (err, user) {
                       if (err) {
                       //  winston.debug(err);
                       }
                       if (!user) {
                        winston.warn("User not found", userid);
                       } else {
                         winston.debug("Sending sendNewPooledRequestNotification to user with email: "+ user.email);
                         if (user.emailverified) {
                           emailService.sendNewPooledRequestNotification(user.email, savedRequest, project);
                         }else {
                           winston.verbose("User email not verified", user.email);
                         }
                       }
                     });
   
                     
                   });
   
                   }

                   // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                   else if (savedRequest.status==RequestConstants.ASSIGNED) { //ASSIGNED

                    if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.assigned == false ) {
                      return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for the assigned conversation is disabled");
                    }


                    var assignedId = savedRequest.participants[0];

                    //  winston.info("assignedId1:"+ assignedId);

                    //  if (!assignedId) {
                    //    console.log("attention90", savedRequest);
                    //  }


                    
                    Project_user.findOne( { id_user:assignedId, id_project: projectid, status: "active"}) 
                    .exec(function (err, project_user) {
                      
                        winston.debug("project_user notification", project_user);
                        if (project_user && project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.assigned &&  project_user.settings.email.notification.conversation.assigned.toyou == false ) {
                          return winston.info("RequestNotification email notification for the user with id : " + assignedId + " for the pooled conversation is disabled");
                        }

                        // botprefix
                        if (assignedId.startsWith("bot_")) {
                          return ;
                        }
      
                        User.findOne({_id: assignedId, status: 100})
                          .cache(cacheUtil.defaultTTL, "users:id:"+assignedId)
                          .exec(function (err, user) {
                          if (err) {
                            winston.error("Error sending email to " + savedRequest.participants[0], err);
                          }
                          if (!user) {
                            console.warn("User not found",  savedRequest.participants[0]);
                          } else {
                            winston.debug("Sending sendNewAssignedRequestNotification to user with email", user.email);
                            //  if (user.emailverified) {    enable it?     send anyway to improve engagment for new account                
                              emailService.sendNewAssignedRequestNotification(user.email, savedRequest, project);
                            //  }
                          }
                        });

                      });

                   }



                   else {
                    return winston.debug("Other states");
                   }
   
   
         
         }
   
   });
   
   } catch (e) {
     winston.warn("Error sending email", {error:e, projectid:projectid, savedRequest:savedRequest}); //it's better to view error email at this stage
   }
   //end send email
   
   }






   sendTranscriptByEmail(sendTo, request_id, id_project) {
    return new Promise(function (resolve, reject) {
      return Request.findOne({request_id: request_id, id_project: id_project})
      .populate('department')
      // .cache(cacheUtil.defaultTTL, "/"+id_project+"/requests/request_id/populate/department/"+request_id)
      .exec(function(err, request) { 
      if (err){
        winston.error(err);
        return reject(err);
      }
      if (!request) {
        winston.error("Request not found for request_id "+ request_id + " and id_project " + id_project);
        return reject("Request not found for request_id "+ request_id  + " and id_project " + id_project);
      }
      


      return Message.find({"recipient": request_id, id_project : id_project})
        .sort({createdAt: 'asc'})
        .exec(function(err, messages) { 
        if (err) {
          return res.status(500).send({success: false, msg: 'Error getting messages.'});
        }

        if(!messages){
          return reject(err);
        }

      

        emailService.sendRequestTranscript(sendTo, messages, request);
        winston.debug("sendTranscriptByEmail sent");
        return resolve({sendTo: sendTo, messages: messages, request: request});

      
      });

      });
    });
  }
   
   
}
 
 
 
 
var requestNotification = new RequestNotification();


module.exports = requestNotification;
 