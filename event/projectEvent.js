const EventEmitter = require('events');

class ProjectEvent extends EventEmitter {
  constructor() {
    super();
    /** Allineato a requestEvent: true quando QUEUE_ENABLED e gli handler usano *.queue sul worker. */
    this.queueEnabled = false;
  }
}

const projectEvent = new ProjectEvent();




module.exports = projectEvent;
