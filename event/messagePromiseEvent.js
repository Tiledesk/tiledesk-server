const EventEmitter = require('promise-events');

class MessagePromiseEvent extends EventEmitter {}

const messagePromiseEvent = new MessagePromiseEvent();




module.exports = messagePromiseEvent;
