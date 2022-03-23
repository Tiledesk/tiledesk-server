const EventEmitter = require('events');
var winston = require('../config/winston');
var Request = require("../models/request");
var Message = require("../models/message");
var Faq_kb = require("../models/faq_kb");
var MessageConstants = require("../models/messageConstants");
var message2Event = require("../event/message2Event");

var cacheUtil = require('../utils/cacheUtil');



class MessageEvent extends EventEmitter { 
  constructor() {
    super();
    this.queueEnabled = false;
  }
}

const messageEvent = new MessageEvent();



function emitCompleteMessage(message) {
  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED) {
    winston.debug("messageEvent.emit message.received", message);
    messageEvent.emit('message.received', message);
  }

  if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {
    winston.debug("messageEvent.emit message.sending", message);
    messageEvent.emit('message.sending', message);
  }
}

messageEvent.on('message.create', emitCompleteMessage);
messageEvent.on('message.update', emitCompleteMessage);

function populateMessageCreate(message) {
  return populateMessageWithRequest(message, 'message.create');
}
function populateMessageUpdate(message) {
  return populateMessageWithRequest(message, 'message.update');
}


function populateMessageWithRequest(message, eventPrefix) {

  
  winston.debug("populateMessageWithRequest "+eventPrefix, message.toObject());
  
  var messageJson = message.toJSON();

  
    // cacherequest      // requestcachefarequi populaterequired cacheveryhightpriority
    
  Request.findOne({request_id:  message.recipient, id_project: message.id_project}).
  populate('lead').
  populate('department').  
  populate('participatingBots').
  populate('participatingAgents').       
  populate({path:'requester',populate:{path:'id_user'}}).
  lean()
  //perche lean?
  // TODO availableAgentsCount nn c'è per il lean problema trigger
  // request.department._id DA CORREGGERE ANCHE PER REQUEST.CREATE
  // request.department.hasBot 
  // request.isOpen
  //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, message.id_project+":requests:request_id:"+message.recipient).
  exec(function (err, request) {

    if (err) {
      winston.error("Error getting request on messageEvent.populateMessage",err );
      return messageEvent.emit(eventPrefix, message);
    }

  if (request) {
      winston.debug("request is defined in messageEvent",request );
      
      // var requestJson = request.toJSON();
      var requestJson = request;
    
      if (request.department && request.department.id_bot) {
        // if (request.department) {
        Faq_kb.findById(request.department.id_bot)
        //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+request.department.id_bot)
        .exec(function(err, bot) {
          winston.debug('bot', bot);
          requestJson.department.bot = bot
          
          messageJson.request = requestJson;
          // winston.debug('messageJson', messageJson);
          winston.debug("message.emit",messageJson );
          messageEvent.emit(eventPrefix,messageJson );

          //se a req.first_text toglio ritorni a capo è sempre diverso da msg.txt
          if (message.text === request.first_text){
            messageEvent.emit(eventPrefix+'.first', messageJson );
          }

          //  request.lead can be undefined because some test case uses the old deprecated method requestService.createWithId.
          // TODO lead_id used. Change it?
          if (request.lead && message.sender === request.lead.lead_id) {
            messageEvent.emit(eventPrefix+'.from.requester', messageJson );
          }

//           olumn":21,"file":"/app/node_modules/mongoose/lib/model.js","function":null,"line":4869,"method":null,"native":false},{"column":11,"file":"/app/node_modules/mongoose/lib/query.js","function":"_hooks.execPost","line":4391,"method":"execPost","native":false},{"column":16,"file":"/app/node_modules/kareem/index.js","function":null,"line":135,"method":null,"native":false},{"column":9,"file":"internal/process/task_queues.js","function":"processTicksAndRejections","line":79,"method":null,"native":false}]}
// 2021-01-26T10:30:16.045281+00:00 app[web.1]: error: uncaughtException: Cannot read property 'name' of undefined
// 2021-01-26T10:30:16.045283+00:00 app[web.1]: TypeError: Cannot read property 'name' of undefined
// 2021-01-26T10:30:16.045284+00:00 app[web.1]:     at /app/event/messageEvent.js:101:80
// 2021-01-26T10:30:16.045284+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:4846:16
// 2021-01-26T10:30:16.045285+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/helpers/promiseOrCallback.js:24:16
// 2021-01-26T10:30:16.045285+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:4869:21
// 2021-01-26T10:30:16.045286+00:00 app[web.1]:     at _hooks.execPost (/app/node_modules/mongoose/lib/query.js:4391:11)
// 2021-01-26T10:30:16.045286+00:00 app[web.1]:     at /app/node_modules/kareem/index.js:135:16
// 2021-01-26T10:30:16.045287+00:00 app[web.1]: 

          message2Event.emit(eventPrefix+'.request.channel.' + request.channel.name, messageJson );
          message2Event.emit(eventPrefix+'.request.channelOutbound.' + request.channelOutbound.name, messageJson );
          message2Event.emit(eventPrefix+'.channel.' + message.channel.name, messageJson );

        });

        
      }else {
        messageJson.request = requestJson;
        winston.debug("message.emit",messageJson );
        messageEvent.emit(eventPrefix, messageJson );   
        
        if (message.text === request.first_text) {
          messageEvent.emit(eventPrefix+'.first', messageJson );
        }

        //  request.lead can be undefined because some test case uses the old deprecated method requestService.createWithId.
        // TODO lead_id used. Change it?
        if (request.lead && message.sender === request.lead.lead_id) {
        // if (message.sender === request.lead.lead_id) {
          winston.debug("message.create.from.requester",messageJson );
          messageEvent.emit(eventPrefix+'.from.requester', messageJson );
        }

        message2Event.emit(eventPrefix+'.request.channel.' + request.channel.name, messageJson );
        message2Event.emit(eventPrefix+'.request.channelOutbound.' + request.channelOutbound.name, messageJson );
        message2Event.emit(eventPrefix+'.channel.' + message.channel.name, messageJson );

      }   
          
  } else {
    winston.debug("request is undefined in messageEvent. Is it a direct or group message ?" );
    messageEvent.emit(eventPrefix,messageJson );
    message2Event.emit(eventPrefix+'.channel.' + message.channel.name, messageJson );
  }
   
  });

}

messageEvent.on('message.create.simple', populateMessageCreate);
messageEvent.on('message.update.simple', populateMessageUpdate);


module.exports = messageEvent;