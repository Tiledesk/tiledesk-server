const EventEmitter = require('events');

class GroupEvent extends EventEmitter {}
var winston = require('../config/winston');

const groupEvent = new GroupEvent();



module.exports = groupEvent;
