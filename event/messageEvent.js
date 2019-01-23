const EventEmitter = require('events');


class MessageEvent extends EventEmitter {}

const messageEvent = new MessageEvent();



module.exports = messageEvent;
