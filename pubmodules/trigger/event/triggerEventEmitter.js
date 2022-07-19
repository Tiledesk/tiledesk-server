const EventEmitter = require('events');

class TriggerEventEmitter extends EventEmitter {}


const triggerEventEmitter = new TriggerEventEmitter();



module.exports = triggerEventEmitter;
