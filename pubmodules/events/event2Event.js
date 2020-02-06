var winston = require('../../config/winston');


var EventEmitter2 = require('eventemitter2').EventEmitter2;


class Event2Event extends EventEmitter2 {}

const event2Event = new Event2Event({

  //
  // set this to `true` to use wildcards. It defaults to `false`.
  //
  wildcard: true,
});

winston.debug("event2Event init");



module.exports = event2Event;
