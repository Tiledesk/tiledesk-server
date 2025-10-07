
'use strict';


let winston = require('../../config/winston');
let closeBotUnresponsiveRequestTask = require('./tasks/closeBotUnresponsiveRequestTask');
let closeAgentUnresponsiveRequestTask = require('./tasks/closeAgentUnresponsiveRequestTask');

class TaskRunner {

constructor() {
  this.enabled = process.env.TASK_SCHEDULER_ENABLED || "true"
}

start() {
    // let that = this;
    if (this.enabled == "true") {
      winston.info("TaskRunner started" );
      closeBotUnresponsiveRequestTask.run();
      closeAgentUnresponsiveRequestTask.run();
    }else {
      winston.info("TaskRunner is disabled" );
    }
    

}

   
}
 
 
 
 
let taskRunner = new TaskRunner();


module.exports = taskRunner;