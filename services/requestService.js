'use strict';

var departmentService = require('../services/departmentService');
var Request = require("../models/request");
var emailService = require("../models/emailService");
var Project = require("../models/project");
var User = require("../models/user");
var Message = require("../models/message");
// var mongoose = require('mongoose');
var messageService = require('../services/messageService');
// var leadService = require('../services/leadService');
var Lead = require('../models/lead');
const requestEvent = require('../event/requestEvent');
var Project_user = require("../models/project_user");
var winston = require('../config/winston');
var config = require('../config/email');


//var Activity = require("../models/activity");
//const activityEvent = require('../event/activityEvent');


class RequestService {


  create(requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
      return this.createWithId(null, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes);
  };



  createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {

    // console.log("request_id", request_id);


    if (!departmentid) {
      departmentid ='default';
    }

    if (!createdBy) {
      createdBy = requester_id;
    }
    
    var that = this;

    return new Promise(function (resolve, reject) {

        return departmentService.getOperators(departmentid, id_project, false).then(function (result) {

          // console.log("getOperators", result);

          var status = 100;
          var assigned_operator_id;
          var participants = [];
          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;
            status = 200;
            participants.push(assigned_operator_id.toString());
          }
          // console.log("assigned_operator_id", assigned_operator_id);
          // console.log("status", status);

              var newRequest = new Request({
                request_id: request_id,
                requester_id: requester_id,
                first_text: first_text,
                status: status,
                participants: participants,
                department: result.department._id,

            
                // rating: req.body.rating,
                // rating_message: req.body.rating_message,
            
                agents: result.agents,
                //availableAgents: result.available_agents,

                // assigned_operator_id:  result.assigned_operator_id,
            
                //others
                sourcePage: sourcePage,
                language: language,
                userAgent: userAgent,
            
                attributes: attributes,
                //standard
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy
              });
                    

              // console.log('newRequest.',newRequest);


          

              return newRequest.save(function(err, savedRequest) {
                  if (err) {
                    winston.error('Error createWithId the request.',err);
                    return reject(err);
                  }
              
              
                  winston.info("Request created",savedRequest.toObject());
                  
                  // console.log("XXXXXXXXXXXXXXXX");

                  if (id_project!="5b45e1c75313c50014b3abc6") {
                    if (process.env.NODE_ENV!= 'test') {
                      that.sendEmail(id_project, savedRequest);
                    }
                  }
                  
                  
                  requestEvent.emit('request.create.simple',savedRequest);


                  //var activity = new Activity({actor: createdBy, verb: "REQUEST_CREATE", actionObj: newRequest, target: savedRequest._id, id_project: id_project });
                  //activityEvent.emit('request.create', activity);

                  
                  return resolve(savedRequest);
                  
                });
            }).catch(function(err){
              return reject(err);
            });


    });

    
    
    

  }


  changeStatusByRequestId(request_id, id_project, newstatus) {

    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

        return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {status: newstatus}, {new: true, upsert:false}, function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
            requestEvent.emit('request.update',updatedRequest);
           // console.log("updatedRequest", updatedRequest);
            return resolve(updatedRequest);
          });
    });

  }


  setClosedAtByRequestId(request_id, id_project, closed_at) {

    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

        return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {closed_at: closed_at}, {new: true, upsert:false}, function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }

           // console.log("updatedRequest", updatedRequest);
            return resolve(updatedRequest);
          });
    });

  }

  incrementMessagesCountByRequestId(request_id, id_project) {

    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

        return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {$inc : {'messages_count' : 1}}, {new: true, upsert:false}, function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
            winston.debug("Message count +1");
            return resolve(updatedRequest);
          });
    });

  }

  updateWaitingTimeByRequestId(request_id, id_project) {

    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

      return Request.findOne({request_id: request_id, id_project: id_project}, function(err, request) {
        if (err) {
          winston.error(err);
          return reject(err);
        }
        //update waiting_time only the first time
        if (!request.waiting_time) {
          var waitingTime = Date.now() - request.createdAt;
          // console.log("waitingTime", waitingTime);
  
         
          request.waiting_time = waitingTime;
            // console.log(" request",  request);
            winston.debug("Request  waitingTime setted");
          return resolve(request.save());
        }else {
          return resolve(request);
        }
        
      });

    });

  }


  closeRequestByRequestId(request_id, id_project) {

    var that = this;
    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     

        return that.changeStatusByRequestId(request_id, id_project, 1000).then(function(updatedRequest) {
            // console.log("updatedRequest", updatedRequest);
            return messageService.getTranscriptByRequestId(request_id, id_project).then(function(transcript) {
             // console.log("transcript", transcript);
              return that.updateTrascriptByRequestId(request_id, id_project, transcript).then(function(updatedRequest) {
                return that.setClosedAtByRequestId(request_id, id_project, new Date().getTime()).then(function(updatedRequest) {
                  
                  //send auto transcript
                  try {                
                      Project.findById(id_project, function(err, project){                        
                        if (project && project.settings && project.settings.email &&  project.settings.email.autoSendTranscriptToRequester) {

                           //send email to admin
                          Project_user.find({ id_project: id_project,  $or:[ {"role": "admin"}, {"role": "owner"}]  } ).populate('id_user')
                          .exec(function (err, project_users) {
                            project_users.forEach(project_user => {
                              if (project_user.id_user) {
                                return that.sendTranscriptByEmail(project_user.id_user.email, request_id, id_project);                              
                              } else {
                              }
                            });                        
                          });
                          //end send email to admin

                          //send email to lead
                          return Lead.findById(updatedRequest.requester_id, function(err, lead){
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

                    requestEvent.emit('request.close', updatedRequest);
                  return resolve(updatedRequest);
                });
              });
            });
          }).catch(function(err)  {
            winston.error(err);
              return reject(err);
          });
    });

  }


  reopenRequestByRequestId(request_id, id_project) {

    var that = this;
    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     
        return Request.findOne({request_id: request_id, id_project: id_project}, function(err, request) {
          if (err){
            winston.error(err);
            return reject(err);
          }
          if (!request) {
            winston.error("Request not found for request_id "+ request_id + " and id_project " + id_project);
            return reject({"success":false, msg:"Request not found for request_id "+ request_id + " and id_project " + id_project});
          }

          if (request.participants.length>0) {
            request.status = 200;
          } else {
            request.status = 100;
          }

         request.save(function(err, savedRequest) {
            if (!err) {
              requestEvent.emit('request.update', savedRequest);
            }          
            
            return resolve(savedRequest);
            
          });

         

        }).catch(function(err)  {
          winston.error(err);
              return reject(err);
          });
    });

  }

  updateTrascriptByRequestId(request_id, id_project, transcript) {

    return new Promise(function (resolve, reject) {
      // console.log("request_id", request_id);
      // console.log("transcript", transcript);

        return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {transcript: transcript}, {new: true, upsert:false}, function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
           // console.log("updatedRequest", updatedRequest);
            return resolve(updatedRequest);
          });
    });

  }

  findByRequestId(request_id, id_project) {
    return new Promise(function (resolve, reject) {
      return Request.findOne({request_id: request_id, id_project: id_project},  function(err, request) {
        if (err) {
          return reject(err);
        }
        return resolve(request);
      });
    });
  }

  setParticipantsByRequestId(request_id, id_project, participants) {
    return new Promise(function (resolve, reject) {
      // console.log("request_id", request_id);
      // console.log("participants", participants);

      return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {participants: participants}, {new: true, upsert:false}, function(err, updatedRequest) {
        if (err) {
          winston.error("Error setParticipantsByRequestId", err);
          return reject(err);
        }
        requestEvent.emit('request.update',updatedRequest);

        return resolve(updatedRequest);
      });

      // return Request.findOne({request_id: request_id}).then(function (request) {
      //   console.log("request", request);
      //     request.participants=participants;
      //     console.log("request after", request);
      //     return request.save().then(function(savedRequest) {
      //       return resolve(savedRequest);
      //     }).catch(function (err) {
      //       return reject(err);
      //     });
      // });
    });
  }

  addParticipantByRequestId(request_id, id_project, member) {
    // console.log("request_id", request_id);
    // console.log("id_project", id_project);
    // console.log("member", member);

    return new Promise(function (resolve, reject) {
      return Request.findOne({request_id: request_id, id_project: id_project}, function(err, request) {
        if (err){
          winston.error(err);
          return reject(err);
        }
        if (!request) {
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }


      // return Request.findById(id).then(function (request) {
        if (request.participants.indexOf(member)==-1){
          request.participants.push(member);
        }

          if (request.participants.length>0) {
            request.status = 200;
          } else {
            request.status = 100;
          }

          request.save(function(err, savedRequest) {
            if (!err) {
              requestEvent.emit('request.update', savedRequest);
            }          
            
            return resolve(savedRequest);
          });
      
          
      });
   });
  }

  removeParticipantByRequestId(request_id, id_project, member) {
    // console.log("request_id", request_id);
    // console.log("id_project", id_project);
    // console.log("member", member);

    return new Promise(function (resolve, reject) {

    
      return Request.findOne({request_id: request_id, id_project: id_project}, function(err, request) {
        
        if (err){
          winston.error(err);
          return reject(err);
        }

        if (!request) {
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }

        var index = request.participants.indexOf(member);
        // console.log("index", index);

        if (index > -1) {
          request.participants.splice(index, 1);
          // console.log(" request.participants",  request.participants);
        }
        if (request.status!=1000) {//don't change the status to 100 or 200 for closed request to resolve this bug. if the agent leave the group and after close the request the status became 100, but if the request is closed the state (1000) must not be changed
          if (request.participants.length>0) { 
            request.status = 200;
          } else {
            request.status = 100;
          }
        }
         
          // console.log(" request",  request);
       
          request.save(function(err, savedRequest) {

            if (!err) {
              requestEvent.emit('request.update', savedRequest);
            }

            return resolve(savedRequest);

          });

        
          
      });
    });
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

                   //send to bcc
                   emailService.sendNewPooledRequestNotification(config.bcc, savedRequest, project);
   
                   }

                   //at the momend department/operators send the email  for assigned request
                  //  else if (savedRequest.status==200) { //ASSIGNED
                  //    console.log("participants", savedRequest.participants[0]);
   
                  //    User.findById( savedRequest.participants[0], function (err, user) {
                  //      if (err) {
                  //        winston.error("Error sending email to " + savedRequest.participants[0], err);
                  //      }
                  //      if (!user) {
                  //        console.warn("User not found",  savedRequest.participants[0]);
                  //      } else {
                  //        console.log("Sending sendNewAssignedRequestNotification to user with email", user.email);
                  //        emailService.sendNewAssignedRequestNotification(user.email, savedRequest, project);
                  //      }
                  //    });
                  //  }



                   else {
   
                   }
   
   
         
         }
   
   });
   
   } catch (e) {
     console.log("Errore sending email", e);
   }
   //end send email
   
   }
 




}


var requestService = new RequestService();


module.exports = requestService;
