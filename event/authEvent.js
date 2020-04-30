const EventEmitter = require('events');

class AuthEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
      }
}

const authEvent = new AuthEvent();


//listen for sigin and signup event

module.exports = authEvent;
