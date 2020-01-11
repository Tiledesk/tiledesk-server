'use strict';

var departmentService = require('../services/departmentService');
var Request = require("../models/request");
var emailService = require("../services/emailService");
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

//var Activity = require("../models/activity");
//const activityEvent = require('../event/activityEvent');


class RequestService {

//change create with this
  routeInternal (request, departmentid, id_project, nobot) {
   var that = this;

    return new Promise(function (resolve, reject) {

        return departmentService.getOperators(departmentid, id_project, nobot).then(function (result) {

          // console.log("getOperators", result);

          var status = 100;
          var assigned_operator_id;
          var participants = [];
          
          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;
            status = 200;
            participants.push(assigned_operator_id.toString());
          }
           winston.info("routeInternal assigned_operator_id: "+ assigned_operator_id);
           winston.info("routeInternal status: "+ status);

            request.status = status;
            request.participants = participants;
            request.department = result.department._id;
            request.agents = result.agents;
                  
              return resolve(request);
                  
               
        }).catch(function(err){
          return reject(err);
        });


    });
  }
  
  
  route(request_id, departmentid, id_project, nobot) {
   var that = this;

   return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

        return Request       
        .findOne({request_id: request_id, id_project: id_project})
        .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {

          if (err) {
            winston.error(err);
            return reject(err);
          }
            
          that.routeInternal(request,departmentid, id_project, nobot ).then(function(routedRequest){

            return routedRequest.save(function(err, savedRequest) {
              // https://stackoverflow.com/questions/54792749/mongoose-versionerror-no-matching-document-found-for-id-when-document-is-being
              //return routedRequest.update(function(err, savedRequest) {
              if (err) {
                winston.error('Error saving the request.',err);
                return reject(err);
              }
          
              savedRequest
              .populate(
                  [           
                  {path:'department'},
                  {path:'lead'},                        
                  {path:'requester',populate:{path:'id_user'}}
                  ]
              ,function (err, requestComplete){
          
                  if (err) {
                    winston.error('Error populating the request.',err);
                    return reject(err);
                  }
                  winston.info("Request routed",requestComplete.toObject());
                
                  
                  
                  requestEvent.emit('request.update',requestComplete);
                  requestEvent.emit('request.participants.update', {beforeRequest:request, request:requestComplete});
                  requestEvent.emit('request.department.update',requestComplete); //se req ha bot manda messaggio \welcome

                  return resolve(requestComplete);
              });
              
            });

          }).catch(function(err) {
            return reject(err);
          });

            
          });
    });
  }

  createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {

    if (!departmentid) {
      departmentid ='default';
    }

    if (!createdBy) {
      if (project_user_id) {
        createdBy = project_user_id;
      }else {
        createdBy = "system";
      }
      
    }
    
    var that = this;

    return new Promise(function (resolve, reject) {

        return departmentService.getOperators(departmentid, id_project, false).then(function (result) {

           // console.log("getOperators", result);

           var assigned_operator_id;
           var participants = [];
           console.log("req status0", status);
           if (!status) {
             console.log("req status check", status);
             status = 100;
             if (result.operators && result.operators.length>0) {
               assigned_operator_id = result.operators[0].id_user;
               status = 200;
               participants.push(assigned_operator_id.toString());
             }
           }
           
           // console.log("assigned_operator_id", assigned_operator_id);
            console.log("req status", status);

              var newRequest = new Request({
                request_id: request_id,
                requester: project_user_id,
                lead: lead_id,
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


                  /*
                  if (id_project!="5b45e1c75313c50014b3abc6") {
                    if (process.env.NODE_ENV!= 'test') {
                      that.sendEmail(id_project, savedRequest);
                    }
                  }*/
                  
                  
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

                  /*
                  if (id_project!="5b45e1c75313c50014b3abc6") {
                    if (process.env.NODE_ENV!= 'test') {
                      that.sendEmail(id_project, savedRequest);
                    }
                  }*/
                  
                  
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

        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {status: newstatus}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {

            if (err) {
              winston.error(err);
              return reject(err);
            }
            requestEvent.emit('request.update',updatedRequest);
            //TODO emit request.clone or reopen also 

            return resolve(updatedRequest);
          });
    });

  }


  setClosedAtByRequestId(request_id, id_project, closed_at) {

    return new Promise(function (resolve, reject) {
     // console.log("request_id", request_id);
     // console.log("newstatus", newstatus);

        return Request        
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {closed_at: closed_at}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {
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

        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {$inc : {'messages_count' : 1}}, {new: true, upsert:false}, function(err, updatedRequest) {
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

      return Request       
      .findOne({request_id: request_id, id_project: id_project}, function(err, request) {
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
                  

                  /* moved to requestNotification
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

                    */

                    winston.info("Request closed", updatedRequest);
                    //TODO ?? requestEvent.emit('request.update', updatedRequest);
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
     
        return Request      
        .findOne({request_id: request_id, id_project: id_project})
        
        .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {

        
          if (err){
            winston.error("Error getting reopened request ", err);
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

          winston.error("sono quiiiiiiiiii ");
          request.save(function(err, savedRequest) {
            if (err) {
              winston.error("Error saving reopened the request", err);
              return reject(err);              
            }          
            
            requestEvent.emit('request.update', savedRequest);
            requestEvent.emit('request.reopen', savedRequest);

            winston.info("Request reopened", savedRequest);
            return resolve(savedRequest);
            
          });

         

        }).catch(function(err)  {
              winston.error("Error reopening the request", err);
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

  setParticipantsByRequestId(request_id, id_project, newparticipants) {
    
    //TODO validate participants
    
    return new Promise(function (resolve, reject) {
      // console.log("request_id", request_id);
      // console.log("participants", participants);

      return Request
       
      .findOne({request_id: request_id, id_project: id_project})
      .populate('lead')
      .populate('department')
      .populate({path:'requester',populate:{path:'id_user'}})
      .exec( function(err, request) {
        if (err) {
          winston.error("Error setParticipantsByRequestId", err);
          return reject(err);
        }
        request.participants = newparticipants;
        
        request.save(function(err, updatedRequest) {
          if (err) {
            winston.error("Error setParticipantsByRequestId", err);
            return reject(err);
          }
        
           requestEvent.emit('request.update', updatedRequest);
           requestEvent.emit('request.participants.update', {beforeRequest:request, request:updatedRequest});

          return resolve(updatedRequest);
        });
       
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


//TODO control if member is a valid project_user of the project

    return new Promise(function (resolve, reject) {
      return Request       
      .findOne({request_id: request_id, id_project: id_project})
      
      .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {
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
              requestEvent.emit('request.participants.join', {member:member, request: savedRequest});
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

    
      return Request        
        .findOne({request_id: request_id, id_project: id_project})
        .populate('lead')
        .populate('department')
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {
        
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
              requestEvent.emit('request.participants.leave', {member:member, request: savedRequest});
            }

            return resolve(savedRequest);

          });

        
          
      });
    });
  }




}


var requestService = new RequestService();


module.exports = requestService;