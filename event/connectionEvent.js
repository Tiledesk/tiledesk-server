const EventEmitter = require('events');

class ConnectionEvent extends EventEmitter {}

const connectionEvent = new ConnectionEvent();

module.exports = connectionEvent;
