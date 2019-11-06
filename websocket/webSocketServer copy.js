var Message = require("../models/message");
var Request = require("../models/request");
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

          var token = queryParameter.token.replace('JWT ', '');

          // winston.info('config.secret:'+ config.secret);

        
          if (!token)
              cb(false, 401, 'Unauthorized');
          else {
              jwt.verify(token, config.secret, function (err, decoded) {
                  if (err) {
                    // winston.info('error websocket', err);
                      cb(false, 401, 'Unauthorized');
                  } else {
                     // uncomment it
                        // winston.info('valid token');
                        // roleChecker.hasRoleAsPromise().then(function(project_user) {
                        //   winston.info('hasRoleAsPromise project_user',project_user);
                          // winston.info('ok websocket');
                          info.req.user = decoded;
                          cb(true);
                      // }).catch(function(err){
                      //   winston.error('hasRoleAsPromise err',err);
                      //   cb(false, 401, err.msg);
                      // });                     
                  
                  }
              })

          }
        }
    });



    var that = this;

    messageEvent.on('message.create', function (message) {
      winston.info('messageEvent websocket server ', message);
        that.sendAll(message,'message');        
      });

      requestEvent.on('request.create', function (message) {
        winston.info('requestEvent websocket server ', message);
          that.sendAll(message,'request');        
        });
      

    // https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js


    // IMPORTANTE https://blog.usejournal.com/using-mongodb-as-realtime-db-with-nodejs-c6f52c266750

    // start mongo with: mongod --port 27017 --replSet rs0
    wss.on('connection', function connection(ws, req) {

      winston.debug('ws connection. req.url)', req.url);
       //console.log('ws connection. req', req);

       let urlParsed = url.parse(req.url, true);
       winston.debug('urlParsed', urlParsed);
       
       var queryParameter = urlParsed.query;
       winston.debug('queryParameter', queryParameter);
     
       var id_project = queryParameter.id_project;    
       winston.debug('id_project=', id_project);   

       if (!id_project) {
          winston.error('id_project not specified');   
          return 0;
       }

       winston.info('queryParameter.events'+ queryParameter.events);
       var events = JSON.parse(queryParameter.events);    
       winston.info('events', events);  
       
       if (!events) {
        winston.error('events not specified');   
        return 0;
       }

       that.subscribeClient(id_project, events, ws);
       


       winston.debug('queryParameter.q', queryParameter.q);
       
       var query = JSON.parse(queryParameter.q);  
       query['id_project'] = id_project;         
       winston.debug('query=', query);

       that.sendInitialData(events,query,ws);
      
      // https://www.sitepoint.com/build-node-js-powered-chatroom-web-app-node-mongodb-socket/
      // usa stream come qui 

      






      // message2Event.on(id_project+'.message.create', function (message) {
      //   console.log('message2Event=', message);
      //   ws.send(JSON.stringify(message));
      // });

     
      
      
// // with mongo stream start
//       //const fullDocumentQuery = {fullDocument: query};
//       const fullDocumentQuery = that.cloneAsDotted("fullDocument.", query);
//       console.log("fullDocumentQuery", JSON.stringify(fullDocumentQuery));

//       const pipeline = [{ $match: fullDocumentQuery }];
//       console.log("pipeline", JSON.stringify(pipeline));

//       //const changeStream = Message.watch( pipeline, { fullDocument: 'updateLookup' });
//       const changeStream = Message.watch( pipeline);
//        //const changeStream = Message.watch();
     
//       console.log("changeStream"); 
//       changeStream.on('change', (change) => {
//         console.log('change', change); // You could parse out the needed info and send only that data. 
//         ws.send(JSON.stringify(change.fullDocument));
//         //io.emit('changeData', change);
//        }); 

//       //  with mongo stream end


    



      ws.on('message', function incoming(message) {
        if (message.type === 'utf8') {
          // process WebSocket message
          
        }
        console.log('received: %s', message);
       
      });

      // ws.on('open', function open() {
      //   console.log('ws open');
      // });

    });

 

  }

  sendInitialData(events,query,ws) {
    if (events && events.length>0) {
      events.forEach(function(event) {
        if (event=='message') {          
          Message.find(query).sort({updatedAt: 'asc'}).limit(20).exec(function(err, messages) {   
            var dataToSend = {event:event, data:messages};        
            ws.send(JSON.stringify(dataToSend));
          });
        }

        if (event=='request') {
          Request.find(query).sort({updatedAt: 'asc'}).limit(20).exec(function(err, requests) {   
            var dataToSend = {event:event, data:requests};                
            ws.send(JSON.stringify(dataToSend));
          });
        }
        
      });
    }
  }

  subscribeClient(id_project, events, ws) {
    if (!this.clientsSubscriptions[id_project]) {
      this.clientsSubscriptions[id_project]={};
     }
     var that=this;

     if (events && events.length>0) {
      events.forEach(function(event) {
        if (!that.clientsSubscriptions[id_project][event]) {
          that.clientsSubscriptions[id_project][event]=[];
         }
         that.clientsSubscriptions[id_project][event].push(ws);
       });
     }
     
    
     winston.debug('clientsSubscriptions=', this.clientsSubscriptions);
  }

  sendAll(data, event){
    var id_project = data.id_project;
    winston.debug("id_project:"+id_project);

    winston.debug("event:"+event);

    var dataToSend = {event:event, data:data};

    winston.debug("this.clientsSubscriptions:",this.clientsSubscriptions);

    if (this.clientsSubscriptions[id_project] && 
          this.clientsSubscriptions[id_project][event] && 
          this.clientsSubscriptions[id_project][event].length>0) {

      this.clientsSubscriptions[id_project][event].forEach(function(client) {
        winston.debug("send client:", client);
        client.send(JSON.stringify(dataToSend));
      });

    }
    
  }
  


  cloneAsDotted(prefix, origin) {
    // // Don't do anything if add isn't an object
    // if (!add || typeof add !== 'object') return origin;
    var newObj = {};

    var keys = Object.keys(origin);
    var i = keys.length;
    while (i--) {
      newObj[prefix+keys[i]] = origin[keys[i]];
    }
    return newObj;
  }



}

var webSocketServer = new WebSocketServer();
module.exports = webSocketServer;
