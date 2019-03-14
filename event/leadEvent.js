const EventEmitter = require('events');

class LeadEvent extends EventEmitter {}

const leadEvent = new LeadEvent();




module.exports = leadEvent;
