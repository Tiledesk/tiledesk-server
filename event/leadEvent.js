const EventEmitter = require('events');

class LeadEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
        this.setMaxListeners(11);
      }
}

const leadEvent = new LeadEvent();


module.exports = leadEvent;
