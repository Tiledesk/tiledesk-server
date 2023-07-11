const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const leadEvent = require('../event/leadEvent');
const authEvent = require('../event/authEvent');

var Message = require("../models/message");
var winston = require('../config/winston');
var subscriptionNotifier = require('../services/subscriptionNotifier');

class SubscriptionNotifierQueued {

  start() {
    winston.debug('SubscriptionNotifierQueued start');

    var enabled = process.env.RESTHOOK_ENABLED || "false";
    winston.debug('SubscriptionNotifierQueued enabled:'+enabled);

    if (enabled==="true") {
      winston.debug('SubscriptionNotifierQueued enabled');
    }else {
      winston.info('Resthook Queued disabled');
      return 0;
    }


    var messageCreateKey = 'message.create';
    if (messageEvent.queueEnabled) {
      messageCreateKey = 'message.create.queue';
    }
    winston.debug('SubscriptionNotifierQueued messageCreateKey: ' + messageCreateKey);

    messageEvent.on(messageCreateKey, function(message) {   //queued tested
      setImmediate(() => {
        winston.debug('SubscriptionNotifierQueued message.create');
        subscriptionNotifier.subscribe('message.create', message);
        winston.debug('SubscriptionNotifierQueued message.create sent');
      });
    });



    var requestCreateKey = 'request.create';
    if (requestEvent.queueEnabled) {
      requestCreateKey = 'request.create.queue';
    }
    requestEvent.on(requestCreateKey, function(request) {  //queued tested
      setImmediate(() => {
        winston.debug('SubscriptionNotifier request.create');
        subscriptionNotifier.subscribe('request.create', request);  
        winston.debug('SubscriptionNotifier request.create sent');     
      });
    });



    var requestUpdateKey = 'request.update';
    if (requestEvent.queueEnabled) {
      requestUpdateKey = 'request.update.queue';
    }
    requestEvent.on(requestUpdateKey, function(request) {    //queued tested
      setImmediate(() => {
        winston.debug('SubscriptionNotifier request.update');
        subscriptionNotifier.subscribe('request.update', request);
        winston.debug('SubscriptionNotifier request.update sent');     

      });        
    });


    var requestCloseKey = 'request.close';   //request.close event here queued under job
    if (requestEvent.queueEnabled) {
      requestCloseKey = 'request.close.queue';
    }
    requestEvent.on(requestCloseKey, function(request) {   //request.close event here noqueued     //queued tested
      winston.debug('SubscriptionNotifier request.close');
      winston.debug("request.close event here 1")
      setImmediate(() => {
        Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
          var requestJson = request;
          if (request.toJSON) {
            requestJson = request.toJSON();
          }
          
          requestJson.messages = messages;
          subscriptionNotifier.subscribe('request.close', requestJson);
          winston.debug('SubscriptionNotifier request.close sent');     

        });   
      });
    });


    var leadCreateKey = 'lead.create';   //lead.create event here queued under job
    if (leadEvent.queueEnabled) {
      leadCreateKey = 'lead.create.queue';
    }
    leadEvent.on(leadCreateKey, function(lead) {    //notqueued high
      setImmediate(() => {
        subscriptionNotifier.subscribe('lead.create', lead);
        winston.debug('SubscriptionNotifier lead.create sent');     
      });
    });

    var authProjectUserUpdateKey = 'project_user.update';
    if (authEvent.queueEnabled) {
      authProjectUserUpdateKey = 'project_user.update.queue';
    }
    authEvent.on(authProjectUserUpdateKey,  function(event) {    //notqueued  high
      setImmediate(() => {
        subscriptionNotifier.subscribe('project_user.update', event.updatedProject_userPopulated);     
        winston.debug('SubscriptionNotifier project_user.update sent');     
      });
    });
    
    winston.info('SubscriptionNotifierQueued started');
  }




};

var subscriptionNotifierQueued = new SubscriptionNotifierQueued();


module.exports = subscriptionNotifierQueued;
