const EventEmitter = require('events');

var hooks = require('./../services/SubscriptionNotifier');

class RequestEmitter extends EventEmitter {}

const requestEmitter = new RequestEmitter();

requestEmitter.on('request.create', function(request) {
    console.log('requestEmitter request.create', request);
    hooks.notify('request.create', request);
});

requestEmitter.on('request.update', function(request) {
    console.log('requestEmitter request.update', request);
    hooks.notify('request.update', request);
});

requestEmitter.on('request.close', function(request) {
    console.log('requestEmitter request.close', request);
    hooks.notify('request.close', request);
});


module.exports = requestEmitter;
