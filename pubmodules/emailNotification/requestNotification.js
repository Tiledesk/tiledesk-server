'use strict';

var emailService = require("../../services/emailService");
var Project = require("../../models/project");
var Project_user = require("../../models/project_user");

var User = require("../../models/user");
var Lead = require("../../models/lead");
var Message = require("../../models/message");
const requestEvent = require('../../event/requestEvent');
var winston = require('../../config/winston');

class RequestNotification {


listen() {
    var that = this;
     requestEvent.on("request.create", function(request) {
      setImmediate(() => {
         that.sendEmail(request.id_project, request);
      });
     });

     requestEvent.on("request.close", function(request) {
      setImmediate(() => {
        var id_project = request.id_project;
        var request_id  = request.request_id;
        //send auto transcript
        try {                
          Project.findById(id_project, function(err, project){                        
            if (project && project.settings && project.settings.email &&  project.settings.email.autoSendTranscriptToRequester) {

              //send email to admin
              Project_user.find({ id_project: id_project,  $or:[ {"role": "admin"}, {"role": "owner"}]  } ).populate('id_user')
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

            }
          });
        }catch(e) {
          winston.error("error sendTranscriptByEmail ", e);
        }

      });
  });
}

sendEmail(projectid, savedRequest) {
    // send email
    try {
   
   
     Project.findById(projectid, function(err, project){
       if (err) {
         winston.error(err);
       }
   
       if (!project) {
        //  console.warn("Project not found", req.projectid);
         console.warn("Project not found", projectid);
       } else {
         
         // console.log("Project", project);
   
   
                 if (savedRequest.status==100) { //POOLED
                 // throw "ciao";
                   var allAgents = savedRequest.agents;
                  // console.log("allAgents", allAgents);
   
                   allAgents.forEach(project_user => {
                   //  console.log("project_user", project_user);
   
                     User.findById(project_user.id_user, function (err, user) {
                       if (err) {
                       //  console.log(err);
                       }
                       if (!user) {
                         console.warn("User not found", project_user.id_user);
                       } else {
                         console.log("Sending sendNewPooledRequestNotification to user with email", user.email);
                         if (user.emailverified) {
                           emailService.sendNewPooledRequestNotification(user.email, savedRequest, project);
                         }else {
                           console.log("User email not verified", user.email);
                         }
                       }
                     });
   
                     
                   });
   
                   }

                   else if (savedRequest.status==200) { //ASSIGNED
                     console.log("participants", savedRequest.participants[0]);
   
                     User.findById( savedRequest.participants[0], function (err, user) {
                       if (err) {
                         winston.error("Error sending email to " + savedRequest.participants[0], err);
                       }
                       if (!user) {
                         console.warn("User not found",  savedRequest.participants[0]);
                       } else {
                         console.log("Sending sendNewAssignedRequestNotification to user with email", user.email);
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
     console.log("Errore sending email", e);
   }
   //end send email
   
   }






   sendTranscriptByEmail(sendTo, request_id, id_project) {
    return new Promise(function (resolve, reject) {
      return Request.findOne({request_id: request_id, id_project: id_project})
      .populate('department')
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
        .sort({updatedAt: 'asc'})
        .exec(function(err, messages) { 
        if (err) {
          return res.status(500).send({success: false, msg: 'Error getting messages.'});
        }

        if(!messages){
          return reject(err);
        }

      

        emailService.sendRequestTranscript(sendTo, messages, request);
        console.log("sendTranscriptByEmail sent");
        return resolve({sendTo: sendTo, messages: messages, request: request});

      
      });

      });
    });
  }
   
   
}
 
 
 
 
var requestNotification = new RequestNotification();


module.exports = requestNotification;
 