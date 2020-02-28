var Message = require("../models/message");
var User = require("../models/user");
var Project_user = require("../models/project_user");
var Request = require("../models/request");
var Message = require("../models/message");
const WebSocket = require('ws');
var url = require('url');
var validtoken = require('../middleware/valid-token');
var message2Event = require("../event/message2Event");
var messageEvent = require("../event/messageEvent");
var requestEvent = require("../event/requestEvent");
var jwt = require('jsonwebtoken');
var config = require('../config/database'); // get db config file
var winston = require('../config/winston');
var roleChecker = require('../middleware/has-role');
const PubSub = require('./pubsub');

class WebSocketServer {

  constructor() {
    this.clientsSubscriptions = {};
  }
  

  // https://hackernoon.com/nodejs-web-socket-example-tutorial-send-message-connect-express-set-up-easy-step-30347a2c5535
  // https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61
  init(server) {
    
    //var wss = new WebSocket.Server({ port: 40510 });
    //var wss = new WebSocket.Server({ port: 40510 , path: "/messages" });
    //var wss = new WebSocket.Server({  port: 80 ,path: "/messages" });
    //  var wss = new WebSocket.Server({  server: server,path: "/messages" });

     var wss = new WebSocket.Server({  
       server: server, 
       path: "/",
        verifyClient: function (info, cb) {
          //console.log('info.req', info.req);
          // var token = info.req.headers.Authorization
          let urlParsed = url.parse(info.req.url, true);
          // console.log('urlParsed', urlParsed);
          var queryParameter = urlParsed.query;
          winston.debug('queryParameter', queryParameter);

          var token = queryParameter.token;
          winston.debug('token:'+ token);
          winston.debug('config.secret:'+ config.secret);

        
          if (!token)
              cb(false, 401, 'Unauthorized');
          else {
            token = token.replace('JWT ', '');            
              jwt.verify(token, config.secret, function (err, decoded) {
                  if (err) {
                     winston.error('error websocket', err);
                     return cb(false, 401, 'Unauthorized');
                  } else {
                     // uncomment it
                     const identifier = decoded._id || decoded._doc._id;


                         winston.debug('valid token:'+identifier);
                        // roleChecker.hasRoleAsPromise().then(function(project_user) {
                        //   winston.debug('hasRoleAsPromise project_user',project_user);
                          // winston.debug('ok websocket');

                          // autType?????
                          User.findOne({_id: identifier}, 'email firstname lastname emailverified id', function (err, user) {
                            // console.log("BasicStrategy user",user);
                            // console.log("BasicStrategy err",err);
                    
                            if (err) {
                                // console.log("BasicStrategy err.stop");
                                return winston.error('error websocket', err);
                            }
                            if (!user) {   
                              winston.debug('websocket user not found with id : '+identifier);                             
                              return cb(false, 401, 'Unauthorized');
                            }

                            // info.req.user = decoded;
                            info.req.user = user;
                            winston.debug('info.req.user',info.req.user.toObject());
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


    var onConnectCallback = async function(client, req) {
      winston.debug('onConnectCallback ');
      return new Promise(function(resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }

    var onDisconnectCallback = async function(subscript, id) {
      winston.debug('onDisconnectCallback: '+subscript +":"+ id);
      return new Promise(function(resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }


//tilebaseMess.send('{ "action": "publish", "payload": { "topic": "/apps/123/requests/sendid/conversations/RFN", "message":{"sender_id":"sendid","sender_fullname":"SFN", "recipient_id":"RFN", "recipient_fullname":"RFN","text":"hi","app_id":"123"}}}');
    var onPublishCallback = async function(publishTopic, publishMessage, from) {
      winston.debug("onPublish topic: "+publishTopic +" from: "+from, publishMessage);
      return new Promise(function(resolve, reject) {
        return resolve("ok");
      });
  
    }

    var onMessageCallback = async function(id, message) {
      winston.debug('onMessageCallback ',id, message);
      return new Promise(function(resolve, reject) {
        return resolve("ok");
      });
      // check here if you can subscript o publish message
    }

    // tilebase.send('{ "action": "subscribe", "payload": { "topic": "/app1/requests"}}');
    var onSubscribeCallback = async function(id, message, req) {
      return new Promise(function(resolve, reject) {
            winston.debug('onSubscribeCallback :'+id+ " "+ message);      
          
            winston.debug(' req.user._id: '+ req.user);

            if (id.endsWith('/messages')) {
              winston.debug(' messages: ');
              var urlSub = id.split('/');  

              var projectId = urlSub[1];
              winston.debug('projectId: '+projectId);

              var recipientId = urlSub[3];
              winston.debug('recipientId: '+recipientId);
              // winston.debug(' req.: ',req);
            
            

              Project_user.findOne({ id_project: projectId, id_user:  req.user._id, $or:[ {"role": "agent"}, {"role": "admin"}, {"role": "owner"}] }, function (err, projectuser) {
                if (err) {
                   winston.error('error getting  Project_user', err);  
                   return reject(err);
                }
                if (!projectuser) {
                   winston.error('Project_user not found for user id '+ req.user._id + ' and projectid ' + projectId);  
                   return reject({err:'Project_user not found for user id '+ req.user._id + ' and projectid ' + projectId});
                }

                var queryRequest = {id_project:projectId, request_id: recipientId };     

                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('queryRequest admin: '+ JSON.stringify(queryRequest));
                }else {
                  queryRequest["$or"] = [ { "agents.id_user": req.user.id}, {"participants": req.user.id}]            
                  winston.debug('queryRequest agent: '+ JSON.stringify(queryRequest));
                }


                Request.findOne(queryRequest)                
                .exec(function(err, request) { 
                
                    if (err) {
                      winston.error('Error finding request for onSubscribeCallback', err);  
                      return reject(err);
                    }
                    if (!request) {
                       winston.error('Request query not found for user id '+ req.user._id + ' and projectid ' + projectId);  
                       return reject({err:'Request query not found for user id '+ req.user._id + ' and projectid ' + projectId});
                    }

                    winston.debug('found request for onSubscribeCallback', request);  


              
                      var query = {id_project:projectId, recipient: recipientId };                       
                      winston.debug('query : '+ JSON.stringify(query));

                      Message.find(query).sort({createdAt: 'asc'}).exec(function(err, messages) { 
                      
                          if (err) {
                            winston.error('Error finding message for onSubscribeCallback', err);  
                            return reject(err);
                          }
                          winston.debug('onSubscribeCallback find', messages);  


                          return resolve({publishFunction:function() {
                            pubSubServer.handlePublishMessage (id, messages, undefined, true, "CREATE");
                          }});     

                          // const publishPromise = new Promise(function(resolve, reject) {
                          //   return resolve(pubSubServer.handlePublishMessage (id, messages, undefined, true, "CREATE"));
                          // });

                          // return resolve(publishPromise);                                                                                          
                
                      });
                  });

              });
              
          } else if (id.endsWith('/requests')) {

              var urlSub = id.split('/');  

              var projectId = urlSub[1];
              winston.debug('projectId: '+projectId);
              winston.debug('req.user._id: '+req.user._id);
              // winston.debug(' req.: ',req);
            
              winston.debug('find project_user');
            

              Project_user.findOne({ id_project: projectId, id_user:  req.user._id, $or:[ {"role": "agent"}, {"role": "admin"}, {"role": "owner"}]  }, function (err, projectuser) {
                if (err) {
                   winston.error('error getting  Project_user', err);  
                   return reject(err);
                }
                if (!projectuser) {
                   winston.error('Project_user not found with user id '+ req.user._id + ' and projectid ' + projectId);  
                   return reject({err:'Project_user not found with user id '+ req.user._id + ' and projectid ' + projectId});
                }
                winston.debug('projectuser', projectuser.toObject()); 

                // db.getCollection('requests').find({"id_project":"5e15bef09877c800176d217f","status":{"$lt":1000},"$or":[{"agents":{"id_user":"5ddd30bff0195f0017f72c6d"}},{"participants":"5ddd30bff0195f0017f72c6d"}]})
                var query = {"id_project":projectId, "status": { $lt: 1000 } };
                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('query admin: '+ JSON.stringify(query));
                }else {
                  query["$or"] = [ { "agents.id_user": req.user.id}, {"participants": req.user.id}]            
                  winston.debug('query agent: '+ JSON.stringify(query));
                }
                
                Request.find(query)
                .populate('lead')
                .populate('department')
                .populate('participatingBots')
                .populate('participatingAgents')  
                .populate({path:'requester',populate:{path:'id_user'}})
                .sort({updatedAt: 'desc'})
                .limit(100)
                .exec(function(err, requests) { 
                
                    if (err) {
                      winston.error('Error finding request for onSubscribeCallback', err);  
                      return reject(err);
                    }
                    winston.debug('found requests for onSubscribeCallback', requests);  

                    // const publishPromise = new Promise(function(resolve, reject) {
                    //   pubSubServer.handlePublishMessage (id, requests, undefined, true, "CREATE")
                    //   return resolve("ok");
                    // });

                    // return resolve("ok");          
                    // return resolve({publishPromise:publishPromise});          
                    return resolve({publishFunction:function() {
                      pubSubServer.handlePublishMessage (id, requests, undefined, true, "CREATE");
                    }});          

          
                });

              });
              


          } else {

                var urlSub = id.split('/');  

                var projectId = urlSub[1];
                winston.debug('projectId: '+projectId);
                // winston.debug(' req.: ',req);
              
                var recipientId = urlSub[3];
                winston.debug('recipientId: '+recipientId);

                Project_user.findOne({ id_project: projectId, id_user:  req.user._id, $or:[ {"role": "agent"}, {"role": "admin"}, {"role": "owner"}] }, function (err, projectuser) {
                  if (err) {
                     winston.error('error getting  Project_user', err);  
                     return reject(err);
                  }
                  if (!projectuser) {
                     winston.error('Project_user not found with user id '+ req.user._id + ' and projectid ' + projectId);  
                     return reject({err:'Project_user not found with user id '+ req.user._id + ' and projectid ' + projectId});
                  }

                  var query = {id_project:projectId, request_id: recipientId};
                winston.debug('query: '+ JSON.stringify(query));

                if (projectuser.role == "owner" || projectuser.role == "admin") {
                  winston.debug('query admin: '+ JSON.stringify(query));
                }else {
                  query["$or"] = [ { "agents.id_user": req.user.id}, {"participants": req.user.id}]            
                  winston.debug('query agent: '+ JSON.stringify(query));
                }
                  
                  Request.findOne(query)
                  .populate('lead')
                  .populate('department')
                  .populate('participatingBots')
                  .populate('participatingAgents')  
                  .populate({path:'requester',populate:{path:'id_user'}})
                  .sort({updatedAt: 'asc'}).exec(function(err, request) { 
                  
                      if (err) {
                        winston.error('Error finding request for onSubscribeCallback', err);  
                        return reject(err);
                      }
                      winston.debug('onSubscribeCallback find', request);  

                      return resolve({publishFunction:function() {
                        pubSubServer.handlePublishMessage (id, request, undefined, true, "CREATE");
                      }});    

                      // const publishPromise = new Promise(function(resolve, reject) {
                      //   return resolve(pubSubServer.handlePublishMessage (id, request, undefined, true, "CREATE"));
                      // });
  
                      // return resolve("ok"); 
                      // return resolve(publishPromise); 
                                                            
            
                  });

                });
                
            }
          });
    }




    const pubSubServer = new PubSub(wss, {onConnect: onConnectCallback, onDisconnect: onDisconnectCallback,
      onMessage: onMessageCallback, onSubscribe: onSubscribeCallback, onPublish:onPublishCallback});

    var that = this;

    messageEvent.on('message.create', function (message) {
      winston.debug('messageEvent websocket server ', message);
        pubSubServer.handlePublishMessage ('/'+message.id_project+'/requests/'+message.request.request_id+'/messages', message, undefined, true, "CREATE");
      });

      requestEvent.on('request.create', function (request) {
        winston.debug('requestEvent websocket server ', request);
        // TODO scarta riquesta se agente (req.user._id) non sta ne in participants ne in agents
          pubSubServer.handlePublishMessage ('/'+request.id_project+'/requests', request, undefined, true, "CREATE");
          pubSubServer.handlePublishMessage ('/'+request.id_project+'/requests/'+request.request_id, request, undefined, true, "CREATE");
        });


      requestEvent.on('request.update', function(request) {
        winston.debug('requestEvent websocket server ', request);       
        pubSubServer.handlePublishMessage ('/'+request.id_project+'/requests', request, undefined, true, "UPDATE");   
        pubSubServer.handlePublishMessage ('/'+request.id_project+'/requests/'+request.request_id, request, undefined, true, "UPDATE");
     
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
