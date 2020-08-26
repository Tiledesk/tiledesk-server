'use strict';

var departmentService = require('../services/departmentService');
var Request = require("../models/request");
var messageService = require('../services/messageService');
const requestEvent = require('../event/requestEvent');
var winston = require('../config/winston');
const uuidv4 = require('uuid/v4');
var RequestConstants = require("../models/requestConstants");
var requestUtil = require("../utils/requestUtil");
var cacheUtil = require("../utils/cacheUtil");
var arrayUtil = require("../utils/arrayUtil");

class RequestService {

//change create with this
  routeInternal (request, departmentid, id_project, nobot) {
   var that = this;

    return new Promise(function (resolve, reject) {

      var context = {request: request};

          // getOperators(departmentid, projectid, nobot, disableWebHookCall, context)
        return departmentService.getOperators(departmentid, id_project, nobot, undefined, context).then(function (result) {

          // winston.debug("getOperators", result);

          var assigned_at = undefined;          
            
          var status = RequestConstants.UNSERVED; //unserved
          var assigned_operator_id;
          var participants = [];
          var participantsAgents = [];
          var participantsBots = [];
          var hasBot = false;

          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;

            status =  RequestConstants.SERVED; //served

            var assigned_operator_idString = assigned_operator_id.toString();
            participants.push(assigned_operator_idString);

            if (assigned_operator_idString.startsWith("bot_")) {            
             hasBot = true;

             var assigned_operator_idStringBot = assigned_operator_idString.replace("bot_","");
             participantsBots.push(assigned_operator_idStringBot);
            }else {
             participantsAgents.push(assigned_operator_idString);
             hasBot = false; //??
            }

            assigned_at = Date.now();            
          }
           winston.debug("routeInternal assigned_operator_id: "+ assigned_operator_id);
           winston.debug("routeInternal status: "+ status);

          request.status = status;

          request.participants = participants;          
          request.participantsAgents = participantsAgents;
          request.participantsBots = participantsBots;
          request.hasBot = hasBot;

          request.department = result.department._id;
          request.agents = result.agents;
          request.assigned_at = assigned_at;
          request.waiting_time = undefined //reset waiting_time on reroute
                  
              return resolve(request);
                  
               
        }).catch(function(err){
          return reject(err);
        });


    });
  }
  
  // TODO  changePreflightByRequestId se un agente entra in request freflight true disabilitare add agente e reassing ma mettere un bottone removePreflight???
  
  route(request_id, departmentid, id_project, nobot) {
   var that = this;

   return new Promise(function (resolve, reject) {
     winston.debug("request_id:" + request_id);
     winston.debug("departmentid:" + departmentid);
     winston.debug("id_project:" + id_project);
     winston.debug("nobot:"+ nobot);

        return Request       
        .findOne({request_id: request_id, id_project: id_project})     
        .cache(cacheUtil.defaultTTL, id_project+":requests:request_id:"+request_id)     
        .exec( function(err, request) {

          if (err) {
            winston.error(err);
            return reject(err);
          }
                   

          //it is important to clone here
          var requestBeforeRoute = Object.assign({}, request.toObject());
          winston.debug("requestBeforeRoute",requestBeforeRoute);

          var beforeParticipants = requestBeforeRoute.participants;
          winston.debug("beforeParticipants: ", beforeParticipants);

          return that.routeInternal(request, departmentid, id_project, nobot ).then(function(routedRequest){

            winston.debug("after routeInternal");
            // winston.info("requestBeforeRoute.participants " +requestBeforeRoute.request_id , requestBeforeRoute.participants);
            // console.log("routedRequest.participants " +routedRequest.request_id , routedRequest.participants);
            winston.debug("request.status:" + requestBeforeRoute.status);
            winston.debug("routedRequest.status:" + routedRequest.status);


            if (requestBeforeRoute.status === routedRequest.status && requestUtil.arraysEqual(beforeParticipants, routedRequest.participants)) {
              winston.info("Request " +request.request_id + " contains already the same participants at the same request status. Routed to the same participants");

              return request
              .populate('lead') 
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')  
              .populate({path:'requester',populate:{path:'id_user'}})
              .execPopulate( function(err, requestComplete) {
                return resolve(requestComplete);
              });
            }

              //cacheinvalidation
            return routedRequest.save(function(err, savedRequest) {
              // https://stackoverflow.com/questions/54792749/mongoose-versionerror-no-matching-document-found-for-id-when-document-is-being
              //return routedRequest.update(function(err, savedRequest) {
              if (err) {
                winston.error('Error saving the request.',err);
                return reject(err);
              }
              
              winston.debug("after save");

              return savedRequest
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')  
              .populate({path:'requester',populate:{path:'id_user'}})
              .execPopulate( function(err, requestComplete) {

              // return Request       //to populate correctly i must re-exec the query
              // .findById(savedRequest.id)
              // .populate('lead')
              // .populate('department')
              // .populate('participatingBots')
              // .populate('participatingAgents')  
              // .populate({path:'requester',populate:{path:'id_user'}})
              // .exec( function(err, requestComplete) {
             
          
              if (err) {
                winston.error('Error populating the request.',err);
                return reject(err);
              }

              winston.info("Request routed",requestComplete.toObject());
            

              var oldParticipants = beforeParticipants;
              winston.debug("oldParticipants ", oldParticipants);

              let newParticipants = requestComplete.participants;
              winston.debug("newParticipants ", newParticipants);

              var removedParticipants = oldParticipants.filter(d => !newParticipants.includes(d));
              winston.debug("removedParticipants ", removedParticipants);

              var addedParticipants = newParticipants.filter(d => !oldParticipants.includes(d));
              winston.debug("addedParticipants ", addedParticipants);

              
              requestEvent.emit('request.update',requestComplete);
              requestEvent.emit("request.update.comment", {comment:"REROUTE",request:requestComplete});
              // requestEvent.emit('request.participants.update', {beforeRequest:request, request:requestComplete});
              requestEvent.emit('request.participants.update', {beforeRequest:request, 
                removedParticipants:removedParticipants, 
                addedParticipants:addedParticipants,
                request:requestComplete});

              requestEvent.emit('request.department.update',requestComplete); //se req ha bot manda messaggio \welcome

              winston.debug("here end");

              return resolve(requestComplete);
          });


              
            });

          }).catch(function(err) {
            return reject(err);
          });

            
          });
    });
  }


  reroute(request_id, id_project, nobot) {
    var that = this;
 
    return new Promise(function (resolve, reject) {
      // winston.debug("request_id", request_id);
      // winston.debug("newstatus", newstatus);
 
         return Request       
         .findOne({request_id: request_id, id_project: id_project})
         .cache(cacheUtil.defaultTTL, id_project+":requests:request_id:"+request_id)
         .exec( function(err, request) {
 
           if (err) {
             winston.error(err);
             return reject(err);
           }
                 
           winston.debug("here reroute1 ");
           return that.route(request_id, request.department.toString(), id_project, nobot).then(function(routedRequest){
             return resolve(routedRequest);
           }).catch(function(err) {
            return reject(err);
           });
             
           });
     });
   }




  createWithRequester(project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight) {

    var request_id = 'support-group-'+uuidv4();
    winston.debug("request_id: "+request_id);
    
    return this.createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight);
  }

  createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight) {

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

    return new Promise(async (resolve, reject) => {

        var context = {request: {request_id:request_id, project_user_id:project_user_id, lead_id:lead_id, id_project:id_project, 
          first_text:first_text, departmentid:departmentid, sourcePage:sourcePage, language:language, userAgent:userAgent, status:status, 
          createdBy:createdBy, attributes:attributes, subject:subject}};

          winston.debug("context",context);

          // getOperators(departmentid, projectid, nobot, disableWebHookCall, context)
        // return departmentService.getOperators(departmentid, id_project, false, undefined, context).then(function (result) {

        
           var assigned_at = undefined;          
           var assigned_operator_id;
           var participants = [];
           var participantsAgents = [];
           var participantsBots = [];
           var hasBot = false;
           var dep_id = departmentid;
           var agents = [];


           var result = await departmentService.getOperators(departmentid, id_project, false, undefined, context);
           winston.info("getOperators", result);
 
           // for preflight it is important to save agents in req for trigger. try to optimize it
           dep_id = result.department._id;
           agents = result.agents;


          //  winston.debug("req status0", status);

           if (!status) {
        

           
            //  winston.debug("req status check", status);
             status = RequestConstants.UNSERVED; //unserved
             if (result.operators && result.operators.length>0) {
               assigned_operator_id = result.operators[0].id_user;
               status =  RequestConstants.SERVED; //served
               var assigned_operator_idString = assigned_operator_id.toString();
               participants.push(assigned_operator_idString);
               if (assigned_operator_idString.startsWith("bot_")) {
                hasBot = true;
                winston.debug("hasBot:"+hasBot);
                var assigned_operator_idStringBot = assigned_operator_idString.replace("bot_","");
                winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);
                participantsBots.push(assigned_operator_idStringBot);

               } else {
                participantsAgents.push(assigned_operator_idString);
               }
               assigned_at = Date.now();
             }
           }
           
           // winston.debug("assigned_operator_id", assigned_operator_id);
            // winston.debug("req status", status);

              var newRequest = new Request({
                request_id: request_id,
                requester: project_user_id,
                lead: lead_id,
                first_text: first_text,
                subject: subject,
                status: status,
                participants: participants,
                participantsAgents:participantsAgents,
                participantsBots: participantsBots,
                hasBot: hasBot,
                department: dep_id,          
                agents: agents,
                //availableAgents: result.available_agents,

                // assigned_operator_id:  result.assigned_operator_id,
            
                //others
                sourcePage: sourcePage,
                language: language,
                userAgent: userAgent,
                assigned_at : assigned_at,

                attributes: attributes,
                //standard
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy,
                preflight: preflight
              });
                    

              // winston.debug('newRequest.',newRequest);


          
              //cacheinvalidation
              return newRequest.save(function(err, savedRequest) {
                  if (err) {
                    winston.error('Error createWithId the request.',err);
                    return reject(err);
                  }
              
              
                  winston.info("Request created",savedRequest.toObject());
                                    
                  
                  requestEvent.emit('request.create.simple', savedRequest);
                  
                  return resolve(savedRequest);
                  
                });
            // }).catch(function(err){
            //   return reject(err);
            // });


    });
  }


  create(requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
    return this.createWithId(null, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes);
};


  createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {

    // winston.debug("request_id", request_id);


    if (!departmentid) {
      departmentid ='default';
    }

    if (!createdBy) {
      createdBy = requester_id;
    }
    
    var that = this;

    return new Promise(function (resolve, reject) {

      var context = {request: {request_id:request_id, requester_id:requester_id, id_project:id_project, 
        first_text:first_text, departmentid:departmentid, sourcePage:sourcePage, language:language, userAgent:userAgent, status:status, 
        createdBy:createdBy, attributes:attributes}};

                  // getOperators(departmentid, projectid, nobot, disableWebHookCall, context)

        return departmentService.getOperators(departmentid, id_project, false, undefined, context).then(function (result) {

          // winston.debug("getOperators", result);

          var status =  RequestConstants.UNSERVED;
          var assigned_operator_id;
          var participants = [];
          var participantsAgents = [];
          var participantsBots = [];
          var hasBot = false;

          var assigned_at = undefined;
          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;
            status =  RequestConstants.SERVED;

            var assigned_operator_idString = assigned_operator_id.toString();
            participants.push(assigned_operator_idString);

            if (assigned_operator_idString.startsWith("bot_")) {
             hasBot = true;

             var assigned_operator_idStringBot = assigned_operator_idString.replace("bot_","");
             winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);
             participantsBots.push(assigned_operator_idStringBot);

            }else {
             participantsAgents.push(assigned_operator_idString);
            }
            assigned_at = Date.now();
          }
          // winston.debug("assigned_operator_id", assigned_operator_id);
          // winston.debug("status", status);

              var newRequest = new Request({
                request_id: request_id,
                requester_id: requester_id,
                first_text: first_text,
                status: status,
                participants: participants,
                participantsAgents:participantsAgents,
                participantsBots: participantsBots,
                hasBot:hasBot,
                department: result.department._id,                           
                agents: result.agents,
                //availableAgents: result.available_agents,

                // assigned_operator_id:  result.assigned_operator_id,
            
                //others
                sourcePage: sourcePage,
                language: language,
                userAgent: userAgent,
                assigned_at:assigned_at,
                attributes: attributes,
                //standard
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy
              });
                    

              // winston.debug('newRequest.',newRequest);


          
              //cacheinvalidation
              return newRequest.save(function(err, savedRequest) {
                  if (err) {
                    winston.error('Error createWithId the request.',err);
                    return reject(err);
                  }
              
              
                  winston.info("Request created",savedRequest.toObject());
                                
                  
                  requestEvent.emit('request.create.simple',savedRequest);
                  
                  return resolve(savedRequest);
                  
                });
            }).catch(function(err){
              return reject(err);
            });


    });

    
    
    

  }


  changeStatusByRequestId(request_id, id_project, newstatus) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

     //TODO CHECK IF ALREADY CLOSED
        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {status: newstatus}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {

            if (err) {
              winston.error(err);
              return reject(err);
            }
            requestEvent.emit('request.update',updatedRequest);
            requestEvent.emit("request.update.comment", {comment:"STATUS_CHANGE",request:updatedRequest});
            //TODO emit request.clone or reopen also 

            return resolve(updatedRequest);
          });
    });

  }

  changeFirstTextAndPreflightByRequestId(request_id, id_project, first_text, preflight) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {first_text: first_text, preflight: preflight}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {

            if (err) {
              winston.error(err);
              return reject(err);
            }

           
            requestEvent.emit('request.update.preflight',updatedRequest); //archive to audit log
            requestEvent.emit('request.update',updatedRequest);
            requestEvent.emit("request.update.comment", {comment:"FIRSTTEXT_PREFLIGHT_CHANGE",request:updatedRequest});
            //TODO emit request.clone or reopen also 

            return resolve(updatedRequest);
          });
    });

  }

  changeFirstTextByRequestId(request_id, id_project, first_text) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {first_text: first_text}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {

            if (err) {
              winston.error(err);
              return reject(err);
            }
            requestEvent.emit('request.update',updatedRequest);
            requestEvent.emit("request.update.comment", {comment:"FIRSTTEXT_CHANGE",request:updatedRequest});
            //TODO emit request.clone or reopen also 

            return resolve(updatedRequest);
          });
    });

  }



  changePreflightByRequestId(request_id, id_project, preflight) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

        return Request       
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {preflight: preflight}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {

            if (err) {
              winston.error(err);
              return reject(err);
            }
            requestEvent.emit('request.update',updatedRequest);
            requestEvent.emit("request.update.comment", {comment:"PREFLIGHT_CHANGE",request:updatedRequest});

            return resolve(updatedRequest);
          });
    });

  }

  setClosedAtByRequestId(request_id, id_project, closed_at) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

        return Request        
        .findOneAndUpdate({request_id: request_id, id_project: id_project}, {closed_at: closed_at}, {new: true, upsert:false})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }

           // winston.debug("updatedRequest", updatedRequest);
            return resolve(updatedRequest);
          });
    });

  }

  // unused
  incrementMessagesCountByRequestId(request_id, id_project) {

    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

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
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

      return Request       
      .findOne({request_id: request_id, id_project: id_project})
      .cache(cacheUtil.defaultTTL, id_project+":requests:request_id:"+request_id)     
      .exec(function(err, request) {
        if (err) {
          winston.error(err);
          return reject(err);
        }
        //update waiting_time only the first time
        if (!request.waiting_time) {
          var now = Date.now();
          var waitingTime = now - request.createdAt;
          // winston.debug("waitingTime", waitingTime);
  
         
          request.waiting_time = waitingTime;
          request.first_response_at = now;

            // winston.debug(" request",  request);
            winston.debug("Request  waitingTime setted");
              //cacheinvalidation
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
     // winston.debug("request_id", request_id);
     

     return Request      
     .findOne({request_id: request_id, id_project: id_project})
     
     .populate('lead')
     .populate('department')
     .populate('participatingBots')
     .populate('participatingAgents')  
     .populate({path:'requester',populate:{path:'id_user'}})
     .exec( function(err, request) {

     
       if (err){
         winston.error("Error getting closing request ", err);
         return reject(err);
       }
       if (!request) {
         winston.error("Request not found for request_id "+ request_id + " and id_project " + id_project);
         return reject({"success":false, msg:"Request not found for request_id "+ request_id + " and id_project " + id_project});
       }      
       if (request.status == RequestConstants.CLOSED) {
         // qui1000
      //  if (request.statusObj.closed) {
        winston.debug("Request already closed for request_id "+ request_id + " and id_project " + id_project);
        return resolve(request);
       }

     
       return that.changeStatusByRequestId(request_id, id_project, 1000).then(function(updatedRequest) {
         //  qui1000
        // return that.changeStatusByRequestId(request_id, id_project, {closed:true}).then(function(updatedRequest) {
          

            // winston.debug("updatedRequest", updatedRequest);
            return messageService.getTranscriptByRequestId(request_id, id_project).then(function(transcript) {
             // winston.debug("transcript", transcript);
              return that.updateTrascriptByRequestId(request_id, id_project, transcript).then(function(updatedRequest) {
                return that.setClosedAtByRequestId(request_id, id_project, new Date().getTime()).then(function(updatedRequest) {
                  
                    winston.info("Request closed with id: " + updatedRequest.id);
                    winston.debug("Request closed ", updatedRequest);
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
    });

  }


  reopenRequestByRequestId(request_id, id_project) {

    var that = this;
    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     
        return Request      
        .findOne({request_id: request_id, id_project: id_project})
        
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
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

          if (request.status == RequestConstants.SERVED || request.status == RequestConstants.UNSERVED) {
            winston.debug("request already open"); 
            return resolve(request);
          }

          if (request.participants.length>0) {
            request.status =  RequestConstants.SERVED;
            // assigned_at?
          } else {
            request.status =  RequestConstants.UNSERVED;
          }

            //cacheinvalidation
          request.save(function(err, savedRequest) {
            if (err) {
              winston.error("Error saving reopened the request", err);
              return reject(err);              
            }          
            
            requestEvent.emit('request.update', savedRequest);
            requestEvent.emit("request.update.comment", {comment:"REOPEN",request:savedRequest});
            requestEvent.emit('request.reopen', savedRequest);

            winston.info("Request reopened", savedRequest);

            // TODO allora neanche qui participatingAgent è ok? 

            
            return resolve(savedRequest);
            
          });

         

        })
        // .catch(function(err)  {
        //       winston.error("Error reopening the request", err);
        //       return reject(err);
        //   });
    });

  }

  updateTrascriptByRequestId(request_id, id_project, transcript) {

    return new Promise(function (resolve, reject) {
      // winston.debug("request_id", request_id);
      // winston.debug("transcript", transcript);

        //cacheinvalidation
        return Request.findOneAndUpdate({request_id: request_id, id_project: id_project}, {transcript: transcript}, {new: true, upsert:false}, function(err, updatedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
           // winston.debug("updatedRequest", updatedRequest);
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
    // validate if array of string newparticipants
    return new Promise(function (resolve, reject) {
      
      var isArray = Array.isArray(newparticipants);

      if(isArray==false) {
        winston.error('setParticipantsByRequestId error  newparticipants is not an array for request_id '+ request_id + ' and id_project '+ id_project);
        return reject('setParticipantsByRequestId error  newparticipants is not an array for request_id '+ request_id + ' and id_project '+ id_project);
      }

      return Request
       
      .findOne({request_id: request_id, id_project: id_project})     
      // qui cache ok
      .exec( function(err, request) {
        if (err) {
          winston.error("Error setParticipantsByRequestId", err);
          return reject(err);
        }       
        if (!request) {
          winston.error('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }
        var oldParticipants = request.participants;
        winston.debug('oldParticipants', oldParticipants);
        winston.debug('newparticipants', newparticipants);
        
        if (requestUtil.arraysEqual(oldParticipants, newparticipants)){
        //if (oldParticipants === newparticipants) {
          winston.info('Request members '+ oldParticipants+ ' already equal to ' + newparticipants + ' for request_id '+ request_id + ' and id_project '+ id_project);
          return request
          .populate('lead')
          .populate('department')
          .populate('participatingBots')
          .populate('participatingAgents')  
          .populate({path:'requester',populate:{path:'id_user'}})
          .execPopulate( function(err, requestComplete) {
            return resolve(requestComplete);
          });

        }

        request.participants = newparticipants;

        var newparticipantsAgents = [];
        var newparticipantsBots = [];


        if (newparticipants && newparticipants.length>0) {
          var hasBot = false;
          newparticipants.forEach(newparticipant => {
            if (newparticipant.startsWith("bot_")) {   
              hasBot = true;                         
              var assigned_operator_idStringBot = newparticipant.replace("bot_","");
              winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);
              newparticipantsBots.push(assigned_operator_idStringBot);
    
            }else {
              newparticipantsAgents.push(newparticipant);
            }
          });
          request.hasBot = hasBot;
        }

        request.participantsAgents = newparticipantsAgents;
        request.participantsBots = newparticipantsBots;
       
       



        if (request.participants.length>0) { 
          request.status =  RequestConstants.SERVED; //served
          // assigned_at?
        } else {
          request.status =  RequestConstants.UNSERVED; //unserved
        }
        
        request.waiting_time = undefined //reset waiting_time on reroute ????

          //cacheinvalidation
        return request.save(function(err, updatedRequest) {
          // dopo save non aggiorna participating
          if (err) {
            winston.error("Error setParticipantsByRequestId", err);
            return reject(err);
          }
        
         return updatedRequest
          .populate('lead')
          .populate('department')
          .populate('participatingBots')
          .populate('participatingAgents')  
          .populate({path:'requester',populate:{path:'id_user'}})
          .execPopulate( function(err, requestComplete) {


            if (err) {
              winston.error("Error getting setParticipantsByRequestId", err);
              return reject(err);
            }

            requestEvent.emit('request.update', requestComplete);
            requestEvent.emit("request.update.comment", {comment:"PARTICIPANTS_SET",request:requestComplete});


            winston.debug("oldParticipants ", oldParticipants);

            let newParticipants = requestComplete.participants;
            winston.debug("newParticipants ", newParticipants);

            var removedParticipants = oldParticipants.filter(d => !newParticipants.includes(d));
            winston.debug("removedParticipants ", removedParticipants);

            var addedParticipants = newParticipants.filter(d => !oldParticipants.includes(d));
            winston.debug("addedParticipants ", addedParticipants);

            requestEvent.emit('request.participants.update', {beforeRequest:request, 
                        removedParticipants:removedParticipants, 
                        addedParticipants:addedParticipants,
                        request:requestComplete});

  // TODO allora neanche qui participatingAgent è ok?
            return resolve(requestComplete);
           });
        });
       
      });


    });
  }

  addParticipantByRequestId(request_id, id_project, member) {
    winston.debug("request_id: " + request_id);
    winston.debug("id_project: " + id_project);
    winston.debug("addParticipantByRequestId member: " + member);

 

//TODO control if member is a valid project_user of the project
// validate member is string
    return new Promise(function (resolve, reject) {

      if (member==undefined) {
        var err = "addParticipantByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }

      return Request       
      .findOne({request_id: request_id, id_project: id_project})     
      // qui cache         
      .exec( function(err, request) {
        if (err){
          winston.error("Error adding participant ", err);
          return reject(err);
        }
        if (!request) {
          winston.error('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }

        winston.debug("assigned_operator here1");

      // return Request.findById(id).then(function (request) {
        if (request.participants.indexOf(member)==-1){
          request.participants.push(member);

          if (member.startsWith("bot_")) {
            request.hasBot = true;


            var assigned_operator_idStringBot = member.replace("bot_","");
            winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);            
            request.participantsBots.push(assigned_operator_idStringBot);
           }else {
            request.participantsAgents.push(member);
            request.hasBot = false; //???
           }


          if (request.participants.length>0) {          
            request.status =  RequestConstants.SERVED;
            var assigned_at = Date.now();
            request.assigned_at = assigned_at;
          } else {
            request.status =  RequestConstants.UNSERVED;
          }
// check error here
  //cacheinvalidation
          request.save(function(err, savedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }

            winston.debug("saved", savedRequest);

            return savedRequest
            .populate('lead')
            .populate('department')
            .populate('participatingBots')
            .populate('participatingAgents')  
            .populate({path:'requester',populate:{path:'id_user'}})
            .execPopulate( function(err, requestComplete) {

              if (err) {
                winston.error("Error getting addParticipantByRequestId", err);
                return reject(err);
              }


              winston.debug("populated", requestComplete);
           
              requestEvent.emit('request.update', requestComplete);
              requestEvent.emit("request.update.comment", {comment:"PARTICIPANT_ADD",request:requestComplete});
              requestEvent.emit('request.participants.join', {member:member, request: requestComplete});
              // requestEvent.emit('request.participants.update', {beforeRequest:request, request:savedRequest});
                       
              return resolve(requestComplete);
          });
        });
          // qui assignetat
        } else {
          winston.debug('Request member '+ member+ ' already added for request_id '+ request_id + ' and id_project '+ id_project);
          return request
          .populate('lead')
          .populate('department')
          .populate('participatingBots')
          .populate('participatingAgents')  
          .populate({path:'requester',populate:{path:'id_user'}})
          .execPopulate( function(err, requestComplete) {
            return resolve(requestComplete);
          });
        }
                       
      });
   });
  }

  removeParticipantByRequestId(request_id, id_project, member) {
    winston.debug("request_id", request_id);
    winston.debug("id_project", id_project);
    winston.info("member", member);

    return new Promise(function (resolve, reject) {



      if (member==undefined) {
        var err = "removeParticipantByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }

    
      return Request        
        .findOne({request_id: request_id, id_project: id_project})   
        // qui cache    
        .exec( function(err, request) {
        
        if (err){
          winston.error("Error removing participant ", err);
          return reject(err);
        }

        if (!request) {
          winston.error('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }

        var index = request.participants.indexOf(member);
        // winston.debug("index", index);

        if (index > -1) {
          request.participants.splice(index, 1);
          // winston.debug(" request.participants",  request.participants);

          if (member.startsWith("bot_")) {
            request.hasBot = false;

            var assigned_operator_idStringBot = member.replace("bot_","");
            winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);            
            
            var indexParticipantsBots = request.participantsBots.indexOf(assigned_operator_idStringBot);
            request.participantsBots.splice(indexParticipantsBots, 1);
           }else {
            var indexParticipantsAgents = request.participantsAgents.indexOf(member);
            request.participantsAgents.splice(indexParticipantsAgents, 1);
           }


          if (request.status!= RequestConstants.CLOSED) {//don't change the status to 100 or 200 for closed request to resolve this bug. if the agent leave the group and after close the request the status became 100, but if the request is closed the state (1000) must not be changed
                // qui1000 ????
          if (request.participants.length>0) { 
            request.status =  RequestConstants.SERVED;
            // assignet_at?
          } else {
            request.status =  RequestConstants.UNSERVED;
          }
        }
         
          // winston.debug(" request",  request);
         //cacheinvalidation
         return request.save(function(err, savedRequest) {
            if (err){
              winston.error("Error saving removed participant ", err);
              return reject(err);
            }
            
            return savedRequest
            .populate('lead')
            .populate('department')
            .populate('participatingBots')
            .populate('participatingAgents')  
            .populate({path:'requester',populate:{path:'id_user'}})
            .execPopulate( function(err, requestComplete) {

            if (err){
              winston.error("Error getting removed participant ", err);
              return reject(err);
            }

            
            requestEvent.emit('request.update', requestComplete);
            requestEvent.emit("request.update.comment", {comment:"PARTICIPANT_REMOVE",request:requestComplete});
            requestEvent.emit('request.participants.leave', {member:member, request: requestComplete});
            // requestEvent.emit('request.participants.update', {beforeRequest: request, request:savedRequest});
            

            return resolve(requestComplete);

          });
        });


        }else {
          winston.info('Request member '+ member+ ' already not found for request_id '+ request_id + ' and id_project '+ id_project);

          return request
          .populate('lead')
          .populate('department')
          .populate('participatingBots')
          .populate('participatingAgents')  
          .populate({path:'requester',populate:{path:'id_user'}})
          .execPopulate( function(err, requestComplete) {
            return resolve(requestComplete);
          });
        }
                          
      });
    });
  }



  updateAttributesByRequestId(request_id, id_project, attributes) {
    var data = attributes;
  
    Request.findOne({"request_id":request_id, id_project:id_project})
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')  
    .populate({path:'requester',populate:{path:'id_user'}})
    .exec( function(err, request) {
        if (err) {
          return reject(err);
        }
        if (!request) {
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }
  
        
        if (!request.attributes) {
          winston.info("empty attributes")
          request.attributes = {};
        }
  
        winston.info(" req attributes", request.attributes)
          
          Object.keys(data).forEach(function(key) {
            var val = data[key];
            winston.info("data attributes "+key+" " +val)
            request.attributes[key] = val;
          });     
          
          winston.info(" req attributes", request.attributes)
  
          // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
          request.markModified('attributes');
          
          //cacheinvalidation
          return request.save(function (err, savedRequest) {
            if (err) {
              winston.error("error saving request attributes",err)
              return reject({msg:"Error saving request attributes",err:err});
            }
            winston.info(" saved request attributes",savedRequest.toObject())
            requestEvent.emit("request.update", savedRequest);
            requestEvent.emit("request.update.comment", {comment:"ATTRIBUTES_UPDATE",request:savedRequest});
            requestEvent.emit("request.attributes.update", savedRequest);
            // allora neanche qui participatingAgent è ok?
              return resolve(savedRequest);
            });
    });
    
  }






  addTagByRequestId(request_id, id_project, tag) {
    // winston.debug("request_id", request_id);
    // winston.debug("id_project", id_project);
    // winston.debug("member", member);

    return new Promise(function (resolve, reject) {

      if (tag==undefined) {
        var err = "addTagByRequestId error, tag field is null";
        winston.error(err);
        return reject(err);
      }
      

      return Request       
      .findOne({request_id: request_id, id_project: id_project})      
      .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {
        if (err){
          winston.error("Error adding tag ", err);
          return reject(err);
        }
        if (!request) {
          winston.error('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }


      // return Request.findById(id).then(function (request) {
        if (request.participants.indexOf(tag)==-1){
          request.tags.push(tag);        
// check error here

          //cacheinvalidation
          request.save(function(err, savedRequest) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
            
            requestEvent.emit('request.update', savedRequest);      
            requestEvent.emit("request.update.comment", {comment:"TAG_ADD",request:savedRequest});        
            
            
            // allora neanche qui participatingAgent è ok?
            return resolve(savedRequest);
          });

          // qui assignetat
        } else {
          winston.debug('Request tag '+ tag+ ' already added for request_id '+ request_id + ' and id_project '+ id_project);
          return resolve(request);
        }                       
      });
   });
  }


  removeTagByRequestId(request_id, id_project, tag) {
    // winston.debug("request_id", request_id);
    // winston.debug("id_project", id_project);
    // winston.debug("member", member);

    return new Promise(function (resolve, reject) {



      if (tag==undefined) {
        var err = "removeTagByRequestId error, tag field is null";
        winston.error(err);
        return reject(err);
      }

    
      return Request        
        .findOne({request_id: request_id, id_project: id_project})
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')  
        .populate({path:'requester',populate:{path:'id_user'}})
        .exec( function(err, request) {
        
        if (err){
          winston.error("Error removing tag ", err);
          return reject(err);
        }

        if (!request) {
          winston.error('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
          return reject('Request not found for request_id '+ request_id + ' and id_project '+ id_project);
        }

        // var index = request.tags.indexOf(tag);
        var index = request.tags.findIndex(t => t.tag === tag);

        winston.info("index", index);

        if (index > -1) {
          request.tags.splice(index, 1);
          // winston.debug(" request.participants",  request.participants);    
       

          //cacheinvalidation
          request.save(function(err, savedRequest) {

            if (!err) {
              requestEvent.emit('request.update', savedRequest);
              requestEvent.emit("request.update.comment", {comment:"TAG_REMOVE",request:savedRequest});
            }

            // allora neanche qui participatingAgent è ok?

            return resolve(savedRequest);

          });


        }else {
          winston.info('Request tag '+ tag+ ' already not found for request_id '+ request_id + ' and id_project '+ id_project);
          return resolve(request);
        }      
        
          
      });
    });
  }




}


var requestService = new RequestService();


module.exports = requestService;