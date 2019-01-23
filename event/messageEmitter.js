const EventEmitter = require('events');

var hooks = require('./../services/SubscriptionNotifier');

class MessageEmitter extends EventEmitter {}

const messageEmitter = new MessageEmitter();

messageEmitter.on('message.create', function(message) {
    // console.log('messageEmitter message.create', message);
    hooks.notify('message.create', message);
});

module.exports = messageEmitter;
