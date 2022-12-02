
'use strict';


var schedule = require('node-schedule');
var winston = require('../../../config/winston');
var Request = require("../../../models/request");
var requestService = require("../../../services/requestService");


class CloseAgentUnresponsiveRequestTask {

constructor() {
  this.enabled = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_ENABLE || "false"; 
  this.cronExp = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/30 * * * *'; //every 30 minutes
  this.queryAfterTimeout = parseInt(process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT) || 5 * 24 * 60 * 60 * 1000; //five days ago // 86400000 a day
  this.queryLimit = parseInt(process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_QUERY_LIMIT) || 10;
  this.queryProject = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_QUERY_FILTER_ONLY_PROJECT;

  if (this.queryProject) {
    winston.info("CloseAgentUnresponsiveRequestTask filter only by projects enabled: " + this.queryProject );
  }
  
  // var stringQuery = process.env.CLOSE_UNRESPONSIVE_REQUESTS_QUERY;
  // if (stringQuery) {
  //   this.query = JSON.parse(stringQuery) || {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };
  // }else {
  //   this.query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} }; 
  // }
  
}

run() {    
    if (this.enabled == "true") {
      winston.info("CloseAgentUnresponsiveRequestTask started" );
      this.scheduleUnresponsiveRequests();
    } else {
      winston.info("CloseAgentUnresponsiveRequestTask disabled" );
    }
}

scheduleUnresponsiveRequests() {
  var that = this;
  winston.info("CloseAgentUnresponsiveRequestTask task scheduleUnresponsiveRequests launched with closeAfter : " + this.queryAfterTimeout + " milliseconds, cron expression: " + this.cronExp + " and query limit: " +this.queryLimit);
  // if (this.queryProject) {
  //   winston.info("CloseAgentUnresponsiveRequestTask query altered: "+ JSON.stringify(this.query));
  // }

 //https://crontab.guru/examples.html
 var s= schedule.scheduleJob(this.cronExp, function(fireDate){
    winston.debug('CloseAgentUnresponsiveRequestTask ScheduleUnresponsiveRequests job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    that.findUnresponsiveRequests(); 
  });
}


findUnresponsiveRequests() {
    

  // db.getCollection('requests').find({"hasBot":true, "status": { "$lt": 1000 }, "createdAt":  { "$lte" :new ISODate("2020-11-28T20:15:31Z")} }).count()    
    
    //RETEST IT
    var query = {hasBot:false, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };

    if (this.queryProject) {
      query.id_project = this.queryProject;
    }
    winston.debug("CloseAgentUnresponsiveRequestTask query",query);
    
    Request.find(query).limit(this.queryLimit).exec(function(err, requests) {
      //it is limited to 1000 results but after same days it all ok
      if (err) {
          winston.error("CloseAgentUnresponsiveRequestTask error getting unresponsive requests ", err);
          return 0;
      }
      if (!requests || (requests && requests.length==0)) {
          winston.verbose("CloseAgentUnresponsiveRequestTask no unresponsive requests found ");
          return 0;
      }

      winston.verbose("CloseAgentUnresponsiveRequestTask: found " + requests.length +  " unresponsive requests");
      winston.debug("CloseAgentUnresponsiveRequestTask: found unresponsive requests ", requests);

      requests.forEach(request => {
        winston.debug("********unresponsive request ", request);

        // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
        const closed_by = "_bot_unresponsive";
        return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false, closed_by).then(function(updatedStatusRequest) {
          winston.verbose("CloseAgentUnresponsiveRequestTask: Request closed with request_id: " + request.request_id);
          // winston.info("Request closed",updatedStatusRequest);
        }).catch(function(err) {
          if (process.env.HIDE_CLOSE_REQUEST_ERRORS == true || process.env.HIDE_CLOSE_REQUEST_ERRORS == "true" ) {

          } else {
            winston.error("CloseAgentUnresponsiveRequestTask: Error closing the request with request_id: " + request.request_id, err);
          }
          
        })
     
      });

    

    });
  }


  

   
}
 
 
 
 
var closeAgentUnresponsiveRequestTask = new CloseAgentUnresponsiveRequestTask();


module.exports = closeAgentUnresponsiveRequestTask;