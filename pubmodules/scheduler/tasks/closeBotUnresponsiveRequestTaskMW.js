
'use strict';


var schedule = require('node-schedule');
var winston = require('../../../config/winston');
var Request = require("../../../models/request");
var requestService = require("../../../services/requestService");
const Message = require('../../../models/message');


class CloseBotUnresponsiveRequestTaskMW {

constructor() {
  this.enabled = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_ENABLE || "true"; 
  this.cronExp = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/5 * * * *'; // every 5 minutes  // every 30 seconds '*/30 * * * * *';
  this.queryAfterTimeoutStandard = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT) || 1 * 24 * 60 * 60 * 1000; //two days ago //172800000 two days // 86400000 a day
  this.queryAfterTimeout = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT_MW) || 60 * 60 * 1000; // 60*60*1000 = 3600000 ms = 1 hour
  this.queryLimit = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_LIMIT) || 10;
  this.queryProject = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_FILTER_ONLY_PROJECT_MW; //example in PRE: {"$in":["5fc224ce05416200342af18a","5fb3e3cb0150a00034ab77d5"]}
  this.delayBeforeClosing = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_DELAY) || 1000;
  // winston.info("delayBeforeClosing: "+ this.delayBeforeClosing);

  if (this.queryProject) {
    winston.info("CloseBotUnresponsiveRequestTaskMW filter only by projects enabled: " + this.queryProject );
  }
//  qui ha senso la query?????? nn viene piu ricaricata?

    // var stringQuery = process.env.CLOSE_UNRESPONSIVE_REQUESTS_QUERY;
  // if (stringQuery) {
  //   this.query = JSON.parse(stringQuery) || {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };
  // }else {
  //   this.query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} }; 
  // }
  
}

run() {
    if (this.enabled == "true") {
      winston.info("CloseBotUnresponsiveRequestTaskMW started" );
      this.scheduleUnresponsiveRequests();
    } else {
      winston.info("CloseBotUnresponsiveRequestTaskMW disabled" );
    }
}

scheduleUnresponsiveRequests() {
  var that = this;
  winston.info("CloseBotUnresponsiveRequestTaskMW task scheduleUnresponsiveRequests launched with closeAfter : " + this.queryAfterTimeout + " milliseconds, cron expression: " + this.cronExp + " and query limit: " +this.queryLimit);
  // if (this.queryProject) {
  //   winston.info("CloseBotUnresponsiveRequestTask query altered: " + JSON.stringify(this.query));
  // }

 //https://crontab.guru/examples.html
 var s= schedule.scheduleJob(this.cronExp, function(fireDate){   //TODO aggiungi un bias random

    let timeInMs = Math.random() * (1000);  // avoid cluster concurrent jobs in multiple nodes delay between 0 and 1sec
    winston.debug('timeInMs => '+ timeInMs);

    setTimeout(function () {
      winston.debug('CloseBotUnresponsiveRequestTaskMW scheduleUnresponsiveRequests job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
      that.findUnresponsiveRequests(); 
    },timeInMs );
  });
}


findUnresponsiveRequests() {
  var that = this;

  // db.getCollection('requests').find({"hasBot":true, "status": { "$lt": 1000 }, "createdAt":  { "$lte" :new ISODate("2020-11-28T20:15:31Z")} }).count()
    

  //   TODO escludi i ticket offline
    // var query = { };
    var query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };

    if (this.queryProject) {
      //query.id_project = JSON.parse(this.queryProject);
      query.id_project = this.queryProject;
    }

    //    TODO dovrei fare una query escludendo tutti gli id_project su cui è disabilitato oppure dovrei salvare un attribute in ogni singola request

    winston.debug("CloseBotUnresponsiveRequestTaskMW query",query);

    Request.find(query)
    .sort({createdAt: 'asc'}) //DA TESTARE
    .limit(this.queryLimit).exec(function(err, requests) {
      //it is limited to 1000 results but after same days it all ok
      if (err) {
          winston.error("CloseBotUnresponsiveRequestTaskMW error getting unresponsive requests ", err);
          return 0;
      }

      // winston.info("delayBeforeClosing: "+ that.delayBeforeClosing);

      if (!requests || (requests && requests.length==0)) {
          winston.verbose("CloseBotUnresponsiveRequestTaskMW no unresponsive requests found ");
          return 0;
      }

      winston.info("CloseBotUnresponsiveRequestTaskMW: found " + requests.length +  " unresponsive requests");
      winston.debug("CloseBotUnresponsiveRequestTaskMW: found unresponsive requests ", requests);

      let i = 0;
      let delay = 0;
      // winston.info("delay" + delay);

      requests.forEach(request => {
        i++;
        delay = 2*that.delayBeforeClosing*i;
        winston.debug("CloseBotUnresponsiveRequestTaskMW: delay : " + delay);

        setTimeout(function(){

          //  TODO aggiungi uno sleep
          winston.debug("********unresponsive request : "+ request.first_text);
          // winston.debug("********unresponsive request ", request);

          let participant_bot_id;
          if (request.participantsBots.length == 1) {
            participant_bot_id = request.participantsBots[0];
          }

          console.log("Try to close request: ", request.request_id);
          console.log("participant_bot_id: ", participant_bot_id)

          Message.find({ id_project: request.id_project, recipient: request.request_id })
              .sort({createdAt: -1})
              .limit(1)
              .exec((err, message) => {
                if (err) { 
                  winston.error("No messages found for recipient: ", request.request_id); 
                } else {

                  console.log("Try to close request last message: ", message);
                  if (!participant_bot_id) {
                    console.log("Try to close request participant_bot_id undefined");
                    const closed_by = "_bot_unresponsive";
                    return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false, closed_by).then(function(updatedStatusRequest) {
                      winston.info("CloseBotUnresponsiveRequestTaskMW: Request closed with request_id: " + request.request_id);
                      // winston.info("Request closed",updatedStatusRequest);
                    }).catch(function(err) {
                      if (process.env.HIDE_CLOSE_REQUEST_ERRORS == true || process.env.HIDE_CLOSE_REQUEST_ERRORS == "true" ) {
          
                      } else {
                        winston.error("CloseBotUnresponsiveRequestTaskMW: Error closing the request with request_id: " + request.request_id, err);
                      }
                    })
                  } else {

                    console.log("message.sender: ", message[0].sender)
                    if (message[0].sender === participant_bot_id) {
                      console.log("Try to close request message.sender === participant_bot_id");
                      //  closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
                      const closed_by = "_bot_unresponsive";
                      return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false, closed_by).then(function(updatedStatusRequest) {
                        winston.info("CloseBotUnresponsiveRequestTaskMW: Request closed with request_id: " + request.request_id);
                        // winston.info("Request closed",updatedStatusRequest);
                      }).catch(function(err) {
                        if (process.env.HIDE_CLOSE_REQUEST_ERRORS == true || process.env.HIDE_CLOSE_REQUEST_ERRORS == "true" ) {
            
                        } else {
                          winston.error("CloseBotUnresponsiveRequestTaskMW: Error closing the request with request_id: " + request.request_id, err);
                        }
                        
                      })
                    } else if ((request.createdAt - new Date(Date.now() - this.queryAfterTimeoutStandard)) < 0) {
                      console.log("Try to close request elapsed", request.createdAt - new Date(Date.now() - this.queryAfterTimeoutStandard));
                      const closed_by = "_bot_unresponsive";
                      return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false, closed_by).then(function(updatedStatusRequest) {
                        winston.info("CloseBotUnresponsiveRequestTaskMW: Request closed with request_id: " + request.request_id);
                        // winston.info("Request closed",updatedStatusRequest);
                      }).catch(function(err) {
                        if (process.env.HIDE_CLOSE_REQUEST_ERRORS == true || process.env.HIDE_CLOSE_REQUEST_ERRORS == "true" ) {
            
                        } else {
                          winston.error("CloseBotUnresponsiveRequestTaskMW: Error closing the request with request_id: " + request.request_id, err);
                        }
                        
                      })
                    } else {
                      console.log("Not your moment");
                      winston.debug("Not your moment")
                    }

                  }
                  
                }

              })
        }, delay)

      });

    

    });
  }


  

   
}
 
 
 
 
var closeBotUnresponsiveRequestTaskMW = new CloseBotUnresponsiveRequestTaskMW();


module.exports = closeBotUnresponsiveRequestTaskMW;