const EventEmitter = require('events');

class ProjectEvent extends EventEmitter {}

const projectEvent = new ProjectEvent();




module.exports = projectEvent;
