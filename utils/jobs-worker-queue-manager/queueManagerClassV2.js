var amqp = require('amqplib/callback_api');

var listeners = [];


class QueueManager {

constructor(url, options) {
  this.debug = false;    
  if (options && options.debug!=undefined) {
      this.debug = options.debug;
  }

  this.pubChannel = null;
  this.offlinePubQueue = [];

  // if the connection is closed or fails to be established at all, we will reconnect
  this.amqpConn = null;

  this.url = url  || "amqp://localhost";
  // process.env.CLOUDAMQP_URL + "?heartbeat=60"

  // this.exchange = 'amq.topic';
  this.exchange = 'tiledeskserver';
  if (options && options.exchange!=undefined) {
      this.exchange = options.exchange;
  }
  this.defaultTopic = "subscription_run";
  if (options && options.defaultTopic!=undefined) {
    this.defaultTopic = options.defaultTopic;
  }

  this.topic = "jobsmanager";
  if (options && options.topic!=undefined) {
    this.topic = options.topic;
  }

  // this.listeners = [];
}


connect(callback) {
  var that = this;
  // console.log("[JobWorker] connect", this.url);
  // return new Promise(function (resolve, reject) {
    amqp.connect(this.url, function(err, conn) {
      if (err) {
        // if (this.debug) {console.log("[AMQP]", err.message);
        if (that.debug) {console.log("[JobWorker] AMQP", err);}

        return setTimeout(function() {
          that.connect()
        }, 1000);
      }
      conn.on("error", function(err) {
        if (err.message !== "Connection closing") {
          if (that.debug) {console.log("[JobWorker] AMQP conn error", err);}
        }
      });
      conn.on("close", function() {
        if (that.debug) {console.log("[JobWorker] AMQP reconnecting");}
        return setTimeout(that.connect, 1000);
      });

      if (that.debug) {console.log("[JobWorker] AMQP connected");}
      that.amqpConn = conn;

      // that.whenConnected(callback);

      if (callback) {
        callback();
      }
    //   return resolve();
    // });
  });
}

close(callback) {
  if (this.debug) { console.log("Closing connection.."); };
  this.amqpConn.close((err) => {
    callback(err);
  });

}

whenConnected(callback) {
  var that = this;
  // that.startPublisher(callback);
  that.startPublisher();
  that.startWorker(callback);
}


startPublisher(callback) {
  var that = this;
  that.amqpConn.createConfirmChannel(function(err, ch) {
    if (that.closeOnErr(err)) return;
    ch.on("error", function(err) {
      if (that.debug) {console.log("[JobWorker] AMQP channel error", err);}
    });
    ch.on("close", function() {
      if (that.debug) {console.log("[JobWorker] AMQP channel closed");}
    });

    // if (this.debug) {console.log("[AMQP] pubChannel");
    that.pubChannel = ch;
    // console.log("[JobWorker] that.pubChannel",that.pubChannel);
    // while (true) {
    //   var m = that.offlinePubQueue.shift();
    //   if (!m) break;
    //   that.publish(m[0], m[1], m[2]);
    // }

    if (callback) {
        callback(err);
    }

  });
}

// method to publish a message, will queue messages internally if the connection is down and resend later
publish(exchange, routingKey, content, callback) {
  var that = this;
  if (that.debug) {console.log("[JobWorker] that", that);}
  if (that.debug) {console.log("[JobWorker] that.pubChannel", that.pubChannel);}
  that.pubChannel.publish(exchange, routingKey, content, { persistent: false },
    function(err, ok) {
      callback(err, ok)
    }
  );

  // try {
  //   if (that.debug) {console.log("[JobWorker] that", that);}
  //   if (that.debug) {console.log("[JobWorker] that.pubChannel", that.pubChannel);}
  //   that.pubChannel.publish(exchange, routingKey, content, { persistent: false },
  //                      function(err, ok) {
  //                         callback(err, ok)
  //                       //  if (err) {
  //                       //   // if (that.debug) {console.log("[JobWorker] AMQP publish", err);}
  //                       //   // console.log("[JobWorker] AMQP publish", err);
  //                       //   // that.offlinePubQueue.push([exchange, routingKey, content]);
  //                       //   // that.pubChannel.connection.close();
  //                       //  }
  //                       //  console.log("publish OK")
  //                       // //  if (that.debug) {console.log("[AMQP] publish sent", content);}
  //                      });
  // } catch (e) {
  //   console.log("[JobWorker] AMQP publish catch", e);
  //   if (this.debug) {console.log("[JobWorker] AMQP publish", e);}
  //   that.offlinePubQueue.push([exchange, routingKey, content]);
  // }
}

// A worker that acks messages only if processed succesfully
// var channel;
startWorker(callback) {
  var that = this;

    that.amqpConn.createChannel(function(err, ch) {
      if (that.closeOnErr(err)) return;
      ch.on("error", function(err) {
        if (this.debug) {console.log("[JobWorker] AMQP channel error", err);}
      });
      ch.on("close", function() {
        if (this.debug) {console.log("[JobWorker] AMQP channel closed");}
      });
      ch.prefetch(10);
      ch.assertExchange(that.exchange, 'topic', {
        durable: false
      });

      if (that.debug) {console.log("[JobWorker] AMQP that.topic", that.topic);}
      ch.assertQueue(that.topic, { durable: false }, function(err, _ok) {
        if (that.closeOnErr(err)) return;
        ch.bindQueue(_ok.queue, that.exchange, that.defaultTopic, {}, function(err3, oka) {
          if (that.debug) {console.log("[JobWorker] Queue bind: "+_ok.queue+ " err: "+err3+ " key: " + that.defaultTopic );}
            // if (this.debug) {console.log("Data queue", oka)
        });    
        ch.bindQueue(_ok.queue, that.exchange, "functions", {}, function(err3, oka) {
          if (that.debug) {console.log("[JobWorker] Queue bind: "+_ok.queue+ " err: "+err3+ " key: " + "functions" );}
          // if (this.debug) {console.log("Data queue", oka)
        });    

        if (that.debug) {console.log("[JobWorker] AMQP that.topic", that.topic);}
        ch.consume(that.topic, that.processMsg2, { noAck: true });
        // ch.consume("jobs", that.processMsg, { noAck: false });
        if (that.debug) {console.log("[JobWorker] Worker is started");}

        if (callback) {
          callback();
          if (that.debug) {console.log("[JobWorker] called callback worker");}
        }
      });
  

    });
}



// work(msg, cb) {
//   const message_string = msg.content.toString();
//   const topic = msg.fields.routingKey //.replace(/[.]/g, '/');

//   if (this.debug) {console.log("Got msg topic:" + topic);

//   if (this.debug) {console.log("Got msg:"+ message_string +  " topic:" + topic);

//   if (topic === 'subscription_run') {
//     if (this.debug) {console.log("here topic:" + topic);
//     // requestEvent.emit('request.create.queue', msg.content);
//     subscriptionEvent.emit('subscription.run.queue', JSON.parse(message_string));
//   } 
//   cb(true);
//   if (this.debug) {console.log("okookokkkkkkk msg:");
// }

processMsg2(msg) {

  // console.log("processMsg2:", msg);

  const message_string = msg.content.toString();
  // console.log("processMsg2.1:", msg);

  const topic = msg.fields.routingKey //.replace(/[.]/g, '/');
  // console.log("processMsg2.2:", msg);

  // if (this.debug) {console.log("Got msg topic:" + topic);} //this is undefined in this method
  // console.log("Got msg topic:" + topic);

  // if (this.debug) {console.log("Got msg1:"+ message_string +  " topic:" + topic);}
  // console.log("Got msg1:"+ message_string +  " topic:" + topic);

  if (topic === 'functions') {
    // if (this.debug) {console.log("Got msg2:"+ JSON.stringify(message_string) +  " topic:" + topic);}
    // console.log("Got msg2:"+ JSON.stringify(message_string) +  " topic:" + topic);

    var fdata = JSON.parse(message_string)

    // if (this.debug) {console.log("Got msg3:"+ fdata.function +  " fdata.function:",  fdata.payload);}



    /*

    // var fields = Object.keys(fdata.payload).map((key) => [key, fdata.payload[key]]);
    
    // var fields = Object.keys(fdata.payload)

    // if (this.debug) {console.log("Got fields:"+ fields );

    // eval(fdata.function)

    */
   
    if (fdata.function) {
      var fn = new Function("payload", fdata.function);

      // if (this.debug) {console.log("Got fn:"+ fn);}

    /*  
      // var fn = new Function(fields, fdata.function);
      
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function
      // var fn = new Function("name",'if (this.debug) {console.log("ciao: " + name);');
      // fn("andrea")

      // var dataArray = Object.keys(fdata.payload).map(function(k){return fdata.payload[k]});
      // if (this.debug) {console.log("Got dataArray:", dataArray );

      // fn(dataArray);
    */


      var ret = fn(fdata.payload)
      // if (this.debug) {console.log("Got ret:"+ ret);}
      // console.log("Got ret:"+ ret);

    }

    // else {
    //   console.log("no function found");
    // }
    

  }

  // if (topic === 'subscription_run') {
  //   if (this.debug) {console.log("here topic:" + topic);
  //   // requestEvent.emit('request.create.queue', msg.content);
  //   subscriptionEvent.emit('subscription.run.queue', JSON.parse(message_string));
  // } 
  

  // serve?
  // if (this.debug) {console.log("listeners.length:" + listeners.length);}

  if (listeners && listeners.length>0) {
    for( var i = 0; i< listeners.length; i++) {
      // if (this.debug) {console.log("listeners[i]:" + listeners[i]);}
      listeners[i](fdata);
    }
  }

  // if (this.debug) {console.log("listeners", this.listeners);
}
// processMsg(msg) {
//   if (this.debug) {console.log("processMsg msg:", msg);

//   var that = this;
//   that.work(msg, function(ok) {
//     try {
//       if (ok)
//         ch.ack(msg);
//       else
//         ch.reject(msg, true);
//     } catch (e) {
//       that.closeOnErr(e);
//     }
//   });
// }

closeOnErr(err) {
  if (!err) return false;
  if (this.debug) {console.log("[JobWorker] AMQP error", err);}
  this.amqpConn.close();
  return true;
}

sendJson(data, topic, callback) {

  this.publish(this.exchange, topic || this.defaultTopic, Buffer.from(JSON.stringify(data)), (err, ok) => {
    if (callback) {
      callback(err, ok);
    }
  });
}

send(string, topic) {
  if (this.debug) {console.log("[JobWorker] send(string): ", string);}
  this.publish(this.exchange, topic || this.defaultTopic, Buffer.from(string));
}

on(fn) {
  listeners.push(fn);
}



}




module.exports = QueueManager;
