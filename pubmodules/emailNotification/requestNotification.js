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

class RequestNotification {


listen() {
    var that = this;
    


     requestEvent.on("request.create", function(request) {

      setImmediate(() => {
   
         that.sendEmail(request.id_project, request);
      });
     });


     requestEvent.on("request.participants.update", function(data) {

      winston.debug("requestEvent request.participants.update");

      var request = data.request;
      
      setImmediate(() => {
   
         that.sendEmail(request.id_project, request);
      });
     });

    //  requestEvent.on("request.update.preflight", function(request) {
      
    //   winston.info("requestEvent request.update.preflight");

    //   setImmediate(() => {
   
    //      that.sendEmail(request.id_project, request);
    //   });
    //  });


     

    //  TODO Send email also for addAgent and reassign. Alessio request for pooled only?

     requestEvent.on("request.close", function(request) {
      setImmediate(() => {
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
                    if (project_user.id_user) {
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
                  if (lead) {
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

sendEmail(projectid, savedRequest) {
  //  console.log("savedRequest23", savedRequest);
    // send email
    try {
   
   
    Project.findOne({_id: projectid, status: 100}, function(err, project){
       if (err) {
         return winston.error(err);
       }
   
       if (!project) {
        //  console.warn("Project not found", req.projectid);
        return console.warn("Project not found", projectid);
       } else {
         
         // winston.debug("Project", project);
   


              // TODO fare il controllo anche sul dipartimento con modalità assigned o pooled
                 if (savedRequest.status==RequestConstants.UNSERVED) { //POOLED
                 // throw "ciao";
                   var allAgents = savedRequest.agents;
                  // winston.debug("allAgents", allAgents);
   
                   allAgents.forEach(project_user => {
                   //  winston.debug("project_user", project_user);
   
                    var userid = project_user.id_user;
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
                   else if (savedRequest.status==RequestConstants.SERVED) { //ASSIGNED
                    var assignedId = savedRequest.participants[0];

                    //  winston.info("assignedId1:"+ assignedId);

                    //  if (!assignedId) {
                    //    console.log("attention90", savedRequest);
                    //  }

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
                        //  if (user.emailverified) {    enable it?                    
                          emailService.sendNewAssignedRequestNotification(user.email, savedRequest, project);
                        //  }
                       }
                     });
                   }



                   else {
   
                   }
   
   
         
         }
   
   });
   
   } catch (e) {
     winston.debug("Errore sending email", e);
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
 