const EventEmitter = require('events');

let winston = require('../config/winston');

class IntegrationEvent extends EventEmitter {
    constructor() {
        super();
    }
}

const integrationEvent = new IntegrationEvent();

module.exports = integrationEvent;