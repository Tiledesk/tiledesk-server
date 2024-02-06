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
var ChannelConstants = require("../../models/channelConstants");
var cacheUtil = require('../../utils/cacheUtil');

const messageEvent = require('../../event/messageEvent');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
var config = require('../../config/database');
var configGlobal = require('../../config/global');

var widgetConfig = require('../../config/widget');
var widgetTestLocation = process.env.WIDGET_LOCATION || widgetConfig.testLocation;
widgetTestLocation = widgetTestLocation + "assets/twp/index.html";



let configSecret = process.env.GLOBAL_SECRET || config.secret;

var pKey = process.env.GLOBAL_SECRET_OR_PRIVATE_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecret = pKey.replace(/\\n/g, '\n');
}

let apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.debug('********* RequestNotification apiUrl: ' + apiUrl);

class RequestNotification {

  constructor() {
    this.enabled = true;
    if (process.env.EMAIL_NOTIFICATION_ENABLED=="false" || process.env.EMAIL_NOTIFICATION_ENABLED==false) {
        this.enabled = false;
    }
    winston.debug("RequestNotification this.enabled: "+ this.enabled);
}

listen() {

  winston.debug("RequestNotification listen");
    var that = this; 
    

      
    if (this.enabled==true) {
      winston.info("RequestNotification listener started");
    } else {
        return winston.info("RequestNotification listener disabled");
    }


    var messageCreateKey = 'message.create';
    if (messageEvent.queueEnabled) {
      messageCreateKey = 'message.create.queue';
    }
    winston.debug('RequestNotification messageCreateKey: ' + messageCreateKey);


    messageEvent.on(messageCreateKey, function(message) {

      setImmediate(() => {      
        winston.debug("messageEvent.on(messageCreateKey", message);
        
        if (message.attributes && message.attributes.subtype==='info') {
          return winston.debug("not sending sendUserEmail for attributes.subtype info messages");
        }


        if (message.request && (message.request.channel.name===ChannelConstants.EMAIL || message.request.channel.name===ChannelConstants.FORM)) {

          //messages sent from admins or agents to requester
          if (message.sender != message.request.lead.lead_id) {
            winston.debug("sending sendToUserEmailChannelEmail for EMAIL or FORM channel");
             
            //send email notification to requester (send also to followers)
            return that.sendToUserEmailChannelEmail(message.id_project, message);        
          } else { //messages sent from requester to agents or admins

            if (message.text != message.request.first_text) {              
              winston.debug("sending sendToAgentEmailChannelEmail for EMAIL or FORM channel");

              //send email notification to admins and agents(send also to followers)
              return that.sendToAgentEmailChannelEmail(message.id_project, message);           
            } else {
              winston.debug("sending sendToAgentEmailChannelEmail for EMAIL or FORM channel disabled for first text message")
            }
            
          }
          
        } else {
          winston.debug("sendUserEmail chat channel");
                       
            //TODO     mandare email se ultimo messaggio > X MINUTI configurato in Notification . potresti usare request.updated_at ?

            
            
            //messages sent from admins or agents
            //send email notification to requester
          if (message.request && message.request.lead && message.sender != message.request.lead.lead_id) {
            winston.debug("sendUserEmail");
            winston.debug("sendUserEmail", message);

            // send an email only if offline and has an email (send also to followers)
            return that.sendUserEmail(message.id_project, message);
          } else { //send email  to followers
            winston.debug("send direct email****");

            that.sendToFollower(message.id_project, message);

          }
          
        }
         
      
        
      });
     });

     var requestCreateKey = 'request.create';
     if (requestEvent.queueEnabled) {
       requestCreateKey = 'request.create.queue';
     }
     winston.debug('RequestNotification requestCreateKey: ' + requestCreateKey);

     requestEvent.on(requestCreateKey, function(request) {
      winston.debug('requestEvent.on(requestCreateKey');
      setImmediate(() => {
   
        /*
        if (request && (request.channel.name===ChannelConstants.EMAIL || request.channel.name===ChannelConstants.FORM )) {
          winston.debug("sending sendEmailChannelTakingNotification for EMAIL or FORM channel");
         that.sendEmailChannelTakingNotification(request.id_project, request)
        } 
        */
        
        that.sendAgentEmail(request.id_project, request);
        
      });
     });


     var requestParticipantsUpdateKey = 'request.participants.update';
     if (requestEvent.queueEnabled) {
      requestParticipantsUpdateKey = 'request.participants.update.queue';
     }
     winston.debug('RequestNotification requestParticipantsUpdateKey: ' + requestParticipantsUpdateKey);

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
    if (requestEvent.queueEnabled) {
      requestCloseExtendedKey = 'request.close.extended.queue';
    }
    winston.debug('RequestNotification requestCloseExtendedKey: ' + requestCloseExtendedKey);    //request.close event here queued under job
    requestEvent.on(requestCloseExtendedKey, function(data) {
      winston.debug('requestEvent.on(requestCloseExtendedKey ' + requestCloseExtendedKey);
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
              project.settings.email.autoSendTranscriptToRequester === true 
              && 
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
                      return that.sendTranscriptByEmail(project_user.id_user.email, request_id, id_project, project);                              
                    } else {
                    }
                  });  
                }                      

              });
              //end send email to admin
              winston.debug('Lead.findById ');
              //send email to lead
              return Lead.findById(request.requester_id, function(err, lead){
                //if (lead && lead.email) {
                  if (lead && lead.email) {
                    return that.sendTranscriptByEmail(lead.email, request_id, id_project, project);
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


sendToUserEmailChannelEmail(projectid, message) {
  winston.debug("sendToUserEmailChannelEmail");
  var that = this;
  try {

    if (!message.request) {
      return winston.debug("This is a direct message");
    }


    


    

    Project.findOne({_id: projectid, status: 100}).select("+settings").exec(function(err, project){
      if (err) {
        return winston.error(err);
      }
  
      if (!project) {
       return winston.warn("Project not found", projectid);
      } 
      

      // if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.blocked == true ) {
      //   return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for  the conversations is blocked");
      // }
  

      // if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.enabled == false ) {
      //   return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for the offline conversation is disabled");
      // }

      let lead = message.request.lead;
      winston.debug("sending channel email to lead ", lead);

      
      winston.debug("sending user email to  "+ lead.email);

      var signOptions = {
        issuer:  'https://tiledesk.com',
        subject:  'userexternal',
        audience:  'https://tiledesk.com',
        jwtid: uuidv4()
      };

      var alg = process.env.GLOBAL_SECRET_ALGORITHM;
      if (alg) {
        signOptions.algorithm = alg;
      }


      var recipient = lead.lead_id;
      winston.debug("recipient:"+ recipient);

      let userEmail = {_id: recipient, firstname: lead.fullname, lastname: lead.fullname, email: lead.email, attributes: lead.attributes};
      winston.debug("userEmail  ",userEmail);


      var token = jwt.sign(userEmail, configSecret, signOptions); //priv_jwt pp_jwt
      winston.debug("token  "+token);

      var sourcePage = widgetTestLocation + "?tiledesk_projectid=" 
                  + projectid + "&project_name="+encodeURIComponent(project.name)                   

      if (message.request.sourcePage) {
        sourcePage = message.request.sourcePage;                    
      }
      
      if (sourcePage.indexOf("?")===-1) {
        sourcePage = sourcePage + "?";                   
      }

      sourcePage = sourcePage  
                  + "&tiledesk_recipientId="+message.request.request_id 
                  + "&tiledesk_isOpen=true";
      
                
      sourcePage = apiUrl + "/urls/redirect?path=" + encodeURIComponent(sourcePage)
      winston.debug("sourcePage  "+sourcePage);


      var tokenQueryString;      
      if(sourcePage && sourcePage.indexOf('?')>-1) {  //controllo superfluo visto che lo metto prima? ma lascio comunque per indipendenza
        tokenQueryString =  encodeURIComponent("&tiledesk_jwt=JWT "+token)
      }else {
        tokenQueryString =  encodeURIComponent("?tiledesk_jwt=JWT "+token);
      }
      winston.debug("tokenQueryString:  "+tokenQueryString);
      


       // winston.info("savedRequest.followers", savedRequest.followers);
      // winston.info("savedRequest.followers.length:"+ savedRequest.followers.length);
      that.notifyFollowers(message.request, project, message);


      if (message.attributes && message.attributes.subtype==='private') {
        return winston.debug("not sending sendToUserEmailChannelEmail for attributes.subtype private messages");
      }           

      // nn va bene qui
      if (!message.request.lead || !message.request.lead.email) {
        return winston.debug("The lead object is undefined or has empty email");
      }

      emailService.sendEmailChannelNotification(message.request.lead.email, message, project, tokenQueryString, sourcePage);


    });

  } catch(e) {
    winston.error("Error sending requestNotification email", {error:e, projectid:projectid, message:message});
  }
}


async notifyFollowers(savedRequest, project, message) {

  if (message.attributes && message.attributes.subtype==='info/support') {
    return winston.debug("not sending notifyFollowers for attributes.subtype info/support messages");
  }     

  if (message.attributes && message.attributes.subtype==='info') {
    return winston.debug("not sending notifyFollowers for attributes.subtype info messages");
  }

  if (!savedRequest) {
    return winston.debug("not sending notifyFollowers for direct messages");
  }

  // Cannot read property '_id' of undefined at RequestNotification.notifyFollowers (/usr/src/app/pubmodules/emailNotification/requestNotification.js:358:62) at /usr/src/app
  // forse meglio .id
  
  var reqWithFollowers = await Request.findById(savedRequest._id).populate('followers').exec();  // cache_attention
  winston.debug("reqWithFollowers");
  winston.debug("reqWithFollowers",reqWithFollowers);
  // console.log("reqWithFollowers",reqWithFollowers);

  if (reqWithFollowers.followers && reqWithFollowers.followers.length>0) {

    winston.debug("reqWithFollowers.followers.length: "+reqWithFollowers.followers.length);

    reqWithFollowers.followers.forEach(project_user => {
       winston.debug("project_user", project_user); 
        //TODO skip participants from followers

      var userid = project_user.id_user;
      
       if (project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.ticket && project_user.settings.email.notification.conversation.ticket.follower == false ) {
         return winston.verbose("RequestNotification email notification for the user with id " +  userid+ " the follower conversation ticket is disabled");
       }                  
        
         User.findOne({_id: userid , status: 100})
          //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+userid)  //user_cache
          .exec(function (err, user) {
           if (err) {
           //  winston.debug(err);
           }
           if (!user) {
            winston.warn("User not found", userid);
           } else {
             winston.info("Sending notifyFollowers to user with email: "+ user.email);
             if (user.emailverified) {
              emailService.sendFollowerNotification(user.email, message, project);
              // emailService.sendEmailChannelNotification(user.email, message, project);
              
              // emailService.sendNewAssignedAgentMessageEmailNotification(user.email, savedRequest, project, message);

             }else {
               winston.info("User email not verified", user.email);
             }
           }
         });

         
       });


  }
}

sendToFollower(projectid, message) {
  winston.debug("sendToFollower");            
  var that = this;
    let savedRequest = message.request;
      // send email
      try {
     
     
      Project.findOne({_id: projectid, status: 100}).select("+settings").exec(async function(err, project){
         if (err) {
           return winston.error(err);
         }
     
         if (!project) {
          return winston.warn("Project not found", projectid);
         } else {
           
            winston.debug("project", project);            
  
            // if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.blocked == true ) {
            //   return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for all the conversations is blocked");
            // }
  
            winston.debug("savedRequest", savedRequest);



            // winston.info("savedRequest.followers", savedRequest.followers);
            // winston.info("savedRequest.followers.length:"+ savedRequest.followers.length);
            that.notifyFollowers(message.request, project, message);


          }
        })
    } catch (e) {
      winston.warn("Error sending requestNotification email", {error:e, projectid:projectid, message: message, savedRequest:savedRequest}); //it's better to view error email at this stage
    }
}

sendToAgentEmailChannelEmail(projectid, message) {
  var that = this;
    let savedRequest = message.request;
      // send email
      try {
     
     
      Project.findOne({_id: projectid, status: 100}).select("+settings").exec(async function(err, project){
         if (err) {
           return winston.error(err);
         }
     
         if (!project) {
          return winston.warn("Project not found", projectid);
         } else {
           
            winston.debug("project", project);            
  
            if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.blocked == true ) {
              return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for all the conversations is blocked");
            }
  
            winston.debug("savedRequest", savedRequest);



            // winston.info("savedRequest.followers", savedRequest.followers);
            // winston.info("savedRequest.followers.length:"+ savedRequest.followers.length);
            that.notifyFollowers(message.request, project, message);


  
    //         UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'status' of undefined
    // at /Users/andrealeo/dev/chat21/ti

                // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                   if (savedRequest.status==RequestConstants.UNASSIGNED) { //POOLED
  
                    if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.ticket && project.settings.email.notification.conversation.ticket.pooled == false ) {
                      return winston.info("RequestNotification email notification for the project with id : " + projectid + " for the pooled conversation ticket is disabled");
                    }
                    
                    if (!savedRequest.snapshot) {
                      return winston.warn("RequestNotification savedRequest.snapshot is null :(. You are closing an old request?");
                    }



                    
                    var snapshotAgents = await Request.findById(savedRequest.id).select({"snapshot":1}).exec();

                    winston.debug('snapshotAgents',snapshotAgents);                              


                    // winston.info("savedRequest.snapshot.agents", savedRequest.snapshot.agents);
                    // agents è selected false quindi nn va sicuro
                    if (!snapshotAgents.snapshot.agents) {
                      return winston.warn("RequestNotification snapshotAgents.snapshot.agents is null :(. You are closing an old request?", savedRequest);
                    }
                    
                    //  var allAgents = savedRequest.agents;
                     var allAgents = snapshotAgents.snapshot.agents;
                    // winston.debug("allAgents", allAgents);
     
                     allAgents.forEach(project_user => {
                    //  winston.debug("project_user", project_user); //DON'T UNCOMMENT THIS. OTHERWISE this.agents.filter of models/request.js:availableAgentsCount has .filter not found.
     
  
                    var userid = project_user.id_user;
                    
                     if (project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.ticket && project_user.settings.email.notification.conversation.ticket.pooled == false ) {
                       return winston.verbose("RequestNotification email notification for the user with id " +  userid+ " the pooled conversation ticket is disabled");
                     }                  
                      
                       User.findOne({_id: userid , status: 100})
                        //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+userid)   //user_cache
                        .exec(function (err, user) {
                         if (err) {
                         //  winston.debug(err);
                         }
                         if (!user) {
                          winston.warn("User not found", userid);
                         } else {
                           winston.debug("Sending sendNewPooledMessageNotification to user with email: "+ user.email);
                           if (user.emailverified) {
                             emailService.sendNewPooledMessageEmailNotification(user.email, savedRequest, project, message);
                           }else {
                             winston.verbose("User email not verified", user.email);
                           }
                         }
                       });
     
                       
                     });
     
                     }
  
                     // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                     else if (savedRequest.status==RequestConstants.ASSIGNED) { //ASSIGNED
  
                      if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.ticket && project.settings.email.notification.conversation.ticket.assigned == false ) {
                        return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for the assigned conversation ticket is disabled");
                      }
  
  
                      var assignedId = savedRequest.participants[0];
  
                      //  winston.info("assignedId1:"+ assignedId);
  
                      //  if (!assignedId) {
                      //    console.log("attention90", savedRequest);
                      //  }
  
  
                      
                      Project_user.findOne( { id_user:assignedId, id_project: projectid, status: "active"}) //attento in 2.1.14.2
                      .exec(function (err, project_user) {
                        
                          winston.debug("project_user notification", project_user);
                          if (project_user && project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.ticket && project_user.settings.email.notification.conversation.ticket.assigned &&  project_user.settings.email.notification.conversation.ticket.assigned.toyou == false ) {
                            return winston.info("RequestNotification email notification for the user with id : " + assignedId + " for the pooled conversation ticket is disabled");
                          }
  
                          // botprefix
                          if (assignedId.startsWith("bot_")) {
                            return ;
                          }
        
                          User.findOne({_id: assignedId, status: 100})
                            //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+assignedId)    //user_cache
                            .exec(function (err, user) {
                            if (err) {
                              winston.error("Error sending requestNotification email to " + savedRequest.participants[0], err);
                            }
                            if (!user) {
                              winston.warn("User not found",  savedRequest.participants[0]);
                            } else {
                              winston.verbose("Sending sendNewAssignedAgentMessageEmailNotification to user with email: "+ user.email);
                              //  if (user.emailverified) {    enable it?     send anyway to improve engagment for new account     
                              // attento cambia           
                                emailService.sendNewAssignedAgentMessageEmailNotification(user.email, savedRequest, project, message);
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
       winston.warn("Error sending requestNotification email", {error:e, projectid:projectid, message: message, savedRequest:savedRequest}); //it's better to view error email at this stage
     }
     //end send email
     
     }
  



//unused
sendEmailChannelTakingNotification(projectid, request) {
  try {


    if (!request.lead || !request.lead.email) {
      return winston.debug("The lead object is undefined or has empty email");
    }

    Project.findOne({_id: projectid, status: 100}).select("+settings").exec(function(err, project){
      if (err) {
        return winston.error(err);
      }
  
      if (!project) {
       return winston.warn("Project not found", projectid);
      } 

      // if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.blocked == true ) {
      //   return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for  the conversations is blocked");
      // }
  

      // if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.offline && project.settings.email.notification.conversation.offline.enabled == false ) {
      //   return winston.info("RequestNotification offline email notification for the project with id : " + projectid + " for the offline conversation is disabled");
      // }
    emailService.sendEmailChannelTakingNotification(request.lead.email, request, project);
  

    });

  } catch(e) {
    winston.error("Error sending requestNotification email", {error:e, projectid:projectid, message:message});
  }
}





sendUserEmail(projectid, message) {
  winston.debug("sendUserEmail");
  var that = this;

 
  try {

    if (!message.request) {
      return winston.debug("This is a direct message");
    }
   


    

    Project.findOne({_id: projectid, status: 100}).select("+settings").exec(function(err, project){
      if (err) {
        return winston.error(err);
      }
  
      if (!project) {
       return winston.warn("Project not found", projectid);
      } 

      winston.debug("notifyFollowers");
      that.notifyFollowers(message.request, project, message);



      if (process.env.DISABLE_SEND_OFFLINE_EMAIL === "true" || process.env.DISABLE_SEND_OFFLINE_EMAIL === true ) {
        return winston.debug("DISABLE_SEND_OFFLINE_EMAIL disabled");
      }
      if (message.attributes && message.attributes.subtype==='info/support') {
        return winston.debug("not sending sendUserEmail for attributes.subtype info/support messages");
      }     
    
      if (message.attributes && message.attributes.subtype==='info') {
        return winston.debug("not sending sendUserEmail for attributes.subtype info messages");
      }


      
      if (!message.request.lead || !message.request.lead.email) {
        return winston.debug("The lead object is undefined or has empty email");
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
              winston.debug("lead", lead);     //TODO  lead  is already present in request.lead
              if (lead && lead.email) {
                  winston.debug("sending user email to  "+ lead.email);

                  var signOptions = {
                    issuer:  'https://tiledesk.com',
                    subject:  'guest',
                    audience:  'https://tiledesk.com',
                    jwtid: uuidv4()
                  };

                  var alg = process.env.GLOBAL_SECRET_ALGORITHM;
                  if (alg) {
                    signOptions.algorithm = alg;
                  }

                  let userAnonym = {_id: recipient, firstname: lead.fullname, lastname: lead.fullname, email: lead.email, attributes: lead.attributes};
                  winston.debug("userAnonym  ",userAnonym);

        
                  var token = jwt.sign(userAnonym, configSecret, signOptions); //priv_jwt pp_jwt
                  winston.debug("token  "+token);

                  var sourcePage = widgetTestLocation + "?tiledesk_projectid=" 
                  + projectid + "&project_name="+encodeURIComponent(project.name)                   

                  if (message.request.sourcePage) {
                    sourcePage = message.request.sourcePage;                    
                  }
                  
                  if (sourcePage && sourcePage.indexOf("?")===-1) {
                    sourcePage = sourcePage + "?";                   
                  }

                  sourcePage = sourcePage  
                              + "&tiledesk_recipientId="+message.request.request_id 
                              + "&tiledesk_isOpen=true";

                  sourcePage = apiUrl + "/urls/redirect?path=" + encodeURIComponent(sourcePage)

                  winston.debug("sourcePage  "+sourcePage);

                  var tokenQueryString;
                  if(sourcePage && sourcePage.indexOf('?')>-1) {  //controllo superfluo visto che lo metto prima? ma lascio comunque per indipendenza
                    tokenQueryString =  encodeURIComponent("&tiledesk_jwt=JWT "+token)
                  }else {
                    tokenQueryString =  encodeURIComponent("?tiledesk_jwt=JWT "+token);
                  }
                  winston.debug("tokenQueryString:  "+tokenQueryString);
                  
                  //send email unverified so spam check?
                  emailService.sendNewMessageNotification(lead.email, message, project, tokenQueryString, sourcePage);
              } 
                
            });

          }

        });       


    });

  } catch(e) {
    winston.error("Error sending requestNotification email", {error:e, projectid:projectid, message:message});
  }
}

sendAgentEmail(projectid, savedRequest) {
    // send email
    try {
   
  //  console.log("sendAgentEmail")
    if (savedRequest.preflight === true) {   //only for channel email and form preflight is false otherwise request.participants.update is used i think?
      winston.debug("preflight request sendAgentEmail disabled")
      return 0;
    }

    Project.findOne({_id: projectid, status: 100}).select("+settings").exec( async function(err, project){
       if (err) {
         return winston.error(err);
       }
   
       if (!project) {
        return winston.warn("Project not found", projectid);
       } else {
         
          winston.debug("project", project);            

          if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.blocked == true ) {
            return winston.verbose("RequestNotification email notification for the project with id : " + projectid + " for all the conversations is blocked");
          }

          winston.debug("savedRequest: " + JSON.stringify(savedRequest));

              // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                 if (savedRequest.status==RequestConstants.UNASSIGNED) { //POOLED

                  winston.debug("savedRequest.status==RequestConstants.UNASSIGNED");        

                  if (project.settings && project.settings.email && project.settings.email.notification && project.settings.email.notification.conversation && project.settings.email.notification.conversation.pooled == false ) {
                    return winston.info("RequestNotification email notification for the project with id : " + projectid + " for the pooled conversation is disabled");
                  }
                  if (!savedRequest.snapshot) {
                    return winston.warn("RequestNotification savedRequest.snapshot is null :(. You are closing an old request?");
                  }


                 
                  var snapshotAgents = savedRequest; //riassegno varibile cosi nn cambio righe successive

                  


                  // winston.info("savedRequest.snapshot.agents", savedRequest.snapshot.agents);
                  // agents è selected false quindi nn va sicuro
                  if (!snapshotAgents.snapshot.agents) {
                    //return winston.warn("RequestNotification snapshotAgents.snapshot.agents is null :(. You are closing an old request?", savedRequest);

                  // agents già c'è in quanto viene creato con departmentService.getOperator nella request.create ma nn c'è per request.participants.update
                      snapshotAgents = await Request.findById(savedRequest.id).select({"snapshot":1}).exec();
                      winston.debug('load snapshotAgents with Request.findById ');                              
                  }
                  winston.debug('snapshotAgents', snapshotAgents);                              

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
                      //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+userid)    //user_cache
                      .exec(function (err, user) {
                       if (err) {
                       //  winston.debug(err);
                       }
                       if (!user) {
                        winston.warn("User not found", userid);
                       } else {
                         winston.verbose("Sending sendNewPooledRequestNotification to user with email: "+ user.email);
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

                    winston.debug("savedRequest.status==RequestConstants.ASSIGNED");        

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
                      
                      // botprefix
                      if (assignedId.startsWith("bot_")) {
                        return ;
                      }
                      
                       if (err) {
                        return winston.error("RequestNotification email notification error getting project_user", err);
                       }
                        winston.debug("project_user notification", project_user);
                        if (project_user && project_user.settings && project_user.settings.email && project_user.settings.email.notification && project_user.settings.email.notification.conversation && project_user.settings.email.notification.conversation.assigned &&  project_user.settings.email.notification.conversation.assigned.toyou == false ) {
                          return winston.info("RequestNotification email notification for the user with id : " + assignedId + " for the pooled conversation is disabled");
                        }

                        
      
                        if (!project_user) {
                          return winston.warn("RequestNotification email notification for the user with id : " + assignedId + " not found project_user");
                        }
                        User.findOne({_id: assignedId, status: 100})
                          //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+assignedId)    //user_cache
                          .exec(function (err, user) {
                          if (err) {
                            winston.error("Error sending requestNotification email to " + savedRequest.participants[0], err);
                          }
                          if (!user) {
                            winston.warn("User not found",  savedRequest.participants[0]);
                          } else {
                            winston.debug("Sending sendNewAssignedRequestNotification to user with email", user.email);
                            //  if (user.emailverified) {    enable it?     send anyway to improve engagment for new account    
                            
                            
                            // var signOptions = {
                            //   issuer:  'https://tiledesk.com',
                            //   subject:  'user',
                            //   audience:  'https://tiledesk.com',
                            //   jwtid: uuidv4()        
                            // };
          
                            // let userObject = {_id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, attributes: user.attributes};
                            // winston.debug("userObject  ",userObject);
          
                  
                            // var agentToken = jwt.sign(userObject, configSecret, signOptions);
                            // winston.debug("agentToken  "+agentToken);

                            


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
     winston.warn("Error sending requestNotification email", {error:e, projectid:projectid, savedRequest:savedRequest}); //it's better to view error email at this stage
   }
   //end send email
   
   }






   sendTranscriptByEmail(sendTo, request_id, id_project, project) {
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

      

        emailService.sendRequestTranscript(sendTo, messages, request, project);
        winston.verbose("sendTranscriptByEmail sent");
        return resolve({sendTo: sendTo, messages: messages, request: request});

      
      });

      });
    });
  }
   
   
}
 
 
 
 
var requestNotification = new RequestNotification();


module.exports = requestNotification;
 