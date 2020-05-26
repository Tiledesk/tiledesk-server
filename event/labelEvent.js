const EventEmitter = require('events');

class LabelEvent extends EventEmitter {}

const labelEvent = new LabelEvent();




module.exports = labelEvent;
