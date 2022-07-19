const EventEmitter = require('events');

class SubscriptionEvent extends EventEmitter {}
var winston = require('../config/winston');


const subscriptionEvent = new SubscriptionEvent();



module.exports = subscriptionEvent;
