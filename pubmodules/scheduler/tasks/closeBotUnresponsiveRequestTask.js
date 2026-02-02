'use strict';

const schedule = require('node-schedule');
const winston = require('../../../config/winston');
const Request = require("../../../models/request");
const requestService = require("../../../services/requestService");

/**
 * Task scheduler for automatically closing bot unresponsive requests.
 * Finds requests with bots that haven't been updated within a specified timeout
 * and closes them automatically.
 */
class CloseBotUnresponsiveRequestTask {

  constructor() {

    this.enabled = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_ENABLE || "true";
    this.cronExp = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/5 * * * *'; // every 5 minutes  // every 30 seconds '*/30 * * * * *';
    this.queryAfterTimeout = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT) || 2 * 24 * 60 * 60 * 1000; //two days ago //172800000 two days // 86400000 a day
    this.queryLimit = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_LIMIT) || 10;
    this.queryProject = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_FILTER_ONLY_PROJECT; //example in PRE: {"$in":["5fc224ce05416200342af18a","5fb3e3cb0150a00034ab77d5"]}
    this.delayBeforeClosing = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_DELAY) || 1000;

    if (this.queryProject) {
      winston.info("CloseBotUnresponsiveRequestTask filter only by projects enabled: " + this.queryProject);
    }
  }

  /**
   * Starts the scheduler if enabled.
   */
  run() {
    if (this.enabled === "true") {
      winston.info("CloseBotUnresponsiveRequestTask started");
      this.scheduleUnresponsiveRequests();
    } else {
      winston.info("CloseBotUnresponsiveRequestTask disabled");
    }
  }

  /**
   * Schedules the recurring job to find and close unresponsive requests.
   * Includes a random delay to avoid concurrent execution in cluster environments.
   */
  scheduleUnresponsiveRequests() {
    winston.info(
      `CloseBotUnresponsiveRequestTask task scheduleUnresponsiveRequests launched with ` +
      `closeAfter: ${this.queryAfterTimeout} milliseconds, ` +
      `cron expression: ${this.cronExp} and query limit: ${this.queryLimit}`
    );

    schedule.scheduleJob(this.cronExp, (fireDate) => {
      const randomDelay = Math.random() * 1000;
      winston.debug(`CloseBotUnresponsiveRequestTask random delay: ${randomDelay}ms`);

      setTimeout(() => {
        winston.debug(
          `CloseBotUnresponsiveRequestTask scheduleUnresponsiveRequests job was supposed to run at ${fireDate}, ` +
          `but actually ran at ${new Date()}`
        );
        this.findUnresponsiveRequests();
      }, randomDelay);

    });
  }

  /**
   * Finds unresponsive bot requests and schedules their closure.
   * Queries for requests with bots that haven't been updated within the timeout period.
   */
  findUnresponsiveRequests() {
    const cutoffDate = new Date(Date.now() - this.queryAfterTimeout);
    const query = { 
      hasBot: true, 
      status: { $lt: 1000 }, 
      updatedAt: { $lte: cutoffDate } 
    };

    if (this.queryProject) {
      try {
        query.id_project = JSON.parse(this.queryProject);
      } catch (err) {
        winston.error("CloseBotUnresponsiveRequestTask error parsing queryProject filter", err);
        return;
      }
    }

    winston.debug("CloseBotUnresponsiveRequestTask query", query);

    console.log("[CloseUnresponsive] Searching with query: ", query);
    Request.find(query)
      .sort({ updatedAt: 'asc' })
      .limit(this.queryLimit)
      .hint({ status: 1, hasBot: 1, updatedAt: 1 })
      .exec((err, requests) => {
        if (err) {
          winston.error("CloseBotUnresponsiveRequestTask error getting unresponsive requests ", err);
          return;
        }

        if (!requests || requests.length === 0) {
          winston.verbose("CloseBotUnresponsiveRequestTask no unresponsive requests found ");
          return;
        }

        console.log("[CloseUnresponsive] Found ", requests.length, " unresponsive requests");

        winston.info("CloseBotUnresponsiveRequestTask: found " + requests.length + " unresponsive requests");
        winston.debug("CloseBotUnresponsiveRequestTask: found unresponsive requests ", requests);

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
      winston.debug(`CloseBotUnresponsiveRequestTask: scheduling closure with delay: ${delay}ms for request_id: ${request.request_id}`);

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
    winston.debug(`CloseBotUnresponsiveRequestTask: processing unresponsive request: ${request.first_text}`);

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
      winston.info(`CloseBotUnresponsiveRequestTask: Request closed with request_id: ${request.request_id}`);
    }).catch((err) => {
      const hideErrors = process.env.HIDE_CLOSE_REQUEST_ERRORS === true || process.env.HIDE_CLOSE_REQUEST_ERRORS === "true";

      if (!hideErrors) {
        winston.error(`CloseBotUnresponsiveRequestTask: Error closing the request with request_id: ${request.request_id}`, err);
      }
    });

  }

}

const closeBotUnresponsiveRequestTask = new CloseBotUnresponsiveRequestTask();

module.exports = closeBotUnresponsiveRequestTask;