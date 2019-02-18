var request = require('request');
var Subscription = require('../models/subscription');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');

var Request = require("../models/request");
var Message = require("../models/message");
var Faq_kb = require("../models/faq_kb");


class SubscriptionNotifier {
  // var SubscriptionNotifier = {

   
  findSubscriber(event, id_project) {
    return new Promise(function (resolve, reject) {
      Subscription.find({event:event, id_project: id_project}).exec(function (err, subscriptions) {
        // if (subscriptions && subscriptions.length>0) {
        //   console.log("Subscription.notify", event, item , "length", subscriptions.length);
        // }
        resolve(subscriptions);
      });
    });
  } 

  notify(subscriptions, payload, next) {
    // console.log("Subscription.notify", event, item);
    
    // Subscription.find({event:event, id_project: item.id_project}).exec(function (err, subscriptions) {
    //   if (subscriptions && subscriptions.length>0) {
    //     console.log("Subscription.notify", event, item , "length", subscriptions.length);
    //   }

    
      //var json = {event: event, timestamp: Date.now(), payload: item};
      console.log("subscriptions",subscriptions);
      var json = {timestamp: Date.now(), payload: payload};
      subscriptions.forEach(function(s) {
          
          json["hook"] = s;

          request.post({
            url: s.target,
            json: json
          }, function(err, result, json){
            //console.log("SENT " + event + " TO " + s.target, "result", result, "with error " , err);
            console.log("SENT " + s.event + " TO " + s.target,  "with error " , err);
            if (next) next(err, json);
          });
      });
  // });
}
  // https://mongoosejs.com/docs/middleware.html#post-async
  decorate(model, modelName) {
    var isNew = false;

    model.pre('save', function(next) {
      isNew = this.isNew;
      console.log("Subscription.notify.pre (isNew)", isNew);
     
      return next();
    });

    //console.log("decorate");
    // .afterCreate = function(item, next) {
    model.post('save', function(doc, next) {
     
       // If we have isNew flag then it's an update
       var event = (isNew) ? 'create' : 'update';
       console.log("Subscription.notify."+event);
      next(null, doc);
      SubscriptionNotifier.notify(modelName+'.'+event, doc);
    });

    // model.afterUpdate = function(item, next) {
    //   next(null, item);
    //   SubscriptionNotifier.notify(modelName+'.update', item);
    // }

    // model.afterDestroy = function(next) {
    //   next();
    //   SubscriptionNotifier.notify(modelName+'.delete', {});
    // }
  }

  start() {
      messageEvent.on('message.create', function(message) {
        // console.log('messageEmitter message.create', message);
        subscriptionNotifier.findSubscriber('message.create', message.id_project).then(function(subscriptions) { 
          if (subscriptions && subscriptions.length>0) {
            console.log("Subscription.notify", 'message.create', message , "length", subscriptions.length);
            
            Request.findOne({request_id:  message.recipient, id_project: message.id_project}).
            // populate('lead').
            populate('department').
            // populate('department.bot').
            // populate({ 
            //   path:'department',
            //   populate: {
            //     path: 'bot66',
            //     model: 'faq_kb'
            //   } 
            // }).
            exec(function (err, request) {
              // Request.findOne({request_id:  message.recipient, id_project: message.id_project}
            // , function(err, request) {
              // console.log('1111');

              var messageJson = message.toJSON();

              if (request.department.id_bot) {
                Faq_kb.findById(request.department.id_bot, function(err, bot) {
                  console.log('bot', bot);
                  var requestJson = request.toJSON();
                  requestJson.department.bot = bot
                  
                  messageJson.request = requestJson;
                  console.log('messageJson', messageJson);
                  subscriptionNotifier.notify(subscriptions, messageJson);
  
                });

                
              }else {
                messageJson.request = request;
                subscriptionNotifier.notify(subscriptions, messageJson);
              }

              
             
            });
          }
        });
      });

      requestEvent.on('request.create', function(request) {
        // console.log('requestEmitter request.create', request);
        // subscriptionNotifier.notify('request.create', request);

        subscriptionNotifier.findSubscriber('request.create', request.id_project).then(function(subscriptions) { 
          if (subscriptions && subscriptions.length>0) {
            console.log("Subscription.notify", 'request.create', request , "length", subscriptions.length);
            Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {          
              var requestJson = request.toJSON();
              requestJson.messages = messages;
              subscriptionNotifier.notify(subscriptions, requestJson);
            });
          }
        });

      });

      requestEvent.on('request.update', function(request) {
        // console.log('requestEmitter request.update', request);
        // subscriptionNotifier.notify('request.update', request);
        subscriptionNotifier.findSubscriber('request.update', request.id_project).then(function(subscriptions) { 
          if (subscriptions && subscriptions.length>0) {
            console.log("Subscription.notify", 'request.update', request , "length", subscriptions.length);
            Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
              var requestJson = request.toJSON();
              requestJson.messages = messages;
              subscriptionNotifier.notify(subscriptions, requestJson);
            });
          }
        });

      });

      requestEvent.on('request.close', function(request) {
        // console.log('requestEmitter request.close', request);
        // // const polutatedRequest = await request.populate("messages");
        // request.populate("messages", function (err, polutatedRequest) {
        //     hooks.notify('request.close', polutatedRequest);
        // });
        // subscriptionNotifier.notify('request.close', request);
        subscriptionNotifier.findSubscriber('request.close', request.id_project).then(function(subscriptions) { 
          if (subscriptions && subscriptions.length>0) {
            console.log("Subscription.notify", 'request.close', request , "length", subscriptions.length);
            Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
              var requestJson = request.toJSON();
              requestJson.messages = messages;
              subscriptionNotifier.notify(subscriptions, requestJson);
            });
          }
        });
      });
  }
};

var subscriptionNotifier = new SubscriptionNotifier();

// console.log('messageEvent', messageEvent);


module.exports = subscriptionNotifier;