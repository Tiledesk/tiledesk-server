
const EventEmitter = require('events');

class EmailEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
    }
}

const emailEvent = new EmailEvent();

module.exports =  emailEvent;