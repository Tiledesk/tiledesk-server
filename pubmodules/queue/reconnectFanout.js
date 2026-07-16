var amqp = require('amqplib/callback_api');
var winston = require('../../config/winston');
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
const botEvent = require('../../event/botEvent');
const authEvent = require('../../event/authEvent');
// https://elements.heroku.com/addons/cloudamqp
// https://gist.github.com/carlhoerberg/006b01ac17a0a94859ba#file-reconnect-js
// http://www.rabbitmq.com/tutorials/tutorial-one-javascript.html

// if the connection is closed or fails to be established at all, we will reconnect
var amqpConn = null;
var url = process.env.CLOUDAMQP_URL + "?heartbeat=60" || "amqp://localhost";
// attento devi aggiornare configMap di PRE E PROD
// var url = process.env.AMQP_URL + "?heartbeat=60" || "amqp://localhost";

// MOD0
var exchange = 'ws';

function start() {
  amqp.connect(url, function(err, conn) {
    if (err) {
      winston.error("[AMQP Fanout]", err);
      return setTimeout(start, 1000);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        winston.error("[AMQP Fanout] conn error", err);
      }
    });
    conn.on("close", function() {
      winston.error("[AMQP Fanout] reconnecting");
      return setTimeout(start, 1000);
    });

    winston.info("[AMQP Fanout] connected");
    amqpConn = conn;

    whenConnected();
  });
}

function whenConnected() {
  startPublisher();
  startWorker();
}

var pubChannel = null;
var offlinePubQueue = [];
function startPublisher() {
  amqpConn.createConfirmChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      winston.error("[AMQP Fanout] channel error", err);
    });
    ch.on("close", function() {
      winston.info("[AMQP Fanout] channel closed");
    });

    pubChannel = ch;
    while (true) {
      var m = offlinePubQueue.shift();
      if (!m) break;
      publish(m[0], m[1], m[2]);
    }
  });
}

// method to publish a message, will queue messages internally if the connection is down and resend later
function publish(exchange, routingKey, content) {
  try {

    // MOD2 
    // pubChannel.publish('logs', '', Buffer.from('Hello World!'));
    pubChannel.publish(exchange, routingKey, content, { },
    // pubChannel.publish(exchange, routingKey, content, { persistent: true },
                       function(err, ok) {
                         if (err) {
                          winston.error("[AMQP Fanout] publish", err);
                           offlinePubQueue.push([exchange, routingKey, content]);
                           pubChannel.connection.close();
                         }
                       });
  } catch (e) {
    winston.error("[AMQP Fanout] publish", e);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

// A worker that acks messages only if processed succesfully
// var channel;
function startWorker() {
    amqpConn.createChannel(function(err, ch) {
      if (closeOnErr(err)) return;
      ch.on("error", function(err) {
        winston.error("[AMQP Fanout] channel error", err);
      });
      ch.on("close", function() {
        winston.info("[AMQP Fanout] channel closed");
      });
      ch.prefetch(10);//leggila da env

      // ch.assertExchange(exchange, 'topic', {
      //   durable: true
      // });

      // MOD1
      ch.assertExchange(exchange, 'fanout', {durable: false});

      //MOD3 
      ch.assertQueue('', {exclusive: true}, function(err, _ok) {
      // ch.assertQueue("jobs", { durable: true }, function(err, _ok) {

        if (closeOnErr(err)) return;
        
      //MOD4 
        ch.bindQueue(_ok.queue, exchange, '', {}, function(err3, oka) {
          winston.info("Queue Fanout bind: "+_ok.queue+ " err: "+err3);
          winston.info("Data Queue Fanout", oka)
        });

        // ch.bindQueue(_ok.queue, exchange, "request_create", {}, function(err3, oka) {
        //     console.log("queue bind: "+_ok.queue+ " err: "+err3+ " key: request_create");
        //     console.log("data queue", oka)
        // });
        // ch.bindQueue(_ok.queue, exchange, "request_update", {}, function(err3, oka) {
        //     console.log("queue bind: "+_ok.queue+ " err: "+err3+ " key: request_update");
        //     console.log("data queue", oka)
        // });
        // ch.bindQueue(_ok.queue, exchange, "message_create", {}, function(err3, oka) {
        //       console.log("queue bind: "+_ok.queue+ " err: "+err3+ " key: message_create");
        //       console.log("data queue", oka)
        // });
        // ch.bindQueue(_ok.queue, exchange, "project_user_update", {}, function(err3, oka) {
        //   console.log("queue bind: "+_ok.queue+ " err: "+err3+ " key: project_user_update");
        //   console.log("data queue", oka)
        // });
        ch.consume(_ok.queue, processMsg, { noAck: false });
        winston.info("Worker Fanout is started");
      });
  

    function processMsg(msg) {
      work(msg, function(ok) {
        try {
          if (ok)
            ch.ack(msg);
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      });
    }
  });
}

function work(msg, cb) {
  const message_string = msg.content.toString();
  const topic = msg.fields.routingKey //.replace(/[.]/g, '/');

  winston.debug("Got Fanout msg topic:" + topic);
  
  winston.debug("Got Fanout msg:"+ message_string +  " topic:" + topic);

  if (topic === 'request_create') {
    winston.debug("reconnectfanout here topic:" + topic);
    winston.debug("reconnect request.update")
    requestEvent.emit('request.create.queue.pubsub', JSON.parse(message_string));
  }
  if (topic === 'request_update') {
    winston.debug("reconnectfanout here topic:" + topic);
    requestEvent.emit('request.update.queue.pubsub',  JSON.parse(message_string));
  }
  if (topic === 'message_create') {
    winston.debug("reconnectfanout here topic:" + topic);
    messageEvent.emit('message.create.queue.pubsub', JSON.parse(message_string));
  }
  if (topic === 'project_user_update') {
    winston.debug("reconnectfanout here topic:" + topic);
    authEvent.emit('project_user.update.queue.pubsub', JSON.parse(message_string));
  }
  if (topic === 'faqbot_update') {
    winston.debug("reconnectfanout here topic faqbot_update:" + topic);
    botEvent.emit('faqbot.update.queue.pubsub', JSON.parse(message_string));
  }
  cb(true);
//   WebSocket.cb(true);
//   requestEvent.on(msg.KEYYYYYYY+'.ws', msg.content);
}


function closeOnErr(err) {
  if (!err) return false;
  winston.error("[AMQP Fanout] error", err);
  amqpConn.close();
  return true;
}

// setInterval(function() {
//     var d = new Date();
//   publish(exchange, "request_create", Buffer.from("work work work: "+d));
// }, 10000);



// http://www.squaremobius.net/amqp.node/channel_api.html
// https://docs.parseplatform.org/parse-server/guide/#scalability



function listen() {
    
  requestEvent.on('request.create', function(request) {
    setImmediate(() => {
      publish(exchange, "request_create", Buffer.from(JSON.stringify(request)));
    });
  });

  requestEvent.on('request.update', function(request) {
    setImmediate(() => {
      publish(exchange, "request_update", Buffer.from(JSON.stringify(request)));
    });
  });


  messageEvent.on('message.create', function(message) {
    setImmediate(() => {
      publish(exchange, "message_create", Buffer.from(JSON.stringify(message)));
    });
  });
  
  authEvent.on('project_user.update',function(data) {
    setImmediate(() => {
      let user = undefined;
      let body = undefined;
        if (data.req ) {
          if (data.req.user) { //i think is null from chat21webhook 
            user = data.req.user;
          }
          if (data.req.body) {
            body = data.req.body;
          }
        }
        var dat = {updatedProject_userPopulated: data.updatedProject_userPopulated, req: {user: user, body: body}}; //remove request
        winston.debug("dat",dat);

      publish(exchange, "project_user_update", Buffer.from(JSON.stringify(dat)));
    });
  });


  botEvent.on('faqbot.update', function(bot) {
    setImmediate(() => {
      winston.debug("reconnect faqbot.update")
      publish(exchange, "faqbot_update", Buffer.from(JSON.stringify(bot)));
      winston.debug("reconnect fan: "+ Buffer.from(JSON.stringify(bot)))
    });
  });


}

if (process.env.QUEUE_ENABLED === "true") {
    requestEvent.queueEnabled = true;
    messageEvent.queueEnabled = true;
    authEvent.queueEnabled = true; 
    botEvent.queueEnabled = true;
    listen();
    start();
    winston.info("Queue Fanout enabled. endpoint: " + url );
} 

