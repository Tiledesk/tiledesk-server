const EventEmitter = require('events');

class MessageActionEvent extends EventEmitter {}

const messageActionEvent = new MessageActionEvent();



module.exports = messageActionEvent;
