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
            
            var requestJson = request.toJSON();
           

            Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {                        
              winston.debug("message.create.simple messages",messages );


              requestJson.messages = messages;


                  if (request.department && request.department.id_bot) {
                    // if (request.department) {
                    Faq_kb.findById(request.department.id_bot, function(err, bot) {
                      winston.debug('bot', bot);
                      

                      requestJson.department.bot = bot
                      
                      messageJson.request = requestJson;
                      // winston.debug('messageJson', messageJson);
                      winston.debug("Subscription.emit",messageJson );
                      messageEvent.emit('message.create',messageJson );

                      if (messages && messages.length==1){
                        messageEvent.emit('message.create.first', messageJson );
                      }

                    });

                    
                  }else {
                    messageJson.request = requestJson;
                    winston.debug("Subscription.emit",messageJson );
                    messageEvent.emit('message.create', messageJson );   
                    
                    if (messages && messages.length==1){
                      messageEvent.emit('message.create.first', messageJson );
                    }

                  }

            });

        }
         
        });
      
    });

module.exports = messageEvent;
