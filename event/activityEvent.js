const EventEmitter = require('events');

class ActivityEvent extends EventEmitter {}

const activityEvent = new ActivityEvent();




module.exports = activityEvent;
