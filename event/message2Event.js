var winston = require('../config/winston');
var MessageConstants = require("../models/messageConstants");
var messageEvent = require("../event/messageEvent");



var EventEmitter2 = require('eventemitter2').EventEmitter2;


class Message2Event extends EventEmitter2 {}

const message2Event = new Message2Event({

  //
  // set this to `true` to use wildcards. It defaults to `false`.
  //
  wildcard: true,
});

winston.debug("message2Event init");


//TODO CHANGEIT
messageEvent.on('message.create.simple', function(message) {

  winston.debug("message2Event message.create", message);

  message2Event.emit(message.id_project+'.message.create', message);

  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED) {
    winston.debug("message2Event.emit message.received", message);
    message2Event.emit(message.id_project+'.message.received', message);
  }

  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {
    winston.debug("message2Event.emit message.sending", message);
    message2Event.emit(message.id_project+'.message.sending', message);
  }
});


module.exports = message2Event;
