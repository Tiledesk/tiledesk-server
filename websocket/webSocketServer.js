var Message = require("../models/message");
var User = require("../models/user");
var Project_user = require("../models/project_user");
var Project = require("../models/project");
var EventModel = require("../pubmodules/events/event");
var Request = require("../models/request");
var Message = require("../models/message");
var Faq_kb = require("../models/faq_kb");
const WebSocket = require('ws');
var url = require('url');
var validtoken = require('../middleware/valid-token');
var messageEvent = require("../event/messageEvent");
var eventEvent = require("../pubmodules/events/eventEvent");
var requestEvent = require("../event/requestEvent");
var botEvent = require("../event/botEvent");
var jwt = require('jsonwebtoken');
var config = require('../config/database'); // get db config file
var winston = require('../config/winston');
var roleChecker = require('../middleware/has-role');
const PubSub = require('./pubsub');
const authEvent = require('../event/authEvent');
var ProjectUserUtil = require("../utils/project_userUtil");
var cacheUtil = require('../utils/cacheUtil');
var mongoose = require('mongoose');
const requestConstants = require("../models/requestConstants");
var RoleConstants = require('../models/roleConstants');

let configSecretOrPubicKay = process.env.GLOBAL_SECRET || config.secret;

var pKey = process.env.GLOBAL_SECRET_OR_PUB_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecretOrPubicKay = pKey.replace(/\\n/g, '\n');
}

var cacheEnabler = require("../services/cacheEnabler");


var lastRequestsLimit = process.env.WS_HISTORY_REQUESTS_LIMIT || 100;
winston.debug('lastRequestsLimit:' + lastRequestsLimit);

lastRequestsLimit = Number(lastRequestsLimit);

var messagesLimit = process.env.WS_HISTORY_MESSAGES_LIMIT || 300;
winston.debug('messagesLimit:' + messagesLimit);

var lastEventsLimit = process.env.WS_HISTORY_EVENTS_LIMIT || 20;
winston.debug('lastEventsLimit:' + lastEventsLimit);

var websocketServerPath = process.env.WS_SERVER_PATH || '/';
winston.debug('websocketServerPath:' + websocketServerPath);



class WebSocketServer {

  constructor() {
    this.clientsSubscriptions = {};
  }


  // https://hackernoon.com/nodejs-web-socket-example-tutorial-send-message-connect-express-set-up-easy-step-30347a2c5535
  // https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61
  init(server) {

    winston.info('Starting websocket on path: ' + websocketServerPath);

    //var wss = new WebSocket.Server({ port: 40510 });
    //var wss = new WebSocket.Server({ port: 40510 , path: "/messages" });
    //var wss = new WebSocket.Server({  port: 80 ,path: "/messages" });
    //  var wss = new WebSocket.Server({  server: server,path: "/messages" });

    var wss = new WebSocket.Server({
      server: server,
      path: websocketServerPath,
      verifyClient: function (info, cb) {
        //console.log('info.req', info.req);
        // var token = info.req.headers.Authorization
        let urlParsed = url.parse(info.req.url, true);
        // console.log('urlParsed', urlParsed);
        var queryParameter = urlParsed.query;
        winston.debug('queryParameter', queryParameter);

        var token = queryParameter.token;
        winston.debug('token:' + token);
        winston.debug('configSecretOrPubicKay:' + configSecretOrPubicKay);


        if (!token)
          cb(false, 401, 'Unauthorized');
        else {
          token = token.replace('JWT ', '');
          jwt.verify(token, configSecretOrPubicKay, function (err, decoded) {  //pub_jwt pp_jwt
            if (err) {
              winston.error('WebSocket error verifing websocket jwt token ', err);
              return cb(false, 401, 'Unauthorized');
            } else {
              // uncomment it
              const identifier = decoded._id || decoded._doc._id;


              winston.debug('valid token:' + identifier);
              // roleChecker.hasRoleAsPromise().then(function(project_user) {
              //   winston.debug('hasRoleAsPromise project_user',project_user);
              // winston.debug('ok websocket');

              User.findOne({ _id: identifier, status: 100 }, 'email firstname lastname emailverified id')     //TODO user_cache_here ma attento select.. ATTENTO SERVER SELECT??
                //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+identifier)    //user_cache
                .exec(function (err, user) {


                  if (err) {
                    // console.log("BasicStrategy err.stop");
                    return winston.error('error verifing websocket jwt token. User find error ', err);
                  }
                  if (!user) {
                    winston.verbose('websocket user not found with id : ' + identifier);
                    return cb(false, 401, 'Unauthorized');
                  }

                  // info.req.user = decoded;
                  info.req.user = user;
                  winston.debug('info.req.user', info.req.user.toObject());
                  return cb(true);

                });


              // }).catch(function(err){
              //   winston.error('hasRoleAsPromise err',err);
              //   cb(false, 401, err.msg);
              // });                     

            }
          })

        }
      }
    });


    var onConnectCallback = async function (client, req) {
      winston.debug('onConnectCallback ');
      return new Promise(function (resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }

    var onDisconnectCallback = async function (subscript, id) {
      winston.debug('onDisconnectCallback: ' + subscript + ":" + id);
      return new Promise(function (resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }


    //tilebaseMess.send('{ "action": "publish", "payload": { "topic": "/apps/123/requests/sendid/conversations/RFN", "message":{"sender_id":"sendid","sender_fullname":"SFN", "recipient_id":"RFN", "recipient_fullname":"RFN","text":"hi","app_id":"123"}}}');
    var onPublishCallback = async function (publishTopic, publishMessage, from) {
      winston.debug("onPublish topic: " + publishTopic + " from: " + from, publishMessage);
      return new Promise(function (resolve, reject) {
        return resolve("ok");
      });

    }

    var onMessageCallback = async function (id, message) {
      winston.debug('onMessageCallback ', id, message);
      return new Promise(function (resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }

    // tilebase.send('{ "action": "subscribe", "payload": { "topic": "/app1/requests"}}');

    var onSubscribeCallback = async function (topic, clientId, req) {
      return new Promise(function (resolve, reject) {
        winston.debug('onSubscribeCallback :' + topic + " " + clientId);

        winston.debug(' req.user._id: ' + req.user);

        if (!topic) {
          winston.error('WebSocket - Error getting  topic. Topic can t be null');
          return reject('WebSocket - Error getting  topic. Topic can t be null');
        }
        var urlSub = topic.split('/');
        winston.debug('urlSub: ' + urlSub);

        if (!urlSub || (urlSub && urlSub.length == 0)) {
          winston.error('WebSocket - Error getting  topic. Topic is not properly configured');
          return reject('WebSocket - Error getting  topic. Topic is not properly configured');
        }
        // Error getting Project Cast to ObjectId failed for value "N7VJlLZ1" (type string) at path "_id" for model "project" {"kind":"ObjectId","path":"_id","reason":{},"stack":"CastError: Cast to ObjectId failed for value \"N7VJlLZ1\" (type string) at path \"_id\" for model \"project\"\n at model.Query.exec (/usr/src/app/node_modules/mongoose/lib/query.js:4498:21)\n at /usr/src/app/websocket/webSocketServer.js:180:14\n at new Promise (<anonymous>)\n at Object.onSubscribeCallback [as onSubscribe] (/usr/src/app/websocket/webSocketServer.js:167:14)\n at PubSub.handleReceivedClientMessage (/usr/src/app/websocket/pubsub.js:358:57)\n at runMicrotasks (<anonymous>)\n at processTicksAndRejections (internal/process/task_queues.js:97:5)","stringValue":"\"N7VJlLZ1\"","value":"N7VJlLZ1","valueType":"string"}

        var projectId = urlSub[1];
        winston.debug('projectId: ' + projectId);
        
        let q = Project.findOne({ _id: projectId, status: 100 })

        if (cacheEnabler.project) {
          q.cache(cacheUtil.defaultTTL, "projects:id:" + projectId) //project_cache
          winston.debug('project cache enabled for websocket');
        }

        return q.exec(function (err, project) {
          if (err) {
            winston.error('WebSocket - Error getting  Project', err);
            return reject(err);
          }

          if (!project) {
            winston.warn('WebSocket project not found for projectid ' + projectId);
            return reject({ err: 'project not found for projectid ' + projectId });
          }

          if (topic.endsWith('/messages')) {
            winston.debug(' messages: ');

            var recipientId = urlSub[3];
            winston.debug('recipientId: ' + recipientId);
            // winston.debug(' req.: ',req);


            Project_user.findOne({ id_project: projectId, id_user: req.user._id, $or: [{ "role": "agent" }, { "role": "admin" }, { "role": "owner" }], status: "active" })
              //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":project_users:role:teammate:"+req.user._id)
              .exec(function (err, projectuser) {
                if (err) {
                  winston.error('WebSocket error getting Project_user', err);
                  return reject(err);
                }
                if (!projectuser) {
                  winston.verbose('WebSocket project_user not found for user id ' + req.user._id + ' and projectid ' + projectId);
                  return reject({ err: 'Project_user not found for user id ' + req.user._id + ' and projectid ' + projectId });
                }

                var queryRequest = { id_project: projectId, request_id: recipientId };

                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('queryRequest admin: ' + JSON.stringify(queryRequest));
                } else {
                  queryRequest["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }]
                  winston.debug('queryRequest agent: ' + JSON.stringify(queryRequest));
                }

                // requestcachefarequi nocachepopulatereqired
                Request.findOne(queryRequest)
                  .exec(function (err, request) {

                    if (err) {
                      winston.error('WebSocket Error finding request for onSubscribeCallback', err);
                      return reject(err);
                    }
                    if (!request) {
                      winston.verbose('WebSocket Request query not found for user id ' + req.user._id + ' and projectid ' + projectId);
                      return reject({ err: 'Request query not found for user id ' + req.user._id + ' and projectid ' + projectId });
                    }

                    winston.debug('found request for onSubscribeCallback', request);



                    var query = { id_project: projectId, recipient: recipientId };
                    winston.debug('query : ' + JSON.stringify(query));

                    Message.find(query).sort({ createdAt: 'asc' })
                      .limit(messagesLimit).exec(function (err, messages) {

                        if (err) {
                          winston.error('WebSocket Error finding message for onSubscribeCallback', err);
                          return reject(err);
                        }
                        winston.debug('onSubscribeCallback find', messages);


                        return resolve({
                          publishFunction: function () {
                            // handlePublishMessageToClientId (topic, message, clientId, method) {
                            pubSubServer.handlePublishMessageToClientId(topic, messages, clientId, "CREATE");
                          }
                        });

                      });
                  });

              });

          } else if (topic.endsWith('/requests')) {

            winston.debug('req.user._id: ' + req.user._id);
            // winston.debug(' req.: ',req);

            winston.debug('find project_user');


            Project_user.findOne({ id_project: projectId, id_user: req.user._id, $or: [{ "role": "agent" }, { "role": "admin" }, { "role": "owner" }], status: "active" })
              //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":project_users:role:teammate:"+req.user._id)
              .exec(function (err, projectuser) {
                if (err) {
                  winston.error('WebSocket error getting Project_user', err);
                  return reject(err);
                }
                if (!projectuser) {
                  winston.verbose('WebSocket Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId);
                  return reject({ err: 'Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId });
                }
                winston.debug('projectuser', projectuser.toObject());

                // db.getCollection('requests').find({"id_project":"5e15bef09877c800176d217f","status":{"$lt":1000},"$or":[{"agents":{"id_user":"5ddd30bff0195f0017f72c6d"}},{"participants":"5ddd30bff0195f0017f72c6d"}]})
                // pubblica dopo toni
                var query = { "id_project": projectId, "status": { $lt: 1000, $gt: 50, $ne: 150 }, preflight: false, "draft": { $in: [false, null] } };
                // add hasBot:false

                // var query = {"id_project":projectId, "status": { $lt: 1000, $gt: 50 }, $or:[ {preflight:false}, { preflight : { $exists: false } } ] };

                //  qui1000
                // var query = { id_project: projectId, statusObj: {closed:false, preflight:false} };

                var cacheUserId;
                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('query admin: ' + JSON.stringify(query));
                  cacheUserId = "/admin-owner";
                } else {
                  query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }]
                  winston.debug('query agent: ' + JSON.stringify(query));
                  cacheUserId = "/agent/" + req.user.id;
                }

                //cacheimportantehere
                // requestcachefarequi populaterequired

                //  TODO  proviamo a fare esempio con 100 agenti tutti
                // elimina capo availableAgents (chiedi a Nico se gli usa altrimenti metti a select false)
                var startDate = new Date();
                Request.find(query)
                  .select("+snapshot.agents")
                  // .populate('lead') //??
                  // .populate('department')
                  // .populate('participatingBots')
                  // .populate('participatingAgents')  
                  // .populate({path:'requester',populate:{path:'id_user'}})
                  .sort({ updatedAt: 'desc' })
                  .limit(lastRequestsLimit)
                  // DISABLED 23Marzo2021 per problema request.snapshot.requester.isAuthenticated = undefined 
                  .lean() //https://www.tothenew.com/blog/high-performance-find-query-using-lean-in-mongoose-2/ https://stackoverflow.com/questions/33104136/mongodb-mongoose-slow-query-when-fetching-10k-documents
                  //@DISABLED_CACHE .cache(cacheUtil.queryTTL, projectId+":requests:query:status-50-1000:preflight-false:select_snapshot_agents:"+cacheUserId) 
                  .exec(function (err, requests) {

                    if (err) {
                      winston.error('WebSocket Error finding request for onSubscribeCallback', err);
                      return reject(err);
                    }
                    winston.debug('found requests for onSubscribeCallback', requests);

                    if (requests && requests.length > 0) {
                      requests.forEach(request => {

                        request.id = request._id; //importante


                        if (request.lead) {
                          //    request.requester_id =    request.lead._id; //parla con NICO di questo
                          request.requester_id = request.lead;
                        } else {
                          request.requester_id = null;
                        }

                        if (request.snapshot.requester) {
                          if (request.snapshot.requester.role === RoleConstants.GUEST) {
                            request.snapshot.requester.isAuthenticated = false;
                          } else {
                            request.snapshot.requester.isAuthenticated = true;
                          }

                        }

                        // attento qui
                        if (request.snapshot.agents && request.snapshot.agents.length > 0) {
                          var agentsnew = [];
                          request.snapshot.agents.forEach(a => {
                            agentsnew.push({ id_user: a.id_user })  //remove unnecessary request.agents[].project_user fields. keep only id_user
                          });
                          request.snapshot.agents = agentsnew;
                        }




                      });
                    }

                    var endDate = new Date();
                    winston.debug('ws count: ' + query + ' ' + requests.length + ' ' + startDate + ' ' + endDate + ' ' + endDate - startDate)
                    return resolve({
                      publishFunction: function () {
                        // handlePublishMessageToClientId (topic, message, clientId, method) {
                        pubSubServer.handlePublishMessageToClientId(topic, requests, clientId, "CREATE");
                      }
                    });


                  });

              });


          } else if (topic.indexOf('/project_users/users/') > -1) {

            var userId = urlSub[4];
            winston.debug('userId: ' + userId);

            //check if current user can see the data
            Project_user.findOne({ id_project: projectId, id_user: req.user._id, $or: [{ "role": "agent" }, { "role": "admin" }, { "role": "owner" }], status: "active" })
              //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":project_users:role:teammate:"+req.user._id)
              .exec(function (err, currentProjectuser) {
                if (err) {
                  winston.error('WebSocket error getting  Project_user', err);
                  return reject(err);
                }
                if (!currentProjectuser) {
                  winston.verbose('WebSocket Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId);
                  return reject({ err: 'Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId });
                }
                winston.debug('currentProjectuser', currentProjectuser.toObject());


                var isObjectId = mongoose.Types.ObjectId.isValid(userId);
                winston.debug("isObjectId:" + isObjectId);

                var query = { id_project: projectId, status: "active" };
                winston.debug(' query: ', query);

                if (isObjectId) {
                  query.id_user = userId;
                } else {
                  query.uuid_user = userId;
                }

                Project_user.findOne(query)
                  // @DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":project_users:users:"+userId)
                  .exec(function (err, projectuser) {
                    if (err) {
                      winston.error('WebSocket error getting  Project_user', err);
                      return reject(err);
                    }
                    if (!projectuser) {
                      winston.verbose('WebSocket Project_user not found with user id ' + userId + ' and projectid ' + projectId);
                      return reject({ err: 'Project_user not found with user id ' + userId + ' and projectid ' + projectId });
                    }


                    var pu = projectuser.toJSON();
                    pu.isBusy = ProjectUserUtil.isBusy(projectuser, project.settings && project.settings.max_agent_assigned_chat);


                    return resolve({
                      publishFunction: function () {
                        // handlePublishMessageToClientId (topic, message, clientId, method) {
                        pubSubServer.handlePublishMessageToClientId(topic, pu, clientId, "CREATE");
                      }
                    });

                  });




              });


            // tilebase.send('{ "action": "subscribe", "payload": { "topic": "/5e71139f61dd040bc9594cee/project_users/5e71139f61dd040bc9594cef"}}')
            //curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"user_available":false}' http://localhost:3000/5e71139f61dd040bc9594cee/project_users/
          } else if (topic.indexOf('/project_users/') > -1) {


            // TODO aggiungere tutti i prject users

            var puId = urlSub[3];
            winston.debug('puId: ' + puId);

            //var query = { _id: puId, id_project: projectId};
            var query = { _id: puId, id_project: projectId, id_user: req.user._id, $or: [{ "role": "agent" }, { "role": "admin" }, { "role": "owner" }], status: "active" };
            winston.debug(' query: ', query);

            Project_user.findOne(query)
              // @DISABLED_CACHE  .cache(cacheUtil.defaultTTL, projectId+":project_users:"+puId)
              .exec(function (err, projectuser) {
                if (err) {
                  winston.error('WebSocket error getting  Project_user', err);
                  return reject(err);
                }
                if (!projectuser) {
                  winston.verbose('WebSocket Project_user not found with project_user id ' + puId + ' and projectid ' + projectId);
                  return reject({ err: 'Project_user not found with project_user id ' + puId + ' and projectid ' + projectId });
                }


                var pu = projectuser.toJSON();
                pu.isBusy = ProjectUserUtil.isBusy(projectuser, project.settings && project.settings.max_agent_assigned_chat);


                return resolve({
                  publishFunction: function () {
                    // handlePublishMessageToClientId (topic, message, clientId, method) {
                    pubSubServer.handlePublishMessageToClientId(topic, pu, clientId, "CREATE");
                  }
                });

              });
          }

          else if (topic.indexOf('/events/') > -1) {

            var puId = urlSub[3];
            winston.debug('puId: ' + puId);

            var eventName = urlSub[4];
            winston.debug('eventName: ' + eventName);

            var query = { project_user: puId, id_project: projectId };
            if (eventName) {
              query.name = eventName;
            }
            //TODO esclude status volatile events
            winston.debug(' query: ', query);

            EventModel.find(query)
              // @DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":events:"+puId)
              .sort({ createdAt: 'desc' })
              .limit(lastEventsLimit)
              .exec(function (err, events) {
                if (err) {
                  winston.error('WebSocket error getting  events', err);
                  return reject(err);
                }


                return resolve({
                  publishFunction: function () {
                    // handlePublishMessageToClientId (topic, message, clientId, method) {
                    pubSubServer.handlePublishMessageToClientId(topic, events, clientId, "CREATE");
                  }
                });

              })

          } else if (topic.indexOf('/bots/') > -1) {

            // var puId = urlSub[3];
            // winston.info('puId: '+puId);

            winston.debug('urlSub: ' + urlSub);

            var botId = urlSub[3];
            winston.debug('botId: ' + botId);

            var query = { _id: botId, id_project: projectId };

            winston.debug(' query: ', query);

            Faq_kb.findOne(query)
              .exec(function (err, bot) {
                if (err) {
                  winston.error('WebSocket error getting  bots', err);
                  return reject(err);
                }


                return resolve({
                  publishFunction: function () {
                    // handlePublishMessageToClientId (topic, message, clientId, method) {
                    pubSubServer.handlePublishMessageToClientId(topic, bot, clientId, "CREATE");
                  }
                });

              });

          } else {

            //request/id

            // winston.debug(' req.: ',req);

            var recipientId = urlSub[3];
            winston.debug('recipientId: ' + recipientId);

            Project_user.findOne({ id_project: projectId, id_user: req.user._id, $or: [{ "role": "agent" }, { "role": "admin" }, { "role": "owner" }], status: "active" })
              // @DISABLED_CACHE .cache(cacheUtil.defaultTTL, projectId+":project_users:role:teammate:"+req.user._id)
              .exec(function (err, projectuser) {
                if (err) {
                  winston.error('WebSocket error getting Project_user', err);
                  return reject(err);
                }
                if (!projectuser) {
                  winston.verbose('WebSocket Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId);
                  return reject({ err: 'Project_user not found with user id ' + req.user._id + ' and projectid ' + projectId });
                }

                var query = { id_project: projectId, request_id: recipientId };
                winston.debug('query: ' + JSON.stringify(query));

                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('query admin: ' + JSON.stringify(query));
                } else {
                  query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }]
                  winston.debug('query agent: ' + JSON.stringify(query));
                }

                // requestcachefarequi populaterequired

                Request.findOne(query)
                  .populate('lead')
                  .populate('department')
                  .populate('participatingBots')
                  .populate('participatingAgents')
                  .populate({ path: 'requester', populate: { path: 'id_user' } })
                  .sort({ updatedAt: 'asc' }).exec(function (err, request) {

                    if (err) {
                      winston.error('WebSocket Error finding request for onSubscribeCallback', err);
                      return reject(err);
                    }
                    winston.debug('onSubscribeCallback find', request);

                    return resolve({
                      publishFunction: function () {
                        // handlePublishMessageToClientId (topic, message, clientId, method) {
                        pubSubServer.handlePublishMessageToClientId(topic, request, clientId, "CREATE");
                      }
                    });

                  });

              });

          }




        });

      });
    }




    const pubSubServer = new PubSub(wss, {
      onConnect: onConnectCallback, onDisconnect: onDisconnectCallback,
      onMessage: onMessageCallback, onSubscribe: onSubscribeCallback, onPublish: onPublishCallback
    });

    var that = this;


    var messageCreateKey = 'message.create';
    if (messageEvent.queueEnabled) {
      messageCreateKey = 'message.create.queue.pubsub';
    }
    winston.debug('WS messageCreateKey: ' + messageCreateKey);

    messageEvent.on(messageCreateKey, function (message) {
      setImmediate(async () => {
        winston.debug('messageEvent websocket server: ' + messageCreateKey, message);
        if (message.request) {
          pubSubServer.handlePublishMessage('/' + message.id_project + '/requests/' + message.request.request_id + '/messages', message, undefined, true, "CREATE");
        }
      });
    });

    // var reconnect = require('./reconnect');
    var requestCreateKey = 'request.create';
    if (requestEvent.queueEnabled) {
      requestCreateKey = 'request.create.queue.pubsub';
    }
    winston.debug('requestCreateKey: ' + requestCreateKey);
    requestEvent.on(requestCreateKey, async function (request) {
      setImmediate(async () => {

        winston.debug('requestEvent websocket server: ' + requestCreateKey, request);
        // TODO scarta riquesta se agente (req.user._id) non sta ne in participants ne in agents

        if (request.preflight === false) {

          //TODO ATTENTION change value by reference requestJSON.snapshot
          let requestJSON = Object.assign({}, request);
          // var requestJSON = request;

          if (request.toObject) {
            requestJSON = request.toObject();
          }

          //deleted snapshot department lead, etc..
          delete requestJSON.snapshot;
          requestJSON.snapshot = {};




          // ATTENTO  https://stackoverflow.com/questions/64059795/mongodb-get-error-message-mongoerror-path-collision-at-activity
          try {
            var snapshotAgents = await Request.findById(request.id).select({ "snapshot": 1 }).exec(); //SEMBRA CHE RITORNI TUTTO LO SNAPSHOT INVECE CHE SOLO AGENTS
            winston.debug('snapshotAgents', snapshotAgents);
            // requestJSON.snapshot.agents = snapshotAgents;

            if (snapshotAgents.snapshot.agents && snapshotAgents.snapshot.agents.length > 0) {
              var agentsnew = [];
              snapshotAgents.snapshot.agents.forEach(a => {
                agentsnew.push({ id_user: a.id_user })
              });
              //TODO ATTENTION change value by reference  requestJSON.snapshot.agents. but it's fixed with line 640
              requestJSON.snapshot.agents = agentsnew;
            }
            winston.debug('requestJSON', requestJSON);
          } catch (e) {
            winston.error('Error getting snapshotAgents in ws. This is a mongo issue', e);
          }

          pubSubServer.handlePublishMessage('/' + request.id_project + '/requests', request, undefined, true, "CREATE");
          pubSubServer.handlePublishMessage('/' + request.id_project + '/requests/' + request.request_id, request, undefined, true, "CREATE");
        }
      });
    });

    var requestUpdateKey = 'request.update';
    if (requestEvent.queueEnabled) {
      requestUpdateKey = 'request.update.queue.pubsub';
    }

    winston.debug('requestUpdateKey: ' + requestUpdateKey);
    requestEvent.on(requestUpdateKey, async function (request) {
      setImmediate(async () => {

        // TODO setImmediate(() => {        
        winston.debug('requestEvent websocket server: ' + requestUpdateKey, request);
        if (request.preflight === false && request.status > requestConstants.TEMP) {

          //TODO ATTENTION change value by reference requestJSON.snapshot
          let requestJSON = Object.assign({}, request);
          // var requestJSON = request;

          if (request.toObject) {
            requestJSON = request.toObject();
          }

          //deleted snapshot department lead, etc..
          delete requestJSON.snapshot;
          requestJSON.snapshot = {};

          // ATTENTO  https://stackoverflow.com/questions/64059795/mongodb-get-error-message-mongoerror-path-collision-at-activity

          try {
            var snapshotAgents = await Request.findById(request.id).select({ "snapshot": 1 }).exec(); //SEMBRA CHE RITORNI TUTTO LO SNAPSHOT INVECE CHE SOLO AGENTS
            winston.debug('snapshotAgents', snapshotAgents);
            // requestJSON.snapshot.agents = snapshotAgents;

            if (snapshotAgents.snapshot.agents && snapshotAgents.snapshot.agents.length > 0) {
              var agentsnew = [];
              snapshotAgents.snapshot.agents.forEach(a => {
                agentsnew.push({ id_user: a.id_user })
              });
              //TODO ATTENTION change value by reference requestJSON.snapshot.agents . fixed with line 693
              requestJSON.snapshot.agents = agentsnew;
            }
            winston.debug('requestJSON', requestJSON);

          } catch (e) {
            winston.error('Error getting snapshotAgents in ws. This is a mongo issue', e);
          }

          if (requestJSON.draft !== true) {
            pubSubServer.handlePublishMessage('/' + request.id_project + '/requests', requestJSON, undefined, true, "UPDATE");
          }
          pubSubServer.handlePublishMessage('/' + request.id_project + '/requests/' + request.request_id, requestJSON, undefined, true, "UPDATE");

        }
      });
    });




    // TODO request.close is missing?


    var projectuserUpdateKey = 'project_user.update';
    if (authEvent.queueEnabled) {
      projectuserUpdateKey = 'project_user.update.queue.pubsub';
    }
    winston.debug('projectuserUpdateKey: ' + projectuserUpdateKey);
    authEvent.on(projectuserUpdateKey, function (data) {
      setImmediate(async () => {

        var pu = data.updatedProject_userPopulated;
        winston.debug('ws pu', pu);

        //TODO pubSubServer.handlePublishMessage ('/'+pu.id_project+'/project_users/', pu, undefined, true, "UPDATE");

        pubSubServer.handlePublishMessage('/' + pu.id_project + '/project_users/' + pu.id, pu, undefined, true, "UPDATE");

        var userId;
        if (pu.uuid_user) {
          userId = pu.uuid_user;
        } else {
          userId = pu.id_user._id;
        }
        winston.debug('userId:' + userId);
        pubSubServer.handlePublishMessage('/' + pu.id_project + '/project_users/users/' + userId, pu, undefined, true, "UPDATE");
      });
    });



    var eventEmitKey = 'event.emit';
    if (eventEvent.queueEnabled) {
      eventEmitKey = 'event.emit.queue.pubsub';
    }
    winston.debug('eventEmitKey: ' + eventEmitKey);
    eventEvent.on(eventEmitKey, function (event) {
      setImmediate(async () => {
        winston.debug('event', event);
        if (event.project_user === undefined) {
          //with "faqbot.answer_not_found" project_user is undefined but it's ok 
          winston.debug('not sending with ws event with project_user undefined', event);
          return;
        }
        pubSubServer.handlePublishMessage('/' + event.id_project + '/events/' + event.project_user._id, event, undefined, true, "CREATE");
      });
    });








    var botUpdateKey = 'faqbot.update';
    if (botEvent.queueEnabled) {
      botUpdateKey = 'faqbot.update.queue.pubsub';
    }

    winston.debug('botUpdateKey: ' + botUpdateKey);
    botEvent.on(botUpdateKey, async function (bot) {
      setImmediate(async () => {

        // TODO setImmediate(() => {        

        let botJSON = Object.assign({}, bot);

        if (bot.toObject) {
          botJSON = bot.toObject();
        }

        let topic = '/' + bot.id_project + '/bots/' + bot._id;
        winston.debug('botEvent websocket server: ' + botUpdateKey + " on topic " + topic, botJSON);


        pubSubServer.handlePublishMessage(topic, botJSON, undefined, true, "UPDATE");
      });
    });





    // https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js


    // IMPORTANTE https://blog.usejournal.com/using-mongodb-as-realtime-db-with-nodejs-c6f52c266750

    // start mongo with: mongod --port 27017 --replSet rs0
    //     wss.on('connection', function connection(ws, req) {

    //       winston.debug('ws connection. req.url)', req.url);
    //        //console.log('ws connection. req', req);

    //        let urlParsed = url.parse(req.url, true);
    //        winston.debug('urlParsed', urlParsed);

    //        var queryParameter = urlParsed.query;
    //        winston.debug('queryParameter', queryParameter);

    //        var id_project = queryParameter.id_project;    
    //        winston.debug('id_project=', id_project);   

    //        if (!id_project) {
    //           winston.error('id_project not specified');   
    //           return 0;
    //        }

    //        winston.debug('queryParameter.events'+ queryParameter.events);
    //        var events = JSON.parse(queryParameter.events);    
    //        winston.debug('events', events);  

    //        if (!events) {
    //         winston.error('events not specified');   
    //         return 0;
    //        }

    //        that.subscribeClient(id_project, events, ws);



    //        winston.debug('queryParameter.q', queryParameter.q);

    //        var query = JSON.parse(queryParameter.q);  
    //        query['id_project'] = id_project;         
    //        winston.debug('query=', query);

    //        that.sendInitialData(events,query,ws);

    //       // https://www.sitepoint.com/build-node-js-powered-chatroom-web-app-node-mongodb-socket/
    //       // usa stream come qui 








    //       // message2Event.on(id_project+'.message.create', function (message) {
    //       //   console.log('message2Event=', message);
    //       //   ws.send(JSON.stringify(message));
    //       // });




    // // // with mongo stream start
    // //       //const fullDocumentQuery = {fullDocument: query};
    // //       const fullDocumentQuery = that.cloneAsDotted("fullDocument.", query);
    // //       console.log("fullDocumentQuery", JSON.stringify(fullDocumentQuery));

    // //       const pipeline = [{ $match: fullDocumentQuery }];
    // //       console.log("pipeline", JSON.stringify(pipeline));

    // //       //const changeStream = Message.watch( pipeline, { fullDocument: 'updateLookup' });
    // //       const changeStream = Message.watch( pipeline);
    // //        //const changeStream = Message.watch();

    // //       console.log("changeStream"); 
    // //       changeStream.on('change', (change) => {
    // //         console.log('change', change); // You could parse out the needed info and send only that data. 
    // //         ws.send(JSON.stringify(change.fullDocument));
    // //         //io.emit('changeData', change);
    // //        }); 

    // //       //  with mongo stream end






    //       ws.on('message', function incoming(message) {
    //         if (message.type === 'utf8') {
    //           // process WebSocket message

    //         }
    //         console.log('received: %s', message);

    //       });

    //       // ws.on('open', function open() {
    //       //   console.log('ws open');
    //       // });

    //     });



  }

  // sendInitialData(events,query,ws) {
  //   if (events && events.length>0) {
  //     events.forEach(function(event) {
  //       if (event=='message') {          
  //         Message.find(query).sort({updatedAt: 'asc'}).limit(20).exec(function(err, messages) {   
  //           var dataToSend = {event:event, data:messages};        
  //           ws.send(JSON.stringify(dataToSend));
  //         });
  //       }

  //       if (event=='request') {
  //         Request.find(query).sort({updatedAt: 'asc'}).limit(20).exec(function(err, requests) {   
  //           var dataToSend = {event:event, data:requests};                
  //           ws.send(JSON.stringify(dataToSend));
  //         });
  //       }

  //     });
  //   }
  // }

  // subscribeClient(id_project, events, ws) {
  //   if (!this.clientsSubscriptions[id_project]) {
  //     this.clientsSubscriptions[id_project]={};
  //    }
  //    var that=this;

  //    if (events && events.length>0) {
  //     events.forEach(function(event) {
  //       if (!that.clientsSubscriptions[id_project][event]) {
  //         that.clientsSubscriptions[id_project][event]=[];
  //        }
  //        that.clientsSubscriptions[id_project][event].push(ws);
  //      });
  //    }


  //    winston.debug('clientsSubscriptions=', this.clientsSubscriptions);
  // }

  // sendAll(data, event){
  //   var id_project = data.id_project;
  //   winston.debug("id_project:"+id_project);

  //   winston.debug("event:"+event);

  //   var dataToSend = {event:event, data:data};

  //   winston.debug("this.clientsSubscriptions:",this.clientsSubscriptions);

  //   if (this.clientsSubscriptions[id_project] && 
  //         this.clientsSubscriptions[id_project][event] && 
  //         this.clientsSubscriptions[id_project][event].length>0) {

  //     this.clientsSubscriptions[id_project][event].forEach(function(client) {
  //       winston.debug("send client:", client);
  //       client.send(JSON.stringify(dataToSend));
  //     });

  //   }

  // }



  // cloneAsDotted(prefix, origin) {
  //   // // Don't do anything if add isn't an object
  //   // if (!add || typeof add !== 'object') return origin;
  //   var newObj = {};

  //   var keys = Object.keys(origin);
  //   var i = keys.length;
  //   while (i--) {
  //     newObj[prefix+keys[i]] = origin[keys[i]];
  //   }
  //   return newObj;
  // }



}

var webSocketServer = new WebSocketServer();
module.exports = webSocketServer;
