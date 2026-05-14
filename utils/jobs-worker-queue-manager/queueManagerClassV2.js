var amqp = require('amqplib/callback_api');
const winston = require('../winston');
const { TiledeskWorker } = require('../tiledesk/TiledeskWorker')
const { StatusManager } = require('../tiledesk/StatusManager');
const { ContentManager } = require('../tiledesk/ContentManager');

var listeners = [];

class QueueManager {

  constructor(url, options) {
    this.debug = false;
    if (options && options.debug != undefined) {
      this.debug = options.debug;
    }

    this.pubChannel = null;
    this.offlinePubQueue = [];

    // if the connection is closed or fails to be established at all, we will reconnect
    this.amqpConn = null;

    this.url = url || "amqp://localhost";
    // process.env.CLOUDAMQP_URL + "?heartbeat=60"

    // this.exchange = 'amq.topic';
    this.exchange = 'tiledeskserver';
    if (options && options.exchange != undefined) {
      this.exchange = options.exchange;
    }
    this.defaultTopic = "subscription_run";
    if (options && options.defaultTopic != undefined) {
      this.defaultTopic = options.defaultTopic;
    }

    this.topic = "jobsmanager";
    if (options && options.topic != undefined) {
      this.topic = options.topic;
    }

    this.deleteTopic = process.env.TRAIN_DELETE_QUEUE || "content_delete";
    if (options && options.deleteTopic != undefined) {
      this.deleteTopic = options.deleteTopic;
    }

    this.deleteRoutingKey = process.env.TRAIN_DELETE_ROUTING_KEY || this.deleteTopic;
    if (options && options.deleteRoutingKey != undefined) {
      this.deleteRoutingKey = options.deleteRoutingKey;
    }

    if (this.deleteTopic === this.topic) {
      throw new Error("QueueManager: deleteTopic (TRAIN_DELETE_QUEUE) must differ from topic (main queue name)");
    }

    this.prefetch = 1;
    if (process.env.TRAIN_PREFETCH) {
      this.prefetch = Number(process.env.TRAIN_PREFETCH);
    }

    // this.listeners = [];
  }


  connect(callback) {
    var that = this;
    // console.log("[JobWorker] connect", this.url);
    // return new Promise(function (resolve, reject) {
    amqp.connect(this.url, function (err, conn) {

      if (err) {
        // if (this.debug) {console.log("[AMQP]", err.message);
        console.error("[JobWorker] AMQP error", err);
        return setTimeout(function () {
          if (that.debug) { console.log("[JobWorker] AMQP reconnecting"); }
          that.connect(callback)
        }, 1000);

      }
      conn.on("error", function (err) {
        if (err.message !== "Connection closing") {
          console.log("[JobWorker] AMQP conn error", err);
        }
      });
      conn.on("close", function () {
        if (that.debug) { console.log("[JobWorker] AMQP reconnecting"); }
        return setTimeout(() => {
          that.connect(callback);
        }, 1000);
      });

      if (that.debug) { console.log("[JobWorker] AMQP connected"); }
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
    that.amqpConn.createConfirmChannel(function (err, ch) {
      if (that.closeOnErr(err)) return;
      ch.on("error", function (err) {
        if (that.debug) { console.log("[JobWorker] AMQP channel error", err); }
      });
      ch.on("close", function () {
        if (that.debug) { console.log("[JobWorker] AMQP channel closed"); }
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
    if (that.debug) { console.log("[JobWorker] that", that); }
    if (that.debug) { console.log("[JobWorker] that.pubChannel", that.pubChannel); }
    that.pubChannel.publish(exchange, routingKey, content, { persistent: false },
      function (err, ok) {
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

    that.amqpConn.createChannel(function (err, ch) {
      if (that.closeOnErr(err)) return;
      ch.on("error", function (err) {
        if (this.debug) { console.log("[JobWorker] AMQP channel error", err); }
      });
      ch.on("close", function () {
        if (this.debug) { console.log("[JobWorker] AMQP channel closed"); }
      });
      ch.prefetch(that.prefetch);
      ch.assertExchange(that.exchange, 'topic', {
        //durable: false
        durable: true
      });

      if (that.debug) { console.log("[JobWorker] AMQP that.topic", that.topic); }
      // ch.assertQueue(that.topic, { durable: false }, function (err, _ok) {
      ch.assertQueue(that.topic, { durable: true }, function (err, _ok) {
        if (that.closeOnErr(err)) return;
        ch.bindQueue(_ok.queue, that.exchange, that.defaultTopic, {}, function (err3, oka) {
          if (that.debug) { console.log("[JobWorker] Queue bind: " + _ok.queue + " err: " + err3 + " key: " + that.defaultTopic); }
          // if (this.debug) {console.log("Data queue", oka)
        });
        ch.bindQueue(_ok.queue, that.exchange, "functions", {}, function (err3, oka) {
          if (that.debug) { console.log("[JobWorker] Queue bind: " + _ok.queue + " err: " + err3 + " key: " + "functions"); }
          // if (this.debug) {console.log("Data queue", oka)
        });

        if (that.debug) { console.log("[JobWorker] AMQP that.topic", that.topic); }
        ch.consume(_ok.queue, (msg) => {
          that.processMsg3(msg, ch);
        }, { noAck: false });

        ch.assertQueue(that.deleteTopic, { durable: true }, function (errDel, delOk) {
          if (that.closeOnErr(errDel)) return;
          ch.bindQueue(delOk.queue, that.exchange, that.deleteRoutingKey, {}, function (err4) {
            if (that.debug) { console.log("[JobWorker] Delete queue bind: " + delOk.queue + " err: " + err4 + " key: " + that.deleteRoutingKey); }
          });
          ch.consume(delOk.queue, (msg) => {
            that.processDeleteMsg(msg, ch);
          }, { noAck: false });
          if (that.debug) { console.log("[JobWorker] Delete worker is started on queue " + delOk.queue); }
        });

        if (that.debug) { console.log("[JobWorker] Worker is started"); }

        if (callback) {
          callback();
          if (that.debug) { console.log("[JobWorker] called callback worker"); }
        }
      });


    });
  }

  /**
   * Removes indexed content for the payload. Messages are consumed from the dedicated delete queue
   * (deleteTopic / TRAIN_DELETE_QUEUE); publish to the same exchange with routing key deleteRoutingKey.
   */
  async processDeleteMsg(msg, ch) {

    const message_string = msg.content.toString();
    let fdata = JSON.parse(message_string);
    let source = fdata.payload;

    winston.debug("Delete job payload: ", source);

    const tiledesk_worker = new TiledeskWorker({ gptkey: null, interval: null });
    const status_manager = new StatusManager();
    const content_manager = new ContentManager();

    await status_manager.changeStatus(source.id, 500);

    tiledesk_worker.deleteFromIndex(source, async (err, response) => {
      if (err) {
        winston.error("Error on delete from index: " + err);
        let error_message = err.response?.data?.error || "An unexpected error occurred";
        status_manager.changeStatus(source.id, 300, error_message).then((updateResponse) => {
          winston.verbose("changeStatus response: ", updateResponse);
          ch.ack(msg);
        }).catch((err) => {
          winston.error("changeStatus error: ", err);
          ch.ack(msg);
        });
      } else {
        content_manager.deleteContent(source.id).then((deleteResponse) => {
          winston.verbose("deleteContent response: ", deleteResponse);
          ch.ack(msg);
        }).catch((err) => {
          winston.error("deleteContent error: ", err);
          ch.ack(msg);
        });
      }
    });

  }

  /**
   * Specific processMsg function for Scrape operation
   */
  async processMsg3(msg, ch) {

    const message_string = msg.content.toString();
    let fdata = JSON.parse(message_string);
    let source = fdata.payload

    winston.debug("Source: ", source)
    // console.log("fdata.payload.resources[0]: ", fdata.payload.resources[0]);

    const tiledesk_worker = new TiledeskWorker({ gptkey: null, interval: null });
    const status_manager = new StatusManager();

    await status_manager.changeStatus(source.id, 200);

    tiledesk_worker.train(source, async (err, response) => {
      if (err) {
        winston.error("Error on train: " + err)
        let error_message = err.response?.data?.error || "An unexpected error occurred";
        status_manager.changeStatus(source.id, 400, error_message).then((updateResponse) => {
          winston.verbose("changeStatus response: ", updateResponse)
          ch.ack(msg);
        }).catch((err) => {
          winston.error("changeStatus error: ", err)
          ch.ack(msg);
        })
      } else {
        status_manager.changeStatus(response.id, response.status).then((updateResponse) => {
          winston.verbose("changeStatus response: ", updateResponse)
          ch.ack(msg);
        }).catch((err) => {
          winston.error("changeStatus error: ", err)
          ch.ack(msg);
        })
      }
    });

  }

  closeOnErr(err) {
    if (!err) return false;
    console.error("[JobWorker] AMQP error", err);
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
    if (this.debug) { console.log("[JobWorker] send(string): ", string); }
    this.publish(this.exchange, topic || this.defaultTopic, Buffer.from(string));
  }

  on(fn) {
    listeners.push(fn);
  }



}




module.exports = QueueManager;
