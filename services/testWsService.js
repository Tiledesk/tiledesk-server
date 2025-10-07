let Message = require("../models/message");
const WebSocket = require('ws');
let url = require('url');

class TestWsService {

 

  // https://hackernoon.com/nodejs-web-socket-example-tutorial-send-message-connect-express-set-up-easy-step-30347a2c5535
  // https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61
  init(server) {
    
    //let wss = new WebSocket.Server({ port: 40510 });
    //let wss = new WebSocket.Server({ port: 40510 , path: "/messages" });
    //let wss = new WebSocket.Server({  port: 80 ,path: "/messages" });
     let wss = new WebSocket.Server({  server: server,path: "/testws" });
    
    let that = this;


    // https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js


    // IMPORTANTE https://blog.usejournal.com/using-mongodb-as-realtime-db-with-nodejs-c6f52c266750

    // start mongo with: mongod --port 27017 --replSet rs0
    wss.on('connection', function connection(ws, req) {

      console.log('ws connection. req.url)', req.url);
       //console.log('ws connection. req', req);
       let urlParsed = url.parse(req.url, true);
       console.log('urlParsed', urlParsed);
       let queryParameter = urlParsed.query;
       console.log('queryParameter', queryParameter);
       console.log('queryParameter.q', queryParameter.q);
       
       let query = JSON.parse(queryParameter.q);    
       console.log('query=', query);
     
      // Message.find({"recipient": requestid, id_project: id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
        
      // https://www.sitepoint.com/build-node-js-powered-chatroom-web-app-node-mongodb-socket/
      // usa stream come qui 

        Message.find(query).sort({updatedAt: 'asc'}).limit(20).exec(function(err, messages) { 
        //Message.find({"recipient":"support-group123"}).sort({updatedAt: 'asc'}).limit(20).exec(function(err, messages) { 
          ws.send(JSON.stringify(messages));
      });

      
      
      setInterval(function() {
        let message = {text:`ciao2 il ${new Date()}`};
        // let array = new Array();
        // array.push(message);
        // ws.send(array);
        ws.send(JSON.stringify(message));
      },10000);

    
    



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


}

let testWsService = new TestWsService();
module.exports = testWsService;
