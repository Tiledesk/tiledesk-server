
'use strict';


var winston = require('../../config/winston');
var Request = require("../../models/request");
var requestService = require("../../services/requestService");

var Agenda = require("agenda");
const mongoConnectionString = 'mongodb://127.0.0.1/agenda'; 
const agenda = new Agenda({db: {address: mongoConnectionString}});


//UI 
// npx agendash --db=mongodb://localhost/agenda --collection=agendaJobs --port=3001

class RequestTaskScheduler {

constructor() {
  this.closeUnresponsiveRequestsCronExp = process.env.CLOSE_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/30 * * * * *'; // '*/1 * * * * *'every second
  this.closeUnresponsiveRequestsAfterTimeout = process.env.CLOSE_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT || 2 * 24 * 60 * 60 * 1000; //two days
}

run() {
    // var that = this;
    // findUnresponsiveRequests();
    winston.info("RequestTaskScheduler listen started" );
    this.scheduleUnresponsiveRequests();
}

scheduleUnresponsiveRequests() {
  var that = this;
  winston.info("RequestTaskScheduler task scheduleUnresponsiveRequests launched with closeAfter : " + this.closeUnresponsiveRequestsAfterTimeout + " cron expression: " + this.closeUnresponsiveRequestsCronExp);

 //https://crontab.guru/examples.html
//  var s= schedule.scheduleJob(this.closeUnresponsiveRequestsCronExp, function(fireDate){
//     winston.info('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
//     that.findUnresponsiveRequests(); 
//   });

  agenda.define('closeUnresponsiveRequests', async job => {
    that.findUnresponsiveRequests(); 
  });
   
  (async function() { // IIFE to give access to async/await
    await agenda.start();
     
    // Alternatively, you could also do:
    await agenda.every(that.closeUnresponsiveRequestsCronExp, 'closeUnresponsiveRequests');
  })();


}


findUnresponsiveRequests() {
    
    // togli
    this.closeUnresponsiveRequestsAfterTimeout = 1;

  // db.getCollection('requests').find({"hasBot":true, "status": { "$lt": 1000 }, "createdAt":  { "$lte" :new ISODate("2020-11-28T20:15:31Z")} }).count()
    var query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.closeUnresponsiveRequestsAfterTimeout ).toISOString()} };

    // togli
    query.id_project = "5fc224ce05416200342af18a";
    
    winston.info("**********query",query);

    Request.find(query).limit(1).exec(function(err, requests) {
      //it is limited to 1000 results but after same days it all ok
      if (err) {
          winston.error("RequestTaskScheduler error getting unresponsive requests ", err);
          return 0;
      }
      if (!requests || (requests && requests.length==0)) {
          winston.info("RequestTaskScheduler no unresponsive requests found ");
          return 0;
      }

      winston.info("********unresponsive requests ", requests);
      
      requests.forEach(request => {
        winston.info("********unresponsive request ", request);

        return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false).then(function(updatedStatusRequest) {
          winston.info("Request closed");
          // winston.info("Request closed",updatedStatusRequest);
        }).catch(function(err) {
          winston.error("Error closing the request",err);
        })

      });

    

    });
  }


  

   
}
 
 
 
 
var requestTaskScheduler = new RequestTaskScheduler();


module.exports = requestTaskScheduler;