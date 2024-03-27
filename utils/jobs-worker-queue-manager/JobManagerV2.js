var QueueManager = require("./queueManagerClassV2");

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
        
        this.queueManager.connect(function() {
            if (that.debug) {console.log("[JobWorker] Queue started");}
            that.queuePublisherConnected = true;

            that.queueManager.startPublisher(function() {
                if (that.debug) {console.log("[JobWorker] Queue that.sendingJobs.length",that.sendingJobs.length);}
                if (that.sendingJobs.length > 0) {
                    for (var i = 0; i<that.sendingJobs.length; i++) {
                        if (that.debug) {console.log("[JobWorker] Queue that.sendingJobs[i]",that.sendingJobs[i]);}
                        // that.queueManager.send(that.sendingJobs[i].toString(), "functions");
                        that.queueManager.sendJson(that.sendingJobs[i], "functions");
                        // that.sendingJobs[i]();
                    }
                    //that.sendingJob = [];
                    that.sendingJobs.length = 0; //empty array that.sendingJobs
                    if (that.debug) {console.log("[JobWorker] that.sendingJobs[i] cleared",that.sendingJobs);}

                } 

                if (callback) {
                    callback();
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
            this.queueManager.sendJson(packet, "functions", (err, ok) => {
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


    //Deprecated
    schedule(fn, payload) {
        
        var func = {function: fn.toString(), payload: payload}
        // if (this.debug) {console.log("JobManager this.queueConnected",this.queueStarted);
        if (this.queuePublisherConnected == true) {
            if (this.debug) {console.log("[JobWorker] JobManager  this.queuePublisherConnected == true");}
            this.queueManager.send(func, "functions");

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