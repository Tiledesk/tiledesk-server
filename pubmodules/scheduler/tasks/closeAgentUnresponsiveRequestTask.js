'use strict';

const schedule = require('node-schedule');
const winston = require('../../../config/winston');
const Request = require("../../../models/request");
const requestService = require("../../../services/requestService");

/**
 * Task scheduler for automatically closing agent unresponsive requests.
 * Finds requests with agents that haven't been updated within a specified timeout
 * and closes them automatically.
 */
class CloseAgentUnresponsiveRequestTask {

  constructor() {

    this.enabled = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_ENABLE || "false"; 
    this.cronExp = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/30 * * * *'; //every 30 minutes

    const afterTimeout = Number(process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT);
    this.queryAfterTimeout = !isNaN(afterTimeout) && afterTimeout > 0
      ? afterTimeout
      : 2 * 24 * 60 * 60 * 1000; //two days ago //172800000 two days // 86400000 a day

    const limit = Number(process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_QUERY_LIMIT);
    this.queryLimit = !isNaN(limit) && limit > 0 ? Math.floor(limit) : 10;
    
    const delay = Number(process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_DELAY);
    this.delayBeforeClosing = !isNaN(delay) && delay >= 0 ? Math.floor(delay) : 1000;
    
    this.queryProject = process.env.CLOSE_AGENT_UNRESPONSIVE_REQUESTS_QUERY_FILTER_ONLY_PROJECT;
    if (this.queryProject) {
      winston.info("CloseAgentUnresponsiveRequestTask filter only by projects enabled: " + this.queryProject );
    }
    
  }

  /**
   * Starts the scheduler if enabled.
   */
  run() {    
    if (this.enabled === "true") {
      winston.info("CloseAgentUnresponsiveRequestTask started" );
      this.scheduleUnresponsiveRequests();
    } else {
      winston.info("CloseAgentUnresponsiveRequestTask disabled" );
    }
  }

  /**
   * Schedules the recurring job to find and close unresponsive requests.
   */
  scheduleUnresponsiveRequests() {
    winston.info(
      `CloseAgentUnresponsiveRequestTask task scheduleUnresponsiveRequests launched with ` +
      `closeAfter: ${this.queryAfterTimeout} milliseconds, ` +
      `cron expression: ${this.cronExp} and query limit: ${this.queryLimit}`
    );

    schedule.scheduleJob(this.cronExp, (fireDate) => {
      winston.debug(`CloseAgentUnresponsiveRequestTask ScheduleUnresponsiveRequests job was supposed to run at ${fireDate}, but actually ran at ${new Date()}`);
      this.findUnresponsiveRequests();
    });
  }


  /**
   * Finds unresponsive agent requests and schedules their closure.
   * Queries for requests with agents that haven't been updated within the timeout period.
   */
  findUnresponsiveRequests() {
    const cutoffDate = new Date(Date.now() - this.queryAfterTimeout);
    const query = {
      hasBot: false,
      status: { $lt: 1000 },
      updatedAt: { $lte: cutoffDate }
    };

    if (this.queryProject) {
      try {
        query.id_project = JSON.parse(this.queryProject);
      } catch (err) {
        winston.error("CloseAgentUnresponsiveRequestTask error parsing queryProject filter", err);
        return;
      }
    }

    winston.debug("CloseAgentUnresponsiveRequestTask query",query);
    
    console.log("[CloseUnresponsive] Searching with query: ", query);
    Request.find(query)
      .sort({ updatedAt: 'asc' })
      .limit(this.queryLimit)
      .hint({ status: 1, hasBot: 1, updatedAt: 1 })
      .exec((err, requests) => {
        if (err) {
            winston.error("CloseAgentUnresponsiveRequestTask error getting unresponsive requests ", err);
            return;
        }
        
        if (!requests || requests.length === 0) {
          winston.verbose("CloseAgentUnresponsiveRequestTask no unresponsive requests found ");
          return;
        }

        console.log("[CloseUnresponsive] Found ", requests.length, " unresponsive requests");

        winston.verbose("CloseAgentUnresponsiveRequestTask: found " + requests.length +  " unresponsive requests");
        winston.debug("CloseAgentUnresponsiveRequestTask: found unresponsive requests ", requests);

        this.scheduleRequestClosures(requests);

    });
  }

  /**
   * Schedules the closure of multiple requests with staggered delays.
   * @param {Array} requests - Array of request objects to close
   */
  scheduleRequestClosures(requests) {
    requests.forEach((request, index) => {
      // Stagger delays: 2 * delayBeforeClosing * (index + 1)
      const delay = 2 * this.delayBeforeClosing * (index + 1);
      winston.debug(`CloseAgentUnresponsiveRequestTask: scheduling closure with delay: ${delay}ms for request_id: ${request.request_id}`);

      setTimeout(() => {
        this.closeRequest(request);
      }, delay);
    });
  }

  /**
   * Closes a single unresponsive request.
   * @param {Object} request - The request object to close
   */
  closeRequest(request) {
    winston.debug(`CloseAgentUnresponsiveRequestTask: processing unresponsive request: ${request.first_text}`);

    const closedBy = "_bot_unresponsive";
    const shouldSkipStatsUpdate = false;
    const shouldNotify = false;

    requestService.closeRequestByRequestId(
      request.request_id,
      request.id_project,
      shouldSkipStatsUpdate,
      shouldNotify,
      closedBy
    ).then(() => {
      winston.info(`CloseAgentUnresponsiveRequestTask: Request closed with request_id: ${request.request_id}`);
    }).catch((err) => {
      const hideErrors = process.env.HIDE_CLOSE_REQUEST_ERRORS === true || process.env.HIDE_CLOSE_REQUEST_ERRORS === "true";
      
      if (!hideErrors) {
        winston.error(`CloseAgentUnresponsiveRequestTask: Error closing the request with request_id: ${request.request_id}`, err);
      }
    });

  }
   
}
 
const closeAgentUnresponsiveRequestTask = new CloseAgentUnresponsiveRequestTask();

module.exports = closeAgentUnresponsiveRequestTask;