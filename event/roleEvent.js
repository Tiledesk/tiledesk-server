const EventEmitter = require('events');

class RoleEvent extends EventEmitter {}

const roleEvent = new RoleEvent();



module.exports = roleEvent;
