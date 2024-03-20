var amqp = require('amqplib/callback_api');
var winston = require('../../config/winston');
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
const leadEvent = require('../../event/leadEvent');

const botEvent = require('../../event/botEvent');
const authEvent = require('../../event/authEvent');
// https://elements.heroku.com/addons/cloudamqp
// https://gist.github.com/carlhoerberg/006b01ac17a0a94859ba#file-reconnect-js
// http://www.rabbitmq.com/tutorials/tutorial-one-javascript.html

// if the connection is closed or fails to be established at all, we will reconnect
var amqpConn = null;

var url = process.env.CLOUDAMQP_URL + "?heartbeat=60" || "amqp://localhost";
// attento devi aggiornare configMap di PRE E PROD
// var url = process.env.AMQP_URL + "?heartbeat=60" || "amqp://localhost?heartbeat=60";

// var durable = true;
var durable = false;

// if (process.env.ENABLE_DURABLE_QUEUE == false || process.env.ENABLE_DURABLE_QUEUE == "false") {
//   durable = false;
// }

var persistent = false;
if (process.env.ENABLE_PERSISTENT_QUEUE == true || process.env.ENABLE_PERSISTENT_QUEUE == "true") {
  persistent = true;
}

var exchange = process.env.QUEUE_EXCHANGE_TOPIC || 'amq.topic';

var queueName = process.env.QUEUE_NAME || 'jobs';
winston.info("Durable queue: " + durable + " Persistent queue: " + persistent + " Exchange topic: " + exchange+ " Queue name: " + queueName);


function start() {
  amqp.connect(url, function(err, conn) {
    if (err) {
      winston.error("[AMQP]", err);
      return setTimeout(start, 1000);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        winston.error("[AMQP] conn error", err);
      }
    });
    conn.on("close", function() {
      winston.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });

    winston.info("[AMQP] connected");
    amqpConn = conn;

    whenConnected();
  });
}

function whenConnected() {
  startPublisher();


  let jobWorkerEnabled = false;
  if (process.env.JOB_WORKER_ENABLED=="true" || process.env.JOB_WORKER_ENABLED == true) {
      jobWorkerEnabled = true;
  }
  winston.info("JobsManager jobWorkerEnabled: "+ jobWorkerEnabled);  

  if (jobWorkerEnabled == false) {
    winston.info("Queue Reconnect starts queue worker (queue observer)");
    startWorker();
  } else {
    winston.info("Queue Reconnect without queue worker (queue observer) because external worker is enabled");
  }
  
}

var pubChannel = null;
var offlinePubQueue = [];
function startPublisher() {
  amqpConn.createConfirmChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      winston.error("[AMQP] channel error", err);
    });
    ch.on("close", function() {
      winston.info("[AMQP] channel closed");
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
    pubChannel.publish(exchange, routingKey, content, { persistent: persistent },
      // pubChannel.publish(exchange, routingKey, content, { persistent: true },

                       function(err, ok) {
                         if (err) {
                          winston.error("[AMQP] publish", err);
                           offlinePubQueue.push([exchange, routingKey, content]);
                           pubChannel.connection.close();
                         }
                       });
  } catch (e) {
    winston.error("[AMQP] publish", e);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

// A worker that acks messages only if processed succesfully
// var channel;
function startWorker() {
    amqpConn.createChannel(function(err, ch) {
      if (closeOnErr(err)) return;
      ch.on("error", function(err) {
        winston.error("[AMQP] channel error", err);
      });
      ch.on("close", function() {
        winston.info("[AMQP] channel closed");
      });
      ch.prefetch(10);//leggila da env
      ch.assertExchange(exchange, 'topic', {
        durable: durable
        // durable: true
      });

      ch.assertQueue(queueName, { durable: durable }, function(err, _ok) {
      // ch.assertQueue("jobs", { durable: true }, function(err, _ok) {
        if (closeOnErr(err)) return;
        ch.bindQueue(_ok.queue, exchange, "request_create", {}, function(err3, oka) {
            winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_create");
            winston.info("Data queue", oka)
        });
        ch.bindQueue(_ok.queue, exchange, "request_update_preflight", {}, function(err3, oka) {
            winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_update_preflight");
            winston.info("Data queue", oka)
        });
        ch.bindQueue(_ok.queue, exchange, "request_participants_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_participants_update");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "request_participants_join", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_participants_join");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "request_participants_leave", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_participants_leave");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "request_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_update");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "request_close", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_close");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "request_close_extended", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: request_close_extended");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "message_create", {}, function(err3, oka) {
              winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: message_create");
              winston.info("Data queue", oka)
        });
        ch.bindQueue(_ok.queue, exchange, "project_user_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: project_user_update");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "faqbot_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: faqbot_update");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "lead_create", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: lead_create");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "lead_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: lead_update");
          winston.info("Data queue", oka)
        });

        ch.bindQueue(_ok.queue, exchange, "lead_fullname_email_update", {}, function(err3, oka) {
          winston.info("Queue bind: "+_ok.queue+ " err: "+err3+ " key: lead_fullname_email_update");
          winston.info("Data queue", oka)
        });

        




        ch.consume(queueName, processMsg, { noAck: false });
        winston.info("Worker is started");
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

  winston.debug("Got msg topic:" + topic);

  winston.debug("Got msg:"+ message_string +  " topic:" + topic);

  if (topic === 'request_create') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.create.queue', msg.content);
    requestEvent.emit('request.create.queue', JSON.parse(message_string));
  }
  if (topic === 'request_update') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.update.queue',  JSON.parse(message_string));
  }

  if (topic === 'request_update_preflight') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.update.preflight.queue',  JSON.parse(message_string));
  }    

  if (topic === 'request_participants_join') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.participants.join.queue',  JSON.parse(message_string));
  }   


  if (topic === 'request_participants_leave') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.participants.leave.queue',  JSON.parse(message_string));
  }   
  
  if (topic === 'request_participants_update') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.participants.update.queue',  JSON.parse(message_string));
  }   
  
  if (topic === 'request_close') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.close.queue',  JSON.parse(message_string));
  }     
  
  if (topic === 'request_close_extended') {
    winston.debug("reconnect here topic:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    requestEvent.emit('request.close.extended.queue',  JSON.parse(message_string));
  }     

  if (topic === 'message_create') {
    winston.debug("reconnect here topic:" + topic);
    // requestEvent.emit('request.create.queue', msg.content);
    messageEvent.emit('message.create.queue', JSON.parse(message_string));
  }
  if (topic === 'project_user_update') {
    winston.debug("reconnect here topic:" + topic);
    // requestEvent.emit('request.create.queue', msg.content);
    authEvent.emit('project_user.update.queue', JSON.parse(message_string));
  }

  if (topic === 'faqbot_update') {
    winston.debug("reconnect here topic faqbot_update:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    botEvent.emit('faqbot.update.queue',  JSON.parse(message_string));
  }

  if (topic === 'lead_create') {
    winston.debug("reconnect here topic lead_create:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    leadEvent.emit('lead.create.queue',  JSON.parse(message_string));
  }

  if (topic === 'lead_update') {
    winston.debug("reconnect here topic lead_update:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    leadEvent.emit('lead.update.queue',  JSON.parse(message_string));
  }

  if (topic === 'lead_fullname_email_update') {
    winston.debug("reconnect here topic lead_fullname_email_update:" + topic); 
    // requestEvent.emit('request.update.queue',  msg.content);
    leadEvent.emit('lead.fullname.email.update.queue',  JSON.parse(message_string));
  }



  cb(true);
//   WebSocket.cb(true);
//   requestEvent.on(msg.KEYYYYYYY+'.ws', msg.content);
}


function closeOnErr(err) {
  if (!err) return false;
  winston.error("[AMQP] error", err);
  amqpConn.close();
  return true;
}

// setInterval(function() {
//     var d = new Date();
//   publish(exchange, "request_create", Buffer.from("work work work: "+d));
//   publish(exchange, "request_update", Buffer.from("work2 work work: "+d));
// }, 1000);


function listen() {

    // http://www.squaremobius.net/amqp.node/channel_api.html
    // https://docs.parseplatform.org/parse-server/guide/#scalability

    requestEvent.on('request.create', function(request) {
      setImmediate(() => {
        winston.debug("reconnect request.create")
        publish(exchange, "request_create", Buffer.from(JSON.stringify(request)));
      });
    });

    requestEvent.on('request.update', function(request) {
      setImmediate(() => {
        winston.debug("reconnect request.update")
        publish(exchange, "request_update", Buffer.from(JSON.stringify(request)));
      });
    });

    requestEvent.on('request.participants.join', function(request) {
      setImmediate(() => {
        publish(exchange, "request_participants_join", Buffer.from(JSON.stringify(request)));
        winston.debug("reconnect participants.join published")
      });
    });

    requestEvent.on('request.participants.leave', function(request) {
      setImmediate(() => {
        publish(exchange, "request_participants_leave", Buffer.from(JSON.stringify(request)));
        winston.debug("reconnect participants.leave published")
      });
    });

    requestEvent.on('request.participants.update', function(request) {
      setImmediate(() => {
        publish(exchange, "request_participants_update", Buffer.from(JSON.stringify(request)));
        winston.debug("reconnect participants.update published")
      });
    });

    requestEvent.on('request.update.preflight', function(request) {
      setImmediate(() => {
        // winston.info("reconnect request.update.preflight")
        publish(exchange, "request_update_preflight", Buffer.from(JSON.stringify(request)));
        winston.debug("reconnect request.update.preflight published")
      });
    });

    // winston.debug("sub to reconnect request.close");
    requestEvent.on('request.close', function(request) {
      setImmediate(() => {
        winston.debug("reconnect request.close");
        publish(exchange, "request_close", Buffer.from(JSON.stringify(request)));
      });
    });

    requestEvent.on('request.close.extended', function(request) {
      setImmediate(() => {
        publish(exchange, "request_close_extended", Buffer.from(JSON.stringify(request)));
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
        winston.debug("reconnect: "+ Buffer.from(JSON.stringify(bot)))
      });
    });


    leadEvent.on('lead.create', function(lead) {
      setImmediate(() => {
        winston.debug("reconnect lead.create")
        publish(exchange, "lead_create", Buffer.from(JSON.stringify(lead)));
        winston.debug("reconnect: "+ Buffer.from(JSON.stringify(lead)))
      });
    });


    leadEvent.on('lead.update', function(lead) {
      setImmediate(() => {
        winston.debug("reconnect lead.update")
        publish(exchange, "lead_update", Buffer.from(JSON.stringify(lead)));
        winston.debug("reconnect: "+ Buffer.from(JSON.stringify(lead)))
      });
    });


    leadEvent.on('lead.fullname.email.update', function(lead) {
      setImmediate(() => {
        winston.debug("reconnect lead.fullname.email.update")
        publish(exchange, "lead_fullname_email_update", Buffer.from(JSON.stringify(lead)));
        winston.debug("reconnect: "+ Buffer.from(JSON.stringify(lead)))
      });
    });


    

}

if (process.env.QUEUE_ENABLED === "true") {
    requestEvent.queueEnabled = true;
    messageEvent.queueEnabled = true;
    authEvent.queueEnabled = true;
    botEvent.queueEnabled = true;
    leadEvent.queueEnabled = true;
    listen();
    start();
    winston.info("Queue enabled. endpoint: " + url );
} 

