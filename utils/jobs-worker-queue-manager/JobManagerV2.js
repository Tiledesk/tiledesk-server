var QueueManager = require("./queueManagerClassV2");
const { ROUTING_KEY_INDEX, ROUTING_KEY_DELETE, ROUTING_KEY_UPDATE } = require("./trainJobConstants");

class JobManager {
    constructor(queueUrl, options) {
        this.queueUrl = queueUrl;
        // this.queueManager = null;
        this.debug = false;    
        if (options && options.debug!=undefined) {
            this.debug = options.debug;
        }

        this.info = true;
        this.queueManager = new QueueManager(this.queueUrl, options);

        this.sendingJobs = [];
        this.queuePublisherConnected = false;
        this.queueConsumerConnected = false;

    }
    connectAndStartPublisher(callback) {
        var that = this;
        if (this.info) {console.log("[JobWorker] JobManager publisher started");}
        
        this.queueManager.connect(function(status, err) {

            if (err) {
                console.log("[JobWorker] - connectAndStartPublisher - connection error: ", err);
                if (callback) {
                    callback(null, err)
                    return;
                }
            }
            if (that.debug) {console.log("[JobWorker] Queue started");}
            that.queuePublisherConnected = true;

            that.queueManager.startPublisher(function() {
                if (that.debug) {console.log("[JobWorker] Queue that.sendingJobs.length",that.sendingJobs.length);}
                if (that.sendingJobs.length > 0) {
                    for (var i = 0; i<that.sendingJobs.length; i++) {
                        if (that.debug) {console.log("[JobWorker] Queue that.sendingJobs[i]",that.sendingJobs[i]);}
                        // that.queueManager.send(that.sendingJobs[i].toString(), "functions");
                    that.queueManager.sendJson(that.sendingJobs[i], ROUTING_KEY_INDEX);
                        // that.sendingJobs[i]();
                    }
                    //that.sendingJob = [];
                    that.sendingJobs.length = 0; //empty array that.sendingJobs
                    if (that.debug) {console.log("[JobWorker] that.sendingJobs[i] cleared",that.sendingJobs);}

                } 

                if (callback) {
                    callback(status, null);
                    return;
                }
            });
        });
    }

    diconnectPublisher(callback) {

        if (this.info) {console.log("[JobWorker] JobManager publisher disconnected");}

        this.queueManager.close((err) => {
            if (err) {
                console.error("JobManager: error closing connection: ", err);
            }
            callback(err);
        })
        

    }

    connectAndStartWorker() {
        var that = this;
        if (this.info) {console.log("[JobWorker] JobManager worker started");}
        
        this.queueManager.connect(function() {
            if (that.debug) {console.log("[JobWorker] Queue started");}
            that.queueConsumerConnected = true;

            that.queueManager.startWorker(function() {
                if (that.debug) {console.log("[JobWorker] Queue that.queueManager.startWorker");}               
            });
        });
    }

    publish(payload, callback) {
        
        var packet = {payload: payload}
        // if (this.debug) {console.log("JobManager this.queueConnected",this.queueStarted);
        if (this.queuePublisherConnected == true) {

            if (this.debug) {console.log("[JobWorker] JobManager  this.queuePublisherConnected == true");}
            this.queueManager.sendJson(packet, ROUTING_KEY_INDEX, (err, ok) => {
                if (err) {
                    console.error("sendJson error: ", err);
                } else {
                    if (this.debug) { console.log("sendJson ok"); };
                }
                callback(err, ok);
            });

            // this.queueManager.on(fn);
        } 
        // else {
        //     if (this.debug) {console.log("[JobWorker] JobManager  this.queuePublisherConnected == false");}
            
        //     this.connectAndStartPublisher();
        //     this.sendingJobs.push(packet);

        // }
       
    }

    /**
     * Pubblica un job di update sulla coda (routing key: update).
     * Body: { payload: { id, ... } }. Il consumer chiama l'API /update.
     */
    publishUpdate(payload, callback) {
        const packet = { payload: payload };
        if (this.queuePublisherConnected === true) {
            if (this.debug) { console.log("[JobWorker] JobManager publishUpdate"); }
            this.queueManager.sendJson(packet, ROUTING_KEY_UPDATE, (err, ok) => {
                if (err) {
                    console.error("sendJson (update) error: ", err);
                } else if (this.debug) {
                    console.log("sendJson (update) ok");
                }
                if (callback) callback(err, ok);
            });
        } else {
            const err = new Error("Publisher not connected");
            if (callback) callback(err, null);
        }
    }

    /**
     * Pubblica un job di delete sulla coda (routing key: delete).
     * Body: { payload: { id, ... } }. Il consumer chiama l'API /delete.
     */
    publishDelete(payload, callback) {
        const packet = { payload: payload };
        if (this.queuePublisherConnected === true) {
            if (this.debug) { console.log("[JobWorker] JobManager publishDelete"); }
            this.queueManager.sendJson(packet, ROUTING_KEY_DELETE, (err, ok) => {
                if (err) {
                    console.error("sendJson (delete) error: ", err);
                } else if (this.debug) {
                    console.log("sendJson (delete) ok");
                }
                if (callback) callback(err, ok);
            });
        } else {
            const err = new Error("Publisher not connected");
            if (callback) callback(err, null);
        }
    }

    //Deprecated
    schedule(fn, payload) {
        
        var func = {function: fn.toString(), payload: payload}
        // if (this.debug) {console.log("JobManager this.queueConnected",this.queueStarted);
        if (this.queuePublisherConnected == true) {
            if (this.debug) {console.log("[JobWorker] JobManager  this.queuePublisherConnected == true");}
            this.queueManager.send(func, ROUTING_KEY_INDEX);

            // this.queueManager.on(fn);
        } else {
            if (this.debug) {console.log("[JobWorker] JobManager  this.queuePublisherConnected == false");}
            
            this.connectAndStartPublisher();
            this.sendingJobs.push(func);

        }
       
    }

    run(callback) {
        // if (this.queueConsumerConnected == true) {
        //     if (this.debug) {console.log("JobManager  this.queueConsumerConnected == true");
        //     this.queueManager.send(fn.toString(), "functions");

        // } else {
            if (this.debug) {console.log("[JobWorker] JobManager connectAndStartWorker");}
            this.connectAndStartWorker();

            if (callback) {
                if (this.debug) {console.log("[JobWorker] JobManager  callback", callback);}
                this.queueManager.on(callback);
            }
        // }
    }
}



module.exports = JobManager;
module.exports.ROUTING_KEY_INDEX = ROUTING_KEY_INDEX;
module.exports.ROUTING_KEY_DELETE = ROUTING_KEY_DELETE;
module.exports.ROUTING_KEY_UPDATE = ROUTING_KEY_UPDATE;