'use strict';

var departmentService = require('../services/departmentService');
var Request = require("../models/request");
var Project_user = require("../models/project_user");
var Project = require("../models/project");
var messageService = require('../services/messageService');
const requestEvent = require('../event/requestEvent');
const leadEvent = require('../event/leadEvent');
var winston = require('../config/winston');
var RequestConstants = require("../models/requestConstants");
var requestUtil = require("../utils/requestUtil");
var cacheUtil = require("../utils/cacheUtil");
var arrayUtil = require("../utils/arrayUtil");
var cacheEnabler = require("../services/cacheEnabler");
var UIDGenerator = require("../utils/UIDGenerator");
const { TdCache } = require('../utils/TdCache');
const { QuoteManager } = require('./QuoteManager');

let tdCache = new TdCache({
    host: process.env.CACHE_REDIS_HOST,
    port: process.env.CACHE_REDIS_PORT,
    password: process.env.CACHE_REDIS_PASSWORD
});
tdCache.connect();
let qm = new QuoteManager({ tdCache: tdCache });

class RequestService {

  constructor() {
    this.listen();
  }

  listen() {
    // 12 marzo 2024 I disabled these two functions due to performance problems for a chatbot created by Sponziello "Community bots Sendinblue Hubspot Qapla)"
    // this.updateSnapshotLead();
    // this.sendMessageUpdateLead();
  }

      // 12 marzo 2024 I disabled these two functions due to performance problems for a chatbot created by Sponziello "Community bots Sendinblue Hubspot Qapla)"
  // updateSnapshotLead() {
  //   leadEvent.on('lead.update', function (lead) {
  //     setImmediate(() => {
  //       winston.debug("updateSnapshotLead on lead.update ", lead);

  //       Request.updateMany({ lead: lead._id, id_project: lead.id_project }, { "$set": { "snapshot.lead": lead } }, function (err, updates) {
  //         if (err) {
  //           winston.error("Error updating requests updateSnapshotLead", err);
  //           return 0;
  //         }
  //         winston.verbose("updateSnapshotLead updated for " + updates.nModified + " request")
  //         requestEvent.emit('request.update.snapshot.lead', { lead: lead, updates: updates });
  //         return;
  //       });
  //       // Request.find({lead: lead._id, id_project: lead.id_project}, function(err, requests) {

  //       //     if (err) {
  //       //         winston.error("Error getting request by lead", err);
  //       //         return 0;
  //       //     }
  //       //     if (!requests || (requests && requests.length==0)) {
  //       //         winston.warn("No request found for lead id " +lead._id );
  //       //         return 0;
  //       //     }

  //       //     requests.forEach(function(request) {


  //       //     });

  //       // });


  //     });
  //   });
  // }


  // 12 marzo 2024 I disabled these two functions due to performance problems for a chatbot created by Sponziello "Community bots Sendinblue Hubspot Qapla)"
  // sendMessageUpdateLead() {
  //   leadEvent.on('lead.fullname.email.update', function (lead) {
  //     winston.debug("lead.fullname.email.update ");
  //     // leadEvent.on('lead.update', function(lead) {

  //     setImmediate(() => {
  //       winston.debug("sendMessageUpdateLead on lead.update ", lead);

  //       Request.find({ lead: lead._id, id_project: lead.id_project }, function (err, requests) {

  //         if (err) {
  //           winston.error("Error getting sendMessageUpdateLead request by lead", err);
  //           return 0;
  //         }
  //         if (!requests || (requests && requests.length == 0)) {
  //           winston.warn("sendMessageUpdateLead No request found for lead id " + lead._id);
  //           return 0;
  //         }

  //         // winston.info("sendMessageUpdateLead requests ", requests);

  //         requests.forEach(function (request) {

  //           winston.debug("sendMessageUpdateLead request ", request);

  //           // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language)
  //           messageService.send(
  //             'system',
  //             'Bot',
  //             // lead.fullname,                                
  //             request.request_id,
  //             "Lead updated",
  //             request.id_project,
  //             'system',
  //             {
  //               subtype: "info/support",
  //               "updateconversation": false,
  //               messagelabel: { key: "LEAD_UPDATED" },
  //               updateUserEmail: lead.email,
  //               updateUserFullname: lead.fullname
  //             },
  //             undefined,
  //             request.language

  //           );

  //         });

  //       });

  //     });
  //   });
  // }


  getAvailableAgentsCount(agents) {

    var project_users_available = agents.filter(function (projectUser) {
      if (projectUser.user_available == true) {
        return true;
      }
    });
    winston.debug('++ AVAILABLE PROJECT USERS count ', project_users_available)

    if (project_users_available && project_users_available.length > 0) {
      return project_users_available.length;
    } else {
      return 0;
    }


  }

  //change create with this
  routeInternal(request, departmentid, id_project, nobot) {
    var that = this;

    return new Promise(function (resolve, reject) {

      var context = { request: request };

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

        if (result.operators && result.operators.length > 0) {
          assigned_operator_id = result.operators[0].id_user;

          status = RequestConstants.ASSIGNED;

          var assigned_operator_idString = assigned_operator_id.toString();
          participants.push(assigned_operator_idString);

          // botprefix
          if (assigned_operator_idString.startsWith("bot_")) {
            hasBot = true;

            // botprefix
            var assigned_operator_idStringBot = assigned_operator_idString.replace("bot_", "");
            participantsBots.push(assigned_operator_idStringBot);
          } else {
            participantsAgents.push(assigned_operator_idString);
            hasBot = false; //??
          }

          assigned_at = Date.now();
        }
        winston.debug("routeInternal assigned_operator_id: " + assigned_operator_id);
        winston.debug("routeInternal status: " + status);



        //  cosi modifica la request originale forse devi fare il clone?????
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


      }).catch(function (err) {
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
      winston.debug("nobot:" + nobot);

      let q = Request
        .findOne({ request_id: request_id, id_project: id_project });

      // if (cacheEnabler.request) {  //(node:60837) UnhandledPromiseRejectionWarning: VersionError: No matching document found for id "633efe246a6cc0eda5732684" version 0 modifiedPaths "status, participants, participantsAgents, department, assigned_at, snapshot, snapshot.department, snapshot.department.updatedAt, snapshot.agents"
      //   q.cache(cacheUtil.defaultTTL, id_project+":requests:request_id:"+request_id+":simple")      //request_cache
      //   winston.debug('request cache enabled');
      // }
      return q.exec(function (err, request) {

        if (err) {
          winston.error(err);
          return reject(err);
        }

        winston.debug('request return', request);

        // cambia var in let

        //it is important to clone here
        var requestBeforeRoute = Object.assign({}, request.toObject());
        winston.debug("requestBeforeRoute", requestBeforeRoute);

        var beforeParticipants = requestBeforeRoute.participants;
        winston.debug("beforeParticipants: ", beforeParticipants);

        return that.routeInternal(request, departmentid, id_project, nobot).then(function (routedRequest) {

          winston.debug("after routeInternal", routedRequest);
          // winston.info("requestBeforeRoute.participants " +requestBeforeRoute.request_id , requestBeforeRoute.participants);
          // console.log("routedRequest.participants " +routedRequest.request_id , routedRequest.participants);
          winston.debug("requestBeforeRoute.status:" + requestBeforeRoute.status);
          winston.debug("routedRequest.status:" + routedRequest.status);

          let beforeDepartmentId;
          if (requestBeforeRoute.department) { //requestBeforeRoute.department can be empty for internal ticket
            beforeDepartmentId = requestBeforeRoute.department.toString();
            winston.debug("beforeDepartmentId:" + beforeDepartmentId);
          }

          let afterDepartmentId;
          if (routedRequest.department) {
            afterDepartmentId = routedRequest.department.toString();
            winston.debug("afterDepartmentId:" + afterDepartmentId);
          }


          if (requestBeforeRoute.status === routedRequest.status &&
            beforeDepartmentId === afterDepartmentId &&
            requestUtil.arraysEqual(beforeParticipants, routedRequest.participants)) {

            winston.verbose("Request " + request.request_id + " contains already the same participants at the same request status. Routed to the same participants");

            if (no_populate === "true" || no_populate === true) {
              winston.debug("no_populate is true");
              return resolve(request);
            }

            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                winston.debug("requestComplete", requestComplete);

                return resolve(requestComplete);
              });
          }

          //cacheinvalidation
          return routedRequest.save(function (err, savedRequest) {
            // https://stackoverflow.com/questions/54792749/mongoose-versionerror-no-matching-document-found-for-id-when-document-is-being
            //return routedRequest.update(function(err, savedRequest) {
            if (err) {
              winston.error('Error saving the request. ', { err: err, routedRequest: routedRequest });
              return reject(err);
            }

            winston.debug("after save savedRequest", savedRequest);

            return savedRequest
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {

                // return Request       //to populate correctly i must re-exec the query
                // .findById(savedRequest.id)
                // .populate('lead')
                // .populate('department')
                // .populate('participatingBots')
                // .populate('participatingAgents')  
                // .populate({path:'requester',populate:{path:'id_user'}})
                // .exec( function(err, requestComplete) {


                if (err) {
                  winston.error('Error populating the request.', err);
                  return reject(err);
                }

                winston.verbose("Request routed", requestComplete.toObject());


                var oldParticipants = beforeParticipants;
                winston.debug("oldParticipants ", oldParticipants);

                let newParticipants = requestComplete.participants;
                winston.debug("newParticipants ", newParticipants);

                var removedParticipants = oldParticipants.filter(d => !newParticipants.includes(d));
                winston.debug("removedParticipants ", removedParticipants);

                var addedParticipants = newParticipants.filter(d => !oldParticipants.includes(d));
                winston.debug("addedParticipants ", addedParticipants);


                requestEvent.emit('request.update', requestComplete);
                requestEvent.emit("request.update.comment", { comment: "REROUTE", request: requestComplete });//Deprecated
                requestEvent.emit("request.updated", { comment: "REROUTE", request: requestComplete, patch: { removedParticipants: removedParticipants, addedParticipants: addedParticipants } });

                requestEvent.emit('request.participants.update', {
                  beforeRequest: request,
                  removedParticipants: removedParticipants,
                  addedParticipants: addedParticipants,
                  request: requestComplete
                });

                requestEvent.emit('request.department.update', requestComplete); //se req ha bot manda messaggio \welcome

                winston.debug("here end");

                return resolve(requestComplete);
              });



          });

        }).catch(function (err) {
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

      let q = Request
        .findOne({ request_id: request_id, id_project: id_project });

      if (cacheEnabler.request) {
        q.cache(cacheUtil.defaultTTL, id_project + ":requests:request_id:" + request_id + ":simple")      //request_cache
        winston.debug('request cache enabled');
      }

      return q.exec(function (err, request) {

        if (err) {
          winston.error(err);
          return reject(err);
        }

        winston.debug('request cache simple 3', request);

        winston.debug("here reroute1 ");

        //  Cannot read property 'toString' of undefined at /usr/src/app/services/requestService.js:404:61 at /usr/src/app/node_modules/cachegoose/out/extend-query.js:44:13 at Command.cb [as callback] (/usr/src/app/node_modules/cacheman-redis/node/index.js:142:9) at normal_reply (/usr/src/app/node_modules/redis/index.js:655:21) at RedisClient.return_reply (/usr/src/app/node_modules/redis/index.js:753:9) at JavascriptRedisParser.returnReply (/usr/src/app/node_modules/redis/index.js:138:18) at JavascriptRedisParser.execute (/usr/src/app/node_modules/redis-parser/lib/parser.js:544:14) at Socket.<anonymous> (/usr/src/app/node_modules/redis/index.js:219:27) at Socket.emit (events.js:314:20) at addChunk (_stream_readable.js:297:12) at readableAddChunk (_stream_readable.js:272:9) at Socket.Readable.push (_stream_readable.js:213:10) at TCP.onStreamRead (internal/stream_base_commons.js:188:23) {"date":"Tue Mar 21 2023 18:45:47 GMT+0000 (Coordinated Unive
        if (request.department === undefined) {
          winston.error("Request with request_id " + request_id + "  has empty department. So I can't reroute");
          return reject("Request with request_id " + request_id + "  has empty department. So I can't reroute");
        }


        return that.route(request_id, request.department.toString(), id_project, nobot).then(function (routedRequest) {

          var endDate = new Date();
          winston.verbose("Performance Request reroute in millis: " + endDate - startDate);

          return resolve(routedRequest);
        }).catch(function (err) {
          return reject(err);
        });

      });
    });
  }



  createWithRequester(project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight) {

    var request_id = 'support-group-' + id_project + "-" + UIDGenerator.generate();
    winston.debug("request_id: " + request_id);

    return this.createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight);
  }

  createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {

    var request = {
      request_id: request_id, project_user_id: project_user_id, lead_id: lead_id, id_project: id_project, first_text: first_text,
      departmentid: departmentid, sourcePage: sourcePage, language: language, userAgent: userAgent, status: status, createdBy: createdBy,
      attributes: attributes, subject: subject, preflight: preflight, channel: channel, location: location
    };

    return this.create(request);
  };

  async create(request) {

    var startDate = new Date();

    if (!request.createdAt) {
      request.createdAt = new Date();
    }


      var request_id = request.request_id;
      var project_user_id = request.project_user_id;
      var lead_id = request.lead_id;
      var id_project = request.id_project;

      var first_text = request.first_text;

      //removed for ticket
      // // lascia che sia nico a fare il replace...certo tu devi fare il test che tutto sia ok quindi dopo demo
      // var first_text;  
      // if (request.first_text) {  //first_text can be empty for type image
      //   first_text = request.first_text.replace(/[\n\r]+/g, ' '); //replace new line with space
      // }

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

      var tags = request.tags;
      var notes = request.notes;
      var priority = request.priority;

      var auto_close = request.auto_close;

      var followers = request.followers;
      let createdAt = request.createdAt;

      if (!departmentid) {
        departmentid = 'default';
      }

      if (!createdBy) {
        if (project_user_id) {
          createdBy = project_user_id;
        } else {
          createdBy = "system";
        }

      }

      var that = this;

      return new Promise(async (resolve, reject) => {

        let q = Project.findOne({ _id: request.id_project, status: 100 });
        if (cacheEnabler.project) {
          q.cache(cacheUtil.longTTL, "projects:id:" + request.id_project)  //project_cache
          winston.debug('project cache enabled for /project detail');
        }
        q.exec(async function (err, p) {
          if (err) {
            winston.error('Error getting project ', err);
          }
          if (!p) {
            winston.warn('Project not found ');
          }
    
    
          let payload = {
            project: p,
            request: request
          }
    
          let available = await qm.checkQuote(p, request, 'requests');
          if (available === false) {
            winston.info("Requests limits reached for project " + p._id)
            return false;
          }
        

        var context = {
          request: {
            request_id: request_id, project_user_id: project_user_id, lead_id: lead_id, id_project: id_project,
            first_text: first_text, departmentid: departmentid, sourcePage: sourcePage, language: language, userAgent: userAgent, status: status,
            createdBy: createdBy, attributes: attributes, subject: subject, preflight: preflight, channel: channel, location: location,
            participants: participants, tags: tags, notes: notes,
            priority: priority, auto_close: auto_close, followers: followers
          }
        };

        winston.debug("context", context);

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
          // console.log("************* after get operator: "+new Date().toISOString());

          winston.debug("getOperators", result);
        } catch (err) {
          return reject(err);
        }



        agents = result.agents;

        if (status == 50) {
          // skip assignment
          if (participants.length == 0) {
            dep_id = result.department._id;
          }
        } else {

          if (participants.length == 0) {
            if (result.operators && result.operators.length > 0) {
              participants.push(result.operators[0].id_user.toString());
            }
            // for preflight it is important to save agents in req for trigger. try to optimize it
            dep_id = result.department._id;

          }

          if (participants.length > 0) {

            status = RequestConstants.ASSIGNED;

            // botprefix
            if (participants[0].startsWith("bot_")) {

              hasBot = true;
              winston.debug("hasBot:" + hasBot);

              // botprefix
              var assigned_operator_idStringBot = participants[0].replace("bot_", "");
              winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);

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

        // console.log("result.agents",result.agents);
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
          participantsAgents: participantsAgents,
          participantsBots: participantsBots,
          hasBot: hasBot,
          department: dep_id,
          // agents: agents,                

          //others
          sourcePage: sourcePage,
          language: language,
          userAgent: userAgent,
          assigned_at: assigned_at,

          attributes: attributes,
          //standard
          id_project: id_project,
          createdBy: createdBy,
          updatedBy: createdBy,
          preflight: preflight,
          channel: channel,
          location: location,
          snapshot: snapshot,
          tags: tags,
          notes: notes,
          priority: priority,
          auto_close: auto_close,
          followers: followers,
          createdAt: createdAt
        });

        winston.debug('newRequest.', newRequest);


        //cacheinvalidation
        return newRequest.save( async function (err, savedRequest) {

          if (err) {
            winston.error('RequestService error for method createWithIdAndRequester for newRequest' + JSON.stringify(newRequest), err);
            return reject(err);
          }


          winston.debug("Request created", savedRequest.toObject());

          var endDate = new Date();
          winston.verbose("Performance Request created in millis: " + endDate - startDate);

          requestEvent.emit('request.create.simple', savedRequest);
          requestEvent.emit('request.create.quote', payload);;

          return resolve(savedRequest);

        });
        // }).catch(function(err){
        //   return reject(err);
        // });

      })
      });
    
  }


  async _create(request) {

    var startDate = new Date();

    if (!request.createdAt) {
      request.createdAt = new Date();
    }

    
    var request_id = request.request_id;
    var project_user_id = request.project_user_id;
    var lead_id = request.lead_id;
    var id_project = request.id_project;

    var first_text = request.first_text;

    //removed for ticket
    // // lascia che sia nico a fare il replace...certo tu devi fare il test che tutto sia ok quindi dopo demo
    // var first_text;  
    // if (request.first_text) {  //first_text can be empty for type image
    //   first_text = request.first_text.replace(/[\n\r]+/g, ' '); //replace new line with space
    // }

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

    var tags = request.tags;
    var notes = request.notes;
    var priority = request.priority;

    var auto_close = request.auto_close;

    var followers = request.followers;
    let createdAt = request.createdAt;

    if (!departmentid) {
      departmentid = 'default';
    }

    if (!createdBy) {
      if (project_user_id) {
        createdBy = project_user_id;
      } else {
        createdBy = "system";
      }

    }

    var that = this;

    return new Promise(async (resolve, reject) => {

      var context = {
        request: {
          request_id: request_id, project_user_id: project_user_id, lead_id: lead_id, id_project: id_project,
          first_text: first_text, departmentid: departmentid, sourcePage: sourcePage, language: language, userAgent: userAgent, status: status,
          createdBy: createdBy, attributes: attributes, subject: subject, preflight: preflight, channel: channel, location: location,
          participants: participants, tags: tags, notes: notes,
          priority: priority, auto_close: auto_close, followers: followers
        }
      };

      winston.debug("context", context);

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
        // console.log("************* after get operator: "+new Date().toISOString());

        winston.debug("getOperators", result);
      } catch (err) {
        return reject(err);
      }



      agents = result.agents;

      if (status == 50) {
        // skip assignment
        if (participants.length == 0) {
          dep_id = result.department._id;
        }
      } else {

        if (participants.length == 0) {
          if (result.operators && result.operators.length > 0) {
            participants.push(result.operators[0].id_user.toString());
          }
          // for preflight it is important to save agents in req for trigger. try to optimize it
          dep_id = result.department._id;

        }

        if (participants.length > 0) {

          status = RequestConstants.ASSIGNED;

          // botprefix
          if (participants[0].startsWith("bot_")) {

            hasBot = true;
            winston.debug("hasBot:" + hasBot);

            // botprefix
            var assigned_operator_idStringBot = participants[0].replace("bot_", "");
            winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);

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

      // console.log("result.agents",result.agents);
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
        participantsAgents: participantsAgents,
        participantsBots: participantsBots,
        hasBot: hasBot,
        department: dep_id,
        // agents: agents,                

        //others
        sourcePage: sourcePage,
        language: language,
        userAgent: userAgent,
        assigned_at: assigned_at,

        attributes: attributes,
        //standard
        id_project: id_project,
        createdBy: createdBy,
        updatedBy: createdBy,
        preflight: preflight,
        channel: channel,
        location: location,
        snapshot: snapshot,
        tags: tags,
        notes: notes,
        priority: priority,
        auto_close: auto_close,
        followers: followers,
        createdAt: createdAt
      });

      winston.debug('newRequest.', newRequest);


      //cacheinvalidation
      return newRequest.save(function (err, savedRequest) {

        if (err) {
          winston.error('RequestService error for method createWithIdAndRequester for newRequest' + JSON.stringify(newRequest), err);
          return reject(err);
        }


        winston.debug("Request created", savedRequest.toObject());

        var endDate = new Date();
        winston.verbose("Performance Request created in millis: " + endDate - startDate);

        requestEvent.emit('request.create.simple', savedRequest);

        let q = Project.findOne({ _id: request.id_project, status: 100 });
        if (cacheEnabler.project) {
          q.cache(cacheUtil.longTTL, "projects:id:" + request.id_project)  //project_cache
          winston.debug('project cache enabled for /project detail');
        }
        q.exec(async function (err, p) {
          if (err) {
            winston.error('Error getting project ', err);
          }
          if (!p) {
            winston.warn('Project not found ');
          }
          //TODO REMOVE settings from project
          let payload = {
            project: p,
            request: request
          }

          requestEvent.emit('request.create.quote', payload);;
          
        });

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
      departmentid = 'default';
    }

    if (!createdBy) {
      createdBy = requester_id;
    }

    var that = this;

    return new Promise(function (resolve, reject) {

      var context = {
        request: {
          request_id: request_id, requester_id: requester_id, id_project: id_project,
          first_text: first_text, departmentid: departmentid, sourcePage: sourcePage, language: language, userAgent: userAgent, status: status,
          createdBy: createdBy, attributes: attributes
        }
      };

      // getOperators(departmentid, projectid, nobot, disableWebHookCall, context)

      return departmentService.getOperators(departmentid, id_project, false, undefined, context).then(function (result) {

        // winston.debug("getOperators", result);

        var status = RequestConstants.UNASSIGNED;
        var assigned_operator_id;
        var participants = [];
        var participantsAgents = [];
        var participantsBots = [];
        var hasBot = false;

        var assigned_at = undefined;
        if (result.operators && result.operators.length > 0) {
          assigned_operator_id = result.operators[0].id_user;
          status = RequestConstants.ASSIGNED;

          var assigned_operator_idString = assigned_operator_id.toString();
          participants.push(assigned_operator_idString);

          // botprefix
          if (assigned_operator_idString.startsWith("bot_")) {
            hasBot = true;

            // botprefix
            var assigned_operator_idStringBot = assigned_operator_idString.replace("bot_", "");
            winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);
            participantsBots.push(assigned_operator_idStringBot);

          } else {
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
          participantsAgents: participantsAgents,
          participantsBots: participantsBots,
          hasBot: hasBot,
          department: result.department._id,
          agents: result.agents,
          //availableAgents: result.available_agents,

          // assigned_operator_id:  result.assigned_operator_id,

          //others
          sourcePage: sourcePage,
          language: language,
          userAgent: userAgent,
          assigned_at: assigned_at,
          attributes: attributes,
          //standard
          id_project: id_project,
          createdBy: createdBy,
          updatedBy: createdBy
        });


        // winston.debug('newRequest.',newRequest);



        //cacheinvalidation
        return newRequest.save(function (err, savedRequest) {
          if (err) {
            winston.error('RequestService error for method createWithId for newRequest' + JSON.stringify(newRequest), err);
            return reject(err);
          }


          winston.verbose("Request created", savedRequest.toObject());


          requestEvent.emit('request.create.simple', savedRequest);

          return resolve(savedRequest);

        });
      }).catch(function (err) {
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
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { status: newstatus }, { new: true, upsert: false })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, updatedRequest) {

          if (err) {
            winston.error(err);
            return reject(err);
          }

          requestEvent.emit('request.update', updatedRequest); //deprecated
          requestEvent.emit("request.update.comment", { comment: "STATUS_CHANGE", request: updatedRequest });//Deprecated
          requestEvent.emit("request.updated", { comment: "STATUS_CHANGE", request: updatedRequest, patch: { status: newstatus } });
          //TODO emit request.clone or reopen also 

          return resolve(updatedRequest);
        });
    });

  }

  changeFirstTextAndPreflightByRequestId(request_id, id_project, first_text, preflight) {


    return new Promise(function (resolve, reject) {
      winston.debug("changeFirstTextAndPreflightByRequestId", request_id);
      // winston.debug("request_id", request_id);
      // winston.debug("newstatus", newstatus);

      if (!first_text) {
        winston.error(err);
        return reject({ err: " Error changing first text. The field first_text is empty" });
      }

      return Request
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { first_text: first_text, preflight: preflight }, { new: true, upsert: false })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, updatedRequest) {

          if (err) {
            winston.error(err);
            return reject(err);
          }


          requestEvent.emit('request.update.preflight', updatedRequest); //archive to audit log
          requestEvent.emit('request.update', updatedRequest);
          requestEvent.emit("request.update.comment", { comment: "FIRSTTEXT_PREFLIGHT_CHANGE", request: updatedRequest });//Deprecated
          requestEvent.emit("request.updated", { comment: "FIRSTTEXT_PREFLIGHT_CHANGE", request: updatedRequest, patch: { first_text: first_text, preflight: preflight } });

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
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { first_text: first_text }, { new: true, upsert: false })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, updatedRequest) {

          if (err) {
            winston.error(err);
            return reject(err);
          }
          requestEvent.emit('request.update', updatedRequest);
          requestEvent.emit("request.update.comment", { comment: "FIRSTTEXT_CHANGE", request: updatedRequest });//Deprecated
          requestEvent.emit("request.updated", { comment: "FIRSTTEXT_CHANGE", request: updatedRequest, patch: { first_text: first_text } });

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
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { preflight: preflight }, { new: true, upsert: false })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, updatedRequest) {

          if (err) {
            winston.error(err);
            return reject(err);
          }
          requestEvent.emit('request.update', updatedRequest);
          requestEvent.emit("request.update.comment", { comment: "PREFLIGHT_CHANGE", request: updatedRequest });//Deprecated
          requestEvent.emit("request.updated", { comment: "PREFLIGHT_CHANGE", request: updatedRequest, patch: { preflight: preflight } });

          return resolve(updatedRequest);
        });
    });

  }

  setClosedAtByRequestId(request_id, id_project, closed_at, closed_by) {

    return new Promise(function (resolve, reject) {
      // winston.debug("request_id", request_id);
      // winston.debug("newstatus", newstatus);

      return Request
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { closed_at: closed_at, closed_by: closed_by }, { new: true, upsert: false })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, updatedRequest) {
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
        .findOneAndUpdate({ request_id: request_id, id_project: id_project }, { $inc: { 'messages.messages_count': 1 } }, { new: true, upsert: false }, function (err, updatedRequest) {
          if (err) {
            winston.error(err);
            return reject(err);
          }
          winston.debug("Message count +1");
          return resolve(updatedRequest);
        });
    });

  }

  updateWaitingTimeByRequestId(request_id, id_project, enable_populate) {

    return new Promise(function (resolve, reject) {
      // winston.debug("request_id", request_id);
      // winston.debug("newstatus", newstatus);

      let q = Request
        .findOne({ request_id: request_id, id_project: id_project });

      if (enable_populate == true) {
        winston.debug("updateWaitingTimeByRequestId  enable_populate");

        q.populate('lead')
          .populate('department')
          .populate('participatingBots')
          .populate('participatingAgents')
          .populate({ path: 'requester', populate: { path: 'id_user' } });
      }


      // if (cacheEnabler.request) {  //attention this cache is not usable bacause cacheoose don't support populate without .lean.. so if cached populated field is not returned with cacheoose, updateWaitingTime is only used in chat21webhook but i thik it is important for messages route
      //   q.cache(cacheUtil.defaultTTL, id_project+":requests:request_id:"+request_id)           //request_cache
      //   winston.debug('request cache enabled');
      // }
      q.exec(function (err, request) {
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
          // return resolve(request.save());
          request.save(function (err, savedRequest) {
            if (err) {
              return reject(err);
            }
            requestEvent.emit('request.update', savedRequest);

            return resolve(savedRequest);
          });



        } else {
          return resolve(request);
        }

      });

    });

  }


  closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by, force) {

    var that = this;
    return new Promise(function (resolve, reject) {
      // winston.debug("request_id", request_id);

      if (force == undefined) {
        winston.debug("force is undefined ");
        force = false;
      }
      //  else {
      //   winston.info("force is: " + force);
      //  }

      return Request
        .findOne({ request_id: request_id, id_project: id_project })

        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, request) {


          if (err) {
            winston.error("Error getting closing request ", err);
            return reject(err);
          }
          if (!request) {
            winston.error("Request not found for request_id " + request_id + " and id_project " + id_project);
            return reject({ "success": false, msg: "Request not found for request_id " + request_id + " and id_project " + id_project });
          }
          if (force == false && request.status == RequestConstants.CLOSED) {
            // qui1000
            //  if (request.statusObj.closed) {
            winston.debug("Request already closed for request_id " + request_id + " and id_project " + id_project);
            return resolve(request);
          }

          winston.debug("sono qui");

          //  un utente può chiudere se appartiene a participatingAgents oppure meglio agents del progetto?


          return that.changeStatusByRequestId(request_id, id_project, 1000).then(function (updatedRequest) {
            //  qui1000
            // return that.changeStatusByRequestId(request_id, id_project, {closed:true}).then(function(updatedRequest) {


            // winston.debug("updatedRequest", updatedRequest);
            return messageService.getTranscriptByRequestId(request_id, id_project).then(function (transcript) {
              // winston.debug("transcript", transcript);
              return that.updateTrascriptByRequestId(request_id, id_project, transcript).then(function (updatedRequest) {


                if (skipStatsUpdate) {
                  // TODO test it
                  winston.verbose("Request closed with skipStatsUpdate and with id: " + updatedRequest.id);
                  winston.debug("Request closed ", updatedRequest);
                  //TODO ?? requestEvent.emit('request.update', updatedRequest);
                  requestEvent.emit('request.close', updatedRequest);
                  requestEvent.emit('request.close.extended', { request: updatedRequest, notify: notify });
                  return resolve(updatedRequest);
                }

                // setClosedAtByRequestId(request_id, id_project, closed_at, closed_by)
                return that.setClosedAtByRequestId(request_id, id_project, new Date().getTime(), closed_by).then(function (updatedRequest) {

                  winston.verbose("Request closed with id: " + updatedRequest.id);
                  winston.debug("Request closed ", updatedRequest);
                  //TODO ?? requestEvent.emit('request.update', updatedRequest);
                  requestEvent.emit('request.close', updatedRequest);
                  requestEvent.emit('request.close.extended', { request: updatedRequest, notify: notify });

                  return resolve(updatedRequest);
                });



              });
            });
          }).catch(function (err) {
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
        .findOne({ request_id: request_id, id_project: id_project })

        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, request) {


          if (err) {
            winston.error("Error getting reopened request ", err);
            return reject(err);
          }
          if (!request) {
            winston.error("Request not found for request_id " + request_id + " and id_project " + id_project);
            return reject({ "success": false, msg: "Request not found for request_id " + request_id + " and id_project " + id_project });
          }

          if (request.status == RequestConstants.ASSIGNED || request.status == RequestConstants.UNASSIGNED
            // TODO REENABLE SERVED
            // || request.status == RequestConstants.SERVED
          ) {
            winston.debug("request already open");
            return resolve(request);
          }

          if (request.participants.length > 0) {
            request.status = RequestConstants.ASSIGNED;
            // assigned_at?
          } else {
            request.status = RequestConstants.UNASSIGNED;
          }
          // TODO REENABLE SERVED
          // attento served qui????forse no

          //cacheinvalidation
          request.save(function (err, savedRequest) {
            if (err) {
              winston.error("Error saving reopened the request", err);
              return reject(err);
            }

            requestEvent.emit('request.update', savedRequest);
            requestEvent.emit("request.update.comment", { comment: "REOPEN", request: savedRequest });//Deprecated
            requestEvent.emit("request.updated", { comment: "REOPEN", request: savedRequest, patch: { status: savedRequest.status } });

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
      return Request.findOneAndUpdate({ request_id: request_id, id_project: id_project }, { transcript: transcript }, { new: true, upsert: false }, function (err, updatedRequest) {
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
      return Request.findOne({ request_id: request_id, id_project: id_project }, function (err, request) {
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

      if (isArray == false) {
        winston.error('setParticipantsByRequestId error  newparticipants is not an array for request_id ' + request_id + ' and id_project ' + id_project);
        return reject('setParticipantsByRequestId error  newparticipants is not an array for request_id ' + request_id + ' and id_project ' + id_project);
      }

      return Request

        .findOne({ request_id: request_id, id_project: id_project })
        // qui cache ok
        .exec(function (err, request) {
          if (err) {
            winston.error("Error setParticipantsByRequestId", err);
            return reject(err);
          }
          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }
          var oldParticipants = request.participants;
          winston.debug('oldParticipants', oldParticipants);
          winston.debug('newparticipants', newparticipants);

          if (requestUtil.arraysEqual(oldParticipants, newparticipants)) {
            //if (oldParticipants === newparticipants) {
            winston.verbose('Request members ' + oldParticipants + ' already equal to ' + newparticipants + ' for request_id ' + request_id + ' and id_project ' + id_project);
            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                return resolve(requestComplete);
              });

          }

          request.participants = newparticipants;

          var newparticipantsAgents = [];
          var newparticipantsBots = [];


          if (newparticipants && newparticipants.length > 0) {
            var hasBot = false;
            newparticipants.forEach(newparticipant => {
              // botprefix
              if (newparticipant.startsWith("bot_")) {
                hasBot = true;
                // botprefix          
                var assigned_operator_idStringBot = newparticipant.replace("bot_", "");
                winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);
                newparticipantsBots.push(assigned_operator_idStringBot);

              } else {
                newparticipantsAgents.push(newparticipant);
              }
            });
            request.hasBot = hasBot;
          }

          request.participantsAgents = newparticipantsAgents;
          request.participantsBots = newparticipantsBots;





          if (request.participants.length > 0) {
            request.status = RequestConstants.ASSIGNED;
            // assigned_at?
          } else {
            request.status = RequestConstants.UNASSIGNED;
          }

          request.waiting_time = undefined //reset waiting_time on reroute ????
          // TODO REENABLE SERVED
          // qui potrebbe essere che la richiesta era served con i vecchi agenti e poi facendo setParticipants si riporta ad assigned o unassigned perdendo l'informazione di served

          //cacheinvalidation
          return request.save(function (err, updatedRequest) {
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
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {


                if (err) {
                  winston.error("Error getting setParticipantsByRequestId", err);
                  return reject(err);
                }

                winston.debug("oldParticipants ", oldParticipants);

                let newParticipants = requestComplete.participants;
                winston.debug("newParticipants ", newParticipants);

                var removedParticipants = oldParticipants.filter(d => !newParticipants.includes(d));
                winston.debug("removedParticipants ", removedParticipants);

                var addedParticipants = newParticipants.filter(d => !oldParticipants.includes(d));
                winston.debug("addedParticipants ", addedParticipants);


                requestEvent.emit('request.update', requestComplete);
                requestEvent.emit("request.update.comment", { comment: "PARTICIPANTS_SET", request: requestComplete });//Deprecated
                requestEvent.emit("request.updated", { comment: "PARTICIPANTS_SET", request: requestComplete, patch: { removedParticipants: removedParticipants, addedParticipants: addedParticipants } });

                requestEvent.emit('request.participants.update', {
                  beforeRequest: request,
                  removedParticipants: removedParticipants,
                  addedParticipants: addedParticipants,
                  request: requestComplete
                });

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

      if (member == undefined) {
        var err = "addParticipantByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }

      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        // qui cache         
        .exec(function (err, request) {
          if (err) {
            winston.error("Error adding participant ", err);
            return reject(err);
          }
          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }

          winston.debug("assigned_operator here1");

          // return Request.findById(id).then(function (request) {
          if (request.participants.indexOf(member) == -1) {
            request.participants.push(member);

            // botprefix
            if (member.startsWith("bot_")) {
              request.hasBot = true;

              // botprefix
              var assigned_operator_idStringBot = member.replace("bot_", "");
              winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);
              request.participantsBots.push(assigned_operator_idStringBot);
            } else {
              request.participantsAgents.push(member);
              request.hasBot = false; //???
            }


            if (request.participants.length > 0) {
              request.status = RequestConstants.ASSIGNED;
              var assigned_at = Date.now();
              request.assigned_at = assigned_at;
            } else {
              request.status = RequestConstants.UNASSIGNED;
            }
            // check error here
            //cacheinvalidation
            request.save(function (err, savedRequest) {
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
                .populate({ path: 'requester', populate: { path: 'id_user' } })
                .execPopulate(function (err, requestComplete) {

                  if (err) {
                    winston.error("Error getting addParticipantByRequestId", err);
                    return reject(err);
                  }


                  winston.debug("populated", requestComplete);

                  requestEvent.emit('request.update', requestComplete);
                  requestEvent.emit("request.update.comment", { comment: "PARTICIPANT_ADD", request: requestComplete });//Deprecated
                  requestEvent.emit("request.updated", { comment: "PARTICIPANT_ADD", request: requestComplete, patch: { member: member } });
                  requestEvent.emit('request.participants.join', { member: member, request: requestComplete });

                  return resolve(requestComplete);
                });
            });
            // qui assignetat
          } else {
            winston.debug('Request member ' + member + ' already added for request_id ' + request_id + ' and id_project ' + id_project);
            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
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

    return new Promise(function (resolve, reject) {



      if (member == undefined) {
        var err = "removeParticipantByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }


      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        // .populate('participatingAgents')  //for abandoned_by_project_users
        // qui cache    
        .exec(async (err, request) => {

          if (err) {
            winston.error("Error removing participant ", err);
            return reject(err);
          }

          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
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
              var assigned_operator_idStringBot = member.replace("bot_", "");
              winston.debug("assigned_operator_idStringBot:" + assigned_operator_idStringBot);

              var indexParticipantsBots = request.participantsBots.indexOf(assigned_operator_idStringBot);
              request.participantsBots.splice(indexParticipantsBots, 1);
            } else {
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

                var pu = await Project_user.findOne({ id_user: member, id_project: id_project }).exec();
                winston.debug("pu", pu);

                request.attributes.abandoned_by_project_users[pu._id] = new Date().getTime();
                winston.debug("removeParticipantByRequestId request.attributes.abandoned_by_project_users", request.attributes.abandoned_by_project_users);
                //request.attributes.abandoned_by_project_users  end

              } catch (e) {
                winston.error("Error getting removeParticipantByRequestId pu", e);
              }


            }


            if (request.status != RequestConstants.CLOSED) {//don't change the status to 100 or 200 for closed request to resolve this bug. if the agent leave the group and after close the request the status became 100, but if the request is closed the state (1000) must not be changed
              // qui1000 ????
              if (request.participants.length > 0) {
                request.status = RequestConstants.ASSIGNED;
                // assignet_at?
              } else {
                request.status = RequestConstants.UNASSIGNED;
              }
            }

            request.markModified('attributes');
            // winston.debug(" request",  request);
            //cacheinvalidation
            return request.save(function (err, savedRequest) {
              if (err) {
                winston.error("Error saving removed participant ", err);
                return reject(err);
              }

              return savedRequest
                .populate('lead')
                .populate('department')
                .populate('participatingBots')
                .populate('participatingAgents')
                .populate({ path: 'requester', populate: { path: 'id_user' } })
                .execPopulate(function (err, requestComplete) {

                  if (err) {
                    winston.error("Error getting removed participant ", err);
                    return reject(err);
                  }


                  requestEvent.emit('request.update', requestComplete);
                  requestEvent.emit("request.update.comment", { comment: "PARTICIPANT_REMOVE", request: requestComplete });//Deprecated
                  requestEvent.emit("request.updated", { comment: "PARTICIPANT_REMOVE", request: requestComplete, patch: { member: member } });
                  requestEvent.emit('request.participants.leave', { member: member, request: requestComplete });


                  return resolve(requestComplete);

                });
            });


          } else {
            winston.verbose('Request member ' + member + ' already not found for request_id ' + request_id + ' and id_project ' + id_project);

            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                return resolve(requestComplete);
              });
          }

        });
    });
  }



  updateAttributesByRequestId(request_id, id_project, attributes) {
    var data = attributes;

    Request.findOne({ "request_id": request_id, id_project: id_project })
      .populate('lead')
      .populate('department')
      .populate('participatingBots')
      .populate('participatingAgents')
      .populate({ path: 'requester', populate: { path: 'id_user' } })
      .exec(function (err, request) {
        if (err) {
          return reject(err);
        }
        if (!request) {
          return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
        }


        if (!request.attributes) {
          winston.debug("empty attributes")
          request.attributes = {};
        }

        winston.debug(" req attributes", request.attributes)

        Object.keys(data).forEach(function (key) {
          var val = data[key];
          winston.debug("data attributes " + key + " " + val)
          request.attributes[key] = val;
        });

        winston.debug(" req attributes", request.attributes)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        request.markModified('attributes');

        //cacheinvalidation
        return request.save(function (err, savedRequest) {
          if (err) {
            winston.error("error saving request attributes", err)
            return reject({ msg: "Error saving request attributes", err: err });
          }
          winston.verbose(" saved request attributes", savedRequest.toObject())
          requestEvent.emit("request.update", savedRequest);
          requestEvent.emit("request.update.comment", { comment: "ATTRIBUTES_UPDATE", request: savedRequest });//Deprecated
          requestEvent.emit("request.updated", { comment: "ATTRIBUTES_UPDATE", request: savedRequest, patch: { attributes: data } });

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

      if (tag == undefined) {
        var err = "addTagByRequestId error, tag field is null";
        winston.error(err);
        return reject(err);
      }


      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, request) {
          if (err) {
            winston.error("Error adding tag ", err);
            return reject(err);
          }
          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }


          // return Request.findById(id).then(function (request) {
          if (request.tags.indexOf(tag) == -1) {
            request.tags.push(tag);
            // check error here

            //cacheinvalidation
            request.save(function (err, savedRequest) {
              if (err) {
                winston.error(err);
                return reject(err);
              }

              requestEvent.emit('request.update', savedRequest);
              requestEvent.emit("request.update.comment", { comment: "TAG_ADD", request: savedRequest });        //Deprecated
              requestEvent.emit("request.updated", { comment: "TAG_ADD", request: savedRequest, patch: { tags: tag } });


              // allora neanche qui participatingAgent è ok?
              return resolve(savedRequest);
            });

            // qui assignetat
          } else {
            winston.debug('Request tag ' + tag + ' already added for request_id ' + request_id + ' and id_project ' + id_project);
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



      if (tag == undefined) {
        var err = "removeTagByRequestId error, tag field is null";
        winston.error(err);
        return reject(err);
      }


      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        .populate('lead')
        .populate('department')
        .populate('participatingBots')
        .populate('participatingAgents')
        .populate({ path: 'requester', populate: { path: 'id_user' } })
        .exec(function (err, request) {

          if (err) {
            winston.error("Error removing tag ", err);
            return reject(err);
          }

          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }

          // var index = request.tags.indexOf(tag);
          var index = request.tags.findIndex(t => t.tag === tag);

          winston.debug("index", index);

          if (index > -1) {
            request.tags.splice(index, 1);
            // winston.debug(" request.participants",  request.participants);    


            //cacheinvalidation
            request.save(function (err, savedRequest) {

              if (!err) {
                requestEvent.emit('request.update', savedRequest);
                requestEvent.emit("request.update.comment", { comment: "TAG_REMOVE", request: savedRequest });//Deprecated
                requestEvent.emit("request.updated", { comment: "TAG_REMOVE", request: savedRequest, patch: { tags: tag } });

              }

              // allora neanche qui participatingAgent è ok?

              return resolve(savedRequest);

            });


          } else {
            winston.info('Request tag ' + tag + ' already not found for request_id ' + request_id + ' and id_project ' + id_project);
            return resolve(request);
          }


        });
    });
  }








  addFollowerByRequestId(request_id, id_project, member) {
    winston.debug("request_id: " + request_id);
    winston.debug("id_project: " + id_project);
    winston.debug("addFollowerByRequestId member: " + member);



    //TODO control if member is a valid project_user of the project
    // validate member is string
    return new Promise(function (resolve, reject) {

      if (member == undefined) {
        var err = "addFollowerByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }

      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        // qui cache         
        .exec(function (err, request) {
          if (err) {
            winston.error("Error adding follower ", err);
            return reject(err);
          }
          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }

          winston.debug("assigned_operator here1");

          // return Request.findById(id).then(function (request) {
          if (request.followers.indexOf(member) == -1) {
            request.followers.push(member);

            request.save(function (err, savedRequest) {
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
                // .populate('followers')  
                .populate({ path: 'requester', populate: { path: 'id_user' } })
                .execPopulate(function (err, requestComplete) {

                  if (err) {
                    winston.error("Error getting addFollowerByRequestId", err);
                    return reject(err);
                  }


                  winston.debug("populated", requestComplete);

                  requestEvent.emit('request.update', requestComplete);
                  requestEvent.emit("request.update.comment", { comment: "FOLLOWER_ADD", request: requestComplete });//Deprecated
                  requestEvent.emit("request.updated", { comment: "FOLLOWER_ADD", request: requestComplete, patch: { member: member } });
                  requestEvent.emit('request.followers.join', { member: member, request: requestComplete });

                  return resolve(requestComplete);
                });
            });
            // qui assignetat
          } else {
            winston.debug('Request member ' + member + ' already added for request_id ' + request_id + ' and id_project ' + id_project);
            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              // .populate('followers')  
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                return resolve(requestComplete);
              });
          }

        });
    });
  }





  setFollowersByRequestId(request_id, id_project, newfollowers) {

    //TODO validate participants
    // validate if array of string newparticipants
    return new Promise(function (resolve, reject) {

      var isArray = Array.isArray(newfollowers);

      if (isArray == false) {
        winston.error('setFollowersByRequestId error  newfollowers is not an array for request_id ' + request_id + ' and id_project ' + id_project);
        return reject('setFollowersByRequestId error  newfollowers is not an array for request_id ' + request_id + ' and id_project ' + id_project);
      }

      return Request

        .findOne({ request_id: request_id, id_project: id_project })
        // qui cache ok
        .exec(function (err, request) {
          if (err) {
            winston.error("Error setFollowersByRequestId", err);
            return reject(err);
          }
          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }
          var oldfollowers = request.followers;
          winston.debug('oldParticipants', oldfollowers);
          winston.debug('newparticipants', newfollowers);

          if (requestUtil.arraysEqual(oldfollowers, newfollowers)) {
            //if (oldParticipants === newparticipants) {
            winston.verbose('Request members ' + oldfollowers + ' already equal to ' + newfollowers + ' for request_id ' + request_id + ' and id_project ' + id_project);
            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                return resolve(requestComplete);
              });

          }

          request.followers = newfollowers;

          //cacheinvalidation
          return request.save(function (err, updatedRequest) {
            // dopo save non aggiorna participating
            if (err) {
              winston.error("Error setFollowersByRequestId", err);
              return reject(err);
            }

            return updatedRequest
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {


                if (err) {
                  winston.error("Error getting setFollowersByRequestId", err);
                  return reject(err);
                }

                winston.debug("oldfollowers ", oldfollowers);

                requestEvent.emit('request.update', requestComplete);
                requestEvent.emit("request.update.comment", { comment: "FOLLOWERS_SET", request: requestComplete });//Deprecated
                requestEvent.emit("request.updated", { comment: "FOLLOWERS_SET", request: requestComplete, patch: {} });

                // requestEvent.emit('request.followers.update', {beforeRequest:request, 
                //             removedParticipants:removedParticipants, 
                //             addedParticipants:addedParticipants,
                //             request:requestComplete});

                return resolve(requestComplete);
              });
          });

        });


    });
  }






  removeFollowerByRequestId(request_id, id_project, member) {
    winston.debug("request_id", request_id);
    winston.debug("id_project", id_project);
    winston.debug("member", member);

    return new Promise(function (resolve, reject) {



      if (member == undefined) {
        var err = "removeFollowerByRequestId error, member field is null";
        winston.error(err);
        return reject(err);
      }


      return Request
        .findOne({ request_id: request_id, id_project: id_project })
        // .populate('participatingAgents')  //for abandoned_by_project_users
        // qui cache    
        .exec(async (err, request) => {

          if (err) {
            winston.error("Error removing follower ", err);
            return reject(err);
          }

          if (!request) {
            winston.error('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
            return reject('Request not found for request_id ' + request_id + ' and id_project ' + id_project);
          }

          var index = request.followers.indexOf(member);
          winston.debug("index", index);

          if (index > -1) {
            request.followers.splice(index, 1);
            // winston.debug(" request.participants",  request.participants);


            // winston.debug(" request",  request);
            //cacheinvalidation
            return request.save(function (err, savedRequest) {
              if (err) {
                winston.error("Error saving removed follower ", err);
                return reject(err);
              }

              return savedRequest
                .populate('lead')
                .populate('department')
                .populate('participatingBots')
                .populate('participatingAgents')
                // .populate('followers')  
                .populate({ path: 'requester', populate: { path: 'id_user' } })
                .execPopulate(function (err, requestComplete) {

                  if (err) {
                    winston.error("Error getting removed follower ", err);
                    return reject(err);
                  }


                  requestEvent.emit('request.update', requestComplete);
                  requestEvent.emit("request.update.comment", { comment: "FOLLOWER_REMOVE", request: requestComplete });//Deprecated
                  requestEvent.emit("request.updated", { comment: "FOLLOWER_REMOVE", request: requestComplete, patch: { member: member } });
                  requestEvent.emit('request.followers.leave', { member: member, request: requestComplete });


                  return resolve(requestComplete);

                });
            });


          } else {
            winston.verbose('Request member ' + member + ' already not found for request_id ' + request_id + ' and id_project ' + id_project);

            return request
              .populate('lead')
              .populate('department')
              .populate('participatingBots')
              .populate('participatingAgents')
              // .populate('followers')   
              .populate({ path: 'requester', populate: { path: 'id_user' } })
              .execPopulate(function (err, requestComplete) {
                return resolve(requestComplete);
              });
          }

        });
    });
  }








}


var requestService = new RequestService();


module.exports = requestService;

