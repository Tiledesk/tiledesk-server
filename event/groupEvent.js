const EventEmitter = require('events');

class GroupEvent extends EventEmitter {}

const groupEvent = new GroupEvent();



module.exports = groupEvent;
