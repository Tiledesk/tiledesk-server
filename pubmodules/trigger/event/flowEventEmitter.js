const EventEmitter = require('events');

class FlowEventEmitter extends EventEmitter {}


const flowEventEmitter = new FlowEventEmitter();



module.exports = flowEventEmitter;
