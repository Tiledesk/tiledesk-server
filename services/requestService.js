'use strict';

var departmentService = require('../services/departmentService');
var Request = require("../models/request");
var Project_user = require("../models/project_user");
var messageService = require('../services/messageService');
const requestEvent = require('../event/requestEvent');
const leadEvent = require('../event/leadEvent');
var winston = require('../config/winston');
const uuidv4 = require('uuid/v4');
var RequestConstants = require("../models/requestConstants");
var requestUtil = require("../utils/requestUtil");
var cacheUtil = require("../utils/cacheUtil");
var arrayUtil = require("../utils/arrayUtil");

class RequestService {

  constructor() {
    this.listen();
  }

  listen() {
    this.updateSnapshotLead();
  }
  updateSnapshotLead() {
    leadEvent.on('lead.update', function(lead) {
      setImmediate(() => {
          winston.debug("updateSnapshotLead on lead.update ",  lead);
          
          Request.updateMany({lead: lead._id, id_project: lead.id_project}, {"$set": {"snapshot.lead": lead}}, function (err, updates) {
            if (err) {
                winston.error("Error updating requests updateSnapshotLead", err);
                return 0;
            }
            winston.verbose("updateSnapshotLead updated for " + updates.nModified + " request")
            requestEvent.emit('request.update.snapshot.lead',{lead:lead,updates:updates});
            return;
          });  
          // Request.find({lead: lead._id, id_project: lead.id_project}, function(err, requests) {

          //     if (err) {
          //         winston.error("Error getting request by lead", err);
          //         return 0;
          //     }
          //     if (!requests || (requests && requests.length==0)) {
          //         winston.warn("No request found for lead id " +lead._id );
          //         return 0;
          //     }
              
          //     requests.forEach(function(request) {
                

          //     });

            // });


          });
        });
  }
  getAvailableAgentsCount(agents) {
     
      var project_users_available = agents.filter(function (projectUser) {
        if (projectUser.user_available == true) {
          return true;
        }
      });
      winston.debug('++ AVAILABLE PROJECT USERS count ', project_users_available)
  
      if (project_users_available && project_users_available.length>0){
        return project_users_available.length;
      }else {
        return 0;
      }

  
  }

//change create with this
  routeInternal (request, departmentid, id_project, nobot) {
   var that = this;

    return new Promise(function (resolve, reject) {

      var context = {request: request};

          // getOperators(departmentid, projectid, nobot, disableWebHookCall, context)
        return departmentService.getOperators(departmentid, id_project, nobot, undefined, context).then(function (result) {

          // winston.debug("getOperators", result);

          var assigned_at = undefined;          
            
          var status = RequestConstants.UNASSIGNED; 
          var assigned_operator_id;
          var participants = [];
          var participantsAgents = [];
          var participantsBots = [];
          var hasBot = false;

          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;

            status =  RequestConstants.ASSIGNED;

            var assigned_operator_idString = assigned_operator_id.toString();
            participants.push(assigned_operator_idString);

            // botprefix
            if (assigned_operator_idString.startsWith("bot_")) {            
             hasBot = true;

             // botprefix
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
          // request.agents = result.agents;
          request.assigned_at = assigned_at;
          request.waiting_time = undefined //reset waiting_time on reroute
          
          if (!request.snapshot) { //if used other methods than .create
            request.snapshot = {}
          }

          request.snapshot.department = result.department;
          request.snapshot.agents = result.agents;
          request.snapshot.availableAgentsCount = that.getAvailableAgentsCount(result.agents);

              return resolve(request);
                  
               
        }).catch(function(err){
          return reject(err);
        });


    });
  }
  
  // TODO  changePreflightByRequestId se un agente entra in request freflight true disabilitare add agente e reassing ma mettere un bottone removePreflight???
  // usalo no_populate
  route(request_id, departmentid, id_project, nobot, no_populate) {
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
                   

          // cambia var in let

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


            let beforeDepartmentId;
            if (requestBeforeRoute.department) { //requestBeforeRoute.department can be empty for internal ticket
              beforeDepartmentId = requestBeforeRoute.department.toString();
              winston.debug("beforeDepartmentId:"+ beforeDepartmentId);
            }

            let afterDepartmentId;
            if (routedRequest.department) {
              afterDepartmentId = routedRequest.department.toString();
              winston.debug("afterDepartmentId:"+ afterDepartmentId);
            }


            if (requestBeforeRoute.status === routedRequest.status && 
              beforeDepartmentId === afterDepartmentId && 
             requestUtil.arraysEqual(beforeParticipants, routedRequest.participants)) {

              winston.verbose("Request " +request.request_id + " contains already the same participants at the same request status. Routed to the same participants");

              if (no_populate==="true" || no_populate===true) {
                winston.debug("no_populate is true");
                return resolve(request);
              }

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
                winston.error('Error saving the request. ', {err:err, routedRequest:routedRequest});
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

              winston.verbose("Request routed",requestComplete.toObject());
            

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
    var startDate = new Date();
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

            var endDate = new Date();
            winston.verbose("Performance Request reroute in millis: " + endDate-startDate);

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

  createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {
    
    var request = {
                    request_id:request_id, project_user_id:project_user_id, lead_id:lead_id, id_project:id_project,first_text:first_text,
                    departmentid:departmentid, sourcePage:sourcePage, language:language, userAgent:userAgent, status:status, createdBy:createdBy,
                    attributes:attributes, subject:subject, preflight:preflight, channel:channel, location:location 
                  };

    return this.create(request);
  };  

  create(request) {

    var startDate = new Date();

    var request_id = request.request_id;
    var project_user_id = request.project_user_id;
    var lead_id = request.lead_id;
    var id_project = request.id_project;

    //TODO rimuovi ritorni a capo first_text, fai anche trim
    var first_text;  
    if (request.first_text) {  //first_text can be empty for type image
      first_text = request.first_text.replace(/[\n\r]+/g, '');
    }
     
    var departmentid = request.departmentid;
    var sourcePage = request.sourcePage;
    var language = request.language;
    var userAgent = request.userAgent;
    var status = request.status;
    var createdBy = request.createdBy;
    var attributes = request.attributes;
    var subject = request.subject;
    var preflight = request.preflight;
    var channel = request.channel;
    var location = request.location;
    var participants = request.participants || [];

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
          createdBy:createdBy, attributes:attributes, subject:subject, preflight: preflight, channel: channel, location: location,
          participants:participants}};

          winston.debug("context",context);

           var participantsAgents = [];
           var participantsBots = [];
           var hasBot = false;

           var dep_id = undefined;

           var assigned_at = undefined;          
          
           var agents = [];

           var snapshot = {};

           try {
            //  getOperators(departmentid, projectid, nobot, disableWebHookCall, context) {
              var result = await departmentService.getOperators(departmentid, id_project, false, undefined, context);
              winston.info("getOperators", result);
          } catch(err) {
            return reject(err);
          }

          
           agents = result.agents;


          if (status == 50) {
                // skip assignment
                if (participants.length == 0 ) {
                  dep_id = result.department._id;
                }
          } else {
         
            if (participants.length == 0 ) {
              if (result.operators && result.operators.length>0) {            
                participants.push(result.operators[0].id_user.toString());
              }
              // for preflight it is important to save agents in req for trigger. try to optimize it
              dep_id = result.department._id;

            }

            if (participants.length > 0) {
            
              status =  RequestConstants.ASSIGNED;
  
              // botprefix
              if (participants[0].startsWith("bot_")) {
  
                hasBot = true;
                winston.debug("hasBot:"+hasBot);
  
                // botprefix
                var assigned_operator_idStringBot = participants[0].replace("bot_","");
                winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);
  
                participantsBots.push(assigned_operator_idStringBot);
  
               } else {

                participantsAgents.push(participants[0]);

               }
  
               assigned_at = Date.now();

            } else {

               status = RequestConstants.UNASSIGNED; 

            }

          }

        
           

          if (dep_id) {
            snapshot.department = result.department;
          }
          
          snapshot.agents = agents;
          snapshot.availableAgentsCount = that.getAvailableAgentsCount(agents);

          if (request.requester) {      //.toObject()????
            snapshot.requester = request.requester;
          }
          if (request.lead) {
            snapshot.lead = request.lead;
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
                // agents: agents,                
            
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
                preflight: preflight,
                channel: channel,
                location: location,
                snapshot: snapshot
              });
                    

              winston.debug('newRequest.',newRequest);

          
              //cacheinvalidation
              return newRequest.save(function(err, savedRequest) {
                  if (err) {
                    winston.error('RequestService error for method createWithIdAndRequester for newRequest' + JSON.stringify(newRequest), err);
                    return reject(err);
                  }
              
              
                  winston.verbose("Request created",savedRequest.toObject());

                  var endDate = new Date();
                  winston.verbose("Performance Request created in millis: " + endDate-startDate);
                                    
                  requestEvent.emit('request.create.simple', savedRequest);
                  
                  return resolve(savedRequest);
                  
                });
            // }).catch(function(err){
            //   return reject(err);
            // });


    });
  }





  //DEPRECATED. USED ONLY IN SAME TESTS
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

          var status =  RequestConstants.UNASSIGNED;
          var assigned_operator_id;
          var participants = [];
          var participantsAgents = [];
          var participantsBots = [];
          var hasBot = false;

          var assigned_at = undefined;
          if (result.operators && result.operators.length>0) {
            assigned_operator_id = result.operators[0].id_user;
            status =  RequestConstants.ASSIGNED;

            var assigned_operator_idString = assigned_operator_id.toString();
            participants.push(assigned_operator_idString);

            // botprefix
            if (assigned_operator_idString.startsWith("bot_")) {
             hasBot = true;

             // botprefix
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
                    winston.error('RequestService error for method createWithId for newRequest' + JSON.stringify(newRequest), err);
                    return reject(err);
                  }
              
              
                  winston.verbose("Request created",savedRequest.toObject());
                                
                  
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
      .populate('lead')
      .populate('department')
      .populate('participatingBots')
      .populate('participatingAgents')  
      .populate({path:'requester',populate:{path:'id_user'}})
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
          // TODO REENABLE SERVED
          // request.status = RequestConstants.SERVED;
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


  closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify) {

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

      //  un utente può chiudere se appartiene a participatingAgents oppure meglio agents del progetto?
      
     
       return that.changeStatusByRequestId(request_id, id_project, 1000).then(function(updatedRequest) {
         //  qui1000
        // return that.changeStatusByRequestId(request_id, id_project, {closed:true}).then(function(updatedRequest) {
          

            // winston.debug("updatedRequest", updatedRequest);
            return messageService.getTranscriptByRequestId(request_id, id_project).then(function(transcript) {
             // winston.debug("transcript", transcript);
              return that.updateTrascriptByRequestId(request_id, id_project, transcript).then(function(updatedRequest) {


                if (skipStatsUpdate) {
                  // TODO test it
                  winston.verbose("Request closed with skipStatsUpdate and with id: " + updatedRequest.id);
                  winston.debug("Request closed ", updatedRequest);
                  //TODO ?? requestEvent.emit('request.update', updatedRequest);
                  requestEvent.emit('request.close', updatedRequest);
                  requestEvent.emit('request.close.extended', {request: updatedRequest, notify: notify});
                  return resolve(updatedRequest);
                }
                
                return that.setClosedAtByRequestId(request_id, id_project, new Date().getTime()).then(function(updatedRequest) {
                  
                    winston.verbose("Request closed with id: " + updatedRequest.id);
                    winston.debug("Request closed ", updatedRequest);
                    //TODO ?? requestEvent.emit('request.update', updatedRequest);
                    requestEvent.emit('request.close', updatedRequest);
                    requestEvent.emit('request.close.extended', {request: updatedRequest, notify: notify});

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

          if (request.status == RequestConstants.ASSIGNED || request.status == RequestConstants.UNASSIGNED 
            // TODO REENABLE SERVED
            // || request.status == RequestConstants.SERVED
            ) {
            winston.debug("request already open"); 
            return resolve(request);
          }

          if (request.participants.length>0) {
            request.status =  RequestConstants.ASSIGNED;
            // assigned_at?
          } else {
            request.status =  RequestConstants.UNASSIGNED;
          }
          // TODO REENABLE SERVED
          // attento served qui????forse no

            //cacheinvalidation
          request.save(function(err, savedRequest) {
            if (err) {
              winston.error("Error saving reopened the request", err);
              return reject(err);              
            }          
            
            requestEvent.emit('request.update', savedRequest);
            requestEvent.emit("request.update.comment", {comment:"REOPEN",request:savedRequest});
            requestEvent.emit('request.reopen', savedRequest);

            winston.verbose("Request reopened", savedRequest);

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
          winston.verbose('Request members '+ oldParticipants+ ' already equal to ' + newparticipants + ' for request_id '+ request_id + ' and id_project '+ id_project);
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
            // botprefix
            if (newparticipant.startsWith("bot_")) {   
              hasBot = true;               
              // botprefix          
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
          request.status =  RequestConstants.ASSIGNED; 
          // assigned_at?
        } else {
          request.status =  RequestConstants.UNASSIGNED;
        }
        
        request.waiting_time = undefined //reset waiting_time on reroute ????
        // TODO REENABLE SERVED
        // qui potrebbe essere che la richiesta era served con i vecchi agenti e poi facendo setParticipants si riporta ad assigned o unassigned perdendo l'informazione di served

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

          // botprefix
          if (member.startsWith("bot_")) {
            request.hasBot = true;

          // botprefix
            var assigned_operator_idStringBot = member.replace("bot_","");
            winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);            
            request.participantsBots.push(assigned_operator_idStringBot);
           }else {
            request.participantsAgents.push(member);
            request.hasBot = false; //???
           }


          if (request.participants.length>0) {          
            request.status =  RequestConstants.ASSIGNED;
            var assigned_at = Date.now();
            request.assigned_at = assigned_at;
          } else {
            request.status =  RequestConstants.UNASSIGNED;
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
    winston.debug("member", member);

    return new Promise(function (resolve, reject)  {



      if (member==undefined) {
        var err = "removeParticipantByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }

    
      return Request        
        .findOne({request_id: request_id, id_project: id_project})
        // .populate('participatingAgents')  //for abandoned_by_project_users
        // qui cache    
        .exec( async (err, request) => {
        
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

          // botprefix
          if (member.startsWith("bot_")) {
            request.hasBot = false;
            // botprefix
            var assigned_operator_idStringBot = member.replace("bot_","");
            winston.debug("assigned_operator_idStringBot:"+assigned_operator_idStringBot);            
            
            var indexParticipantsBots = request.participantsBots.indexOf(assigned_operator_idStringBot);
            request.participantsBots.splice(indexParticipantsBots, 1);
           }else {
            var indexParticipantsAgents = request.participantsAgents.indexOf(member);
            request.participantsAgents.splice(indexParticipantsAgents, 1);


           
           try {

             //request.attributes.abandoned_by_project_users  start TODO move to routing-queue
             if (!request.attributes) {
              winston.debug("removeParticipantByRequestId request.attributes is empty. creating it");
              request.attributes = {};
            }
            if (!request.attributes.abandoned_by_project_users) {
              winston.debug("removeParticipantByRequestId request.attributes.abandoned_by_project_users is empty. creating it");
              request.attributes.abandoned_by_project_users = {}
            }

            /*
            winston.info("request.participatingAgents",request.participatingAgents);
            var pu = request.participatingAgents.find(projectUser => {
              console.log(projectUser);
              projectUser.id_user.toString() === member
            });
            winston.verbose("pu",pu);
            */

            var pu = await Project_user.findOne({ id_user: member, id_project:id_project }).exec();
            winston.debug("pu",pu);

            request.attributes.abandoned_by_project_users[pu._id] = new Date().getTime();
            winston.debug("removeParticipantByRequestId request.attributes.abandoned_by_project_users", request.attributes.abandoned_by_project_users);
            //request.attributes.abandoned_by_project_users  end

           }catch(e) {
              winston.error("Error getting removeParticipantByRequestId pu",e);
           }
           

          }


          if (request.status!= RequestConstants.CLOSED) {//don't change the status to 100 or 200 for closed request to resolve this bug. if the agent leave the group and after close the request the status became 100, but if the request is closed the state (1000) must not be changed
                // qui1000 ????
          if (request.participants.length>0) {             
            request.status =  RequestConstants.ASSIGNED;
            // assignet_at?
          } else {
            request.status =  RequestConstants.UNASSIGNED;
          }
        }
         
        request.markModified('attributes');
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
          winston.verbose('Request member '+ member+ ' already not found for request_id '+ request_id + ' and id_project '+ id_project);

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
          winston.debug("empty attributes")
          request.attributes = {};
        }
  
        winston.debug(" req attributes", request.attributes)
          
          Object.keys(data).forEach(function(key) {
            var val = data[key];
            winston.debug("data attributes "+key+" " +val)
            request.attributes[key] = val;
          });     
          
          winston.debug(" req attributes", request.attributes)
  
          // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
          request.markModified('attributes');
          
          //cacheinvalidation
          return request.save(function (err, savedRequest) {
            if (err) {
              winston.error("error saving request attributes",err)
              return reject({msg:"Error saving request attributes",err:err});
            }
            winston.verbose(" saved request attributes",savedRequest.toObject())
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

        winston.debug("index", index);

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
