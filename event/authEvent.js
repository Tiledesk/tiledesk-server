const EventEmitter = require('events');

class AuthEvent extends EventEmitter {}

const authEvent = new AuthEvent();


//listen for sigin and signup event

module.exports = authEvent;
