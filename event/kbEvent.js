const EventEmitter = require('events');

class KbEvent extends EventEmitter {
    constructor() {
        super();
    }
}

const kbEvent = new KbEvent();

module.exports = kbEvent;
