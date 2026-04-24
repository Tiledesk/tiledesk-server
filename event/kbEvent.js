const EventEmitter = require('events');

class KbEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
    }
}

const kbEvent = new KbEvent();

module.exports = kbEvent;
