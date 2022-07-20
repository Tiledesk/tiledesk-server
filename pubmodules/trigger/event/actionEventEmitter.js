const EventEmitter = require('events');

class ActionEventEmitter extends EventEmitter {}


const actionEventEmitter = new ActionEventEmitter();



module.exports = actionEventEmitter;
