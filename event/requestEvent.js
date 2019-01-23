const EventEmitter = require('events');

class RequestEvent extends EventEmitter {}

const requestEvent = new RequestEvent();




module.exports = requestEvent;
