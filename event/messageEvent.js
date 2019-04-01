const EventEmitter = require('events');
var winston = require('../config/winston');
var Request = require("../models/request");
var Message = require("../models/message");
var Faq_kb = require("../models/faq_kb");
var MessageConstants = require("../models/messageConstants");

class MessageEvent extends EventEmitter {}

const messageEvent = new MessageEvent();

messageEvent.on('message.create', function(message) {
  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED) {
    messageEvent.emit('message.received', message);
  }

  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {
    messageEvent.emit('message.sending', message);
  }
});

messageEvent.on('message.create.simple', function(message) {


        winston.debug("Subscription.notify", 'message.create', message);
        
        Request.findOne({request_id:  message.recipient, id_project: message.id_project}).
        populate('lead').
        populate('department').        
        exec(function (err, request) {
    
          if (request) {
            var messageJson = message.toJSON();

            if (request.department && request.department.id_bot) {
              // if (request.department) {
              Faq_kb.findById(request.department.id_bot, function(err, bot) {
                winston.debug('bot', bot);
                var requestJson = request.toJSON();
                requestJson.department.bot = bot
                
                messageJson.request = requestJson;
                // winston.debug('messageJson', messageJson);
                winston.debug("Subscription.emit",messageJson );
                messageEvent.emit('message.create',messageJson );

              });

              
            }else {
              messageJson.request = request;
              winston.debug("Subscription.emit",messageJson );
              messageEvent.emit('message.create', messageJson );
            }

        }
         
        });
      
    });

module.exports = messageEvent;
