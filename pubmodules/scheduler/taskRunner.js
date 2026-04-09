'use strict';

var winston = require('../../config/winston');
var closeBotUnresponsiveRequestTask = require('./tasks/closeBotUnresponsiveRequestTask');
var closeAgentUnresponsiveRequestTask = require('./tasks/closeAgentUnresponsiveRequestTask');
var requestRetentionScheduler = require('./tasks/requestRetentionScheduler');

class TaskRunner {

  constructor() {
    this.enabled = process.env.TASK_SCHEDULER_ENABLED || "true"
  }

  start() {
    // var that = this;
    if (this.enabled == "true") {
      winston.info("TaskRunner started" );
      closeBotUnresponsiveRequestTask.run();
      closeAgentUnresponsiveRequestTask.run();
      requestRetentionScheduler.run();
    } else {
      winston.info("TaskRunner is disabled" );
    }
    }

   
}
 
 
 
 
var taskRunner = new TaskRunner();


module.exports = taskRunner;