var request = require('request');
var Subscription = require('../models/subscription');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const leadEvent = require('../event/leadEvent');
const botEvent = require('../event/botEvent');

const faqBotEvent = require('../event/faqBotEvent');

var Request = require("../models/request");
var Message = require("../models/message");
var Faq_kb = require("../models/faq_kb");
var winston = require('../config/winston');


class SubscriptionNotifier {
  // var SubscriptionNotifier = {

   
  findSubscriber(event, id_project) {
    return new Promise(function (resolve, reject) {
      Subscription.find({event:event, id_project: id_project})
      .select("+secret")
      .exec(function (err, subscriptions) {
        // if (subscriptions && subscriptions.length>0) {
        //   winston.debug("Subscription.notify", event, item , "length", subscriptions.length);
        // }
        resolve(subscriptions);
      });
    });
  } 

  notify(subscriptions, payload, next) {
    // winston.debug("Subscription.notify", event, item);
    
    // Subscription.find({event:event, id_project: item.id_project}).exec(function (err, subscriptions) {
    //   if (subscriptions && subscriptions.length>0) {
    //     winston.debug("Subscription.notify", event, item , "length", subscriptions.length);
    //   }

    
      //var json = {event: event, timestamp: Date.now(), payload: item};
      winston.debug("subscriptions",subscriptions);
      var json = {timestamp: Date.now(), payload: payload};
      subscriptions.forEach(function(s) {
          
        // console.log("s",s);

        var secret = s.secret;

        let sJson = s.toObject();
        delete sJson.secret;
        json["hook"] = sJson;

        request({
          url: s.target,
          headers: {
           'Content-Type' : 'application/json',        
            'x-hook-secret': secret
          },
          json: json,
          method: 'POST'

          }, function(err, result, json){
            winston.debug("SENT " + s.event + " TO " + s.target,  "with error " , err);
            if (err) {
              winston.error("Error sending webhook for event " + s.event + " TO " + s.target,  "with error " , err);
              next(err, json);
            }
          });
      });
  // });
}
  // https://mongoosejs.com/docs/middleware.html#post-async
  decorate(model, modelName) {
    var isNew = false;

    model.pre('save', function(next) {
      isNew = this.isNew;
      winston.debug("Subscription.notify.pre (isNew)", isNew);
     
      return next();
    });

    //console.log("decorate");
    // .afterCreate = function(item, next) {
    model.post('save', function(doc, next) {
     
       // If we have isNew flag then it's an update
       var event = (isNew) ? 'create' : 'update';
       winston.debug("Subscription.notify."+event);
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

    //modify all to async
    messageEvent.on('message.create', function(message) {
      subscriptionNotifier.subscribe('message.create', message);
    });

    messageEvent.on('message.received.for.bot', function(message) {
      subscriptionNotifier.subscribe('message.received.for.bot', message);
    });

    messageEvent.on('message.received', function(message) {
      subscriptionNotifier.subscribe('message.received', message);
    });
    messageEvent.on('message.sending', function(message) {
      subscriptionNotifier.subscribe('message.sending', message);
    });


      // messageEvent.on('message.create', function(message) {
      //   // console.log('messageEmitter message.create', message);
      //   subscriptionNotifier.findSubscriber('message.create', message.id_project).then(function(subscriptions) { 
      //     if (subscriptions && subscriptions.length>0) {
      //       winston.debug("Subscription.notify", 'message.create', message , "length", subscriptions.length);
            
      //       Request.findOne({request_id:  message.recipient, id_project: message.id_project}).
      //       populate('lead').
      //       populate('department').
      //       // populate('department.bot').
      //       // populate({ 
      //       //   path:'department',
      //       //   populate: {
      //       //     path: 'bot66',
      //       //     model: 'faq_kb'
      //       //   } 
      //       // }).
      //       exec(function (err, request) {
      //         // Request.findOne({request_id:  message.recipient, id_project: message.id_project}
      //       // , function(err, request) {
      //         // console.log('1111');

      //         if (request) {
      //           var messageJson = message.toJSON();

      //           if (request.department && request.department.id_bot) {
      //             // if (request.department) {
      //             Faq_kb.findById(request.department.id_bot, function(err, bot) {
      //               winston.debug('bot', bot);
      //               var requestJson = request.toJSON();
      //               requestJson.department.bot = bot
                    
      //               messageJson.request = requestJson;
      //               winston.debug('messageJson', messageJson);
      //               subscriptionNotifier.notify(subscriptions, messageJson);
    
      //             });

                  
      //           }else {
      //             messageJson.request = request;
      //             subscriptionNotifier.notify(subscriptions, messageJson);
      //           }

      //       }
             
      //       });
      //     }
      //   });
      // });





      requestEvent.on('request.create', function(request) {
        // console.log('requestEmitter request.create', request);
        // subscriptionNotifier.notify('request.create', request);

        subscriptionNotifier.findSubscriber('request.create', request.id_project).then(function(subscriptions) { 
          winston.debug("Subscription.notify before request.create: "+ subscriptions);          
          if (subscriptions && subscriptions.length>0) {
            winston.info("Subscription.notify", 'request.create', request , "length", subscriptions.length);          
              subscriptionNotifier.notify(subscriptions, request.toJSON());   
          }
        });

      });

      // requestEvent.on('request.create', function(request) {
      //   // console.log('requestEmitter request.create', request);
      //   // subscriptionNotifier.notify('request.create', request);

      //   subscriptionNotifier.findSubscriber('request.create', request.id_project).then(function(subscriptions) { 
      //     if (subscriptions && subscriptions.length>0) {
      //       winston.debug("Subscription.notify", 'request.create', request , "length", subscriptions.length);
      //       Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {          
      //         var requestJson = request.toJSON();
      //         requestJson.messages = messages;
      //         subscriptionNotifier.notify(subscriptions, requestJson);
      //       });
      //     }
      //   });

      // });






      requestEvent.on('request.update', function(request) {
        // console.log('requestEmitter request.update', request);
        // subscriptionNotifier.notify('request.update', request);
        subscriptionNotifier.findSubscriber('request.update', request.id_project).then(function(subscriptions) { 
          if (subscriptions && subscriptions.length>0) {
            winston.debug("Subscription.notify", 'request.update', request , "length", subscriptions.length);
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
            winston.debug("Subscription.notify", 'request.close', request , "length", subscriptions.length);
            Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
              var requestJson = request.toJSON();
              requestJson.messages = messages;
              subscriptionNotifier.notify(subscriptions, requestJson);
            });
          }
        });
      });



      leadEvent.on('lead.create', function(lead) {
        subscriptionNotifier.subscribe('lead.create', lead);
        //winston.debug("Subscription.notify");
        // subscriptionNotifier.findSubscriber('lead.create', lead.id_project).then(function(subscriptions) { 
        //   //winston.debug("Subscription.notify subscriptionNotifier", subscriptions.length);
        //   if (subscriptions && subscriptions.length>0) {
        //     winston.debug("Subscription.notify", 'lead.create', lead , "length", subscriptions.length);
        //     subscriptionNotifier.notify(subscriptions, lead);           
        //   }
        // });

      });


      botEvent.on('faqBot.create', function(faqBot) {
        subscriptionNotifier.subscribe('faqBot.create', faqBot);
      });

      botEvent.on('faqBot.update', function(faqBot) {
        subscriptionNotifier.subscribe('faqBot.update', faqBot);
      });
      botEvent.on('faqBot.delete', function(faqBot) {
        subscriptionNotifier.subscribe('faqBot.delete', faqBot);
      });



      faqBotEvent.on('faq.create', function(faq) {
        subscriptionNotifier.subscribe('faq.create', faq);
      });

      faqBotEvent.on('faq.update', function(faq) {
        subscriptionNotifier.subscribe('faq.update', faq);
      });
      faqBotEvent.on('faq.delete', function(faq) {
        subscriptionNotifier.subscribe('faq.delete', faq);
      });

    

  }


  subscribe(eventName, payload ) {
    //winston.debug("Subscription.notify");
    subscriptionNotifier.findSubscriber(eventName, payload.id_project).then(function(subscriptions) { 
      //winston.debug("Subscription.notify subscriptionNotifier", subscriptions.length);
      if (subscriptions && subscriptions.length>0) {
        winston.debug("Subscription.notify", eventName, payload , "length", subscriptions.length);
        subscriptionNotifier.notify(subscriptions, payload);           
      }
    });

  }



};

var subscriptionNotifier = new SubscriptionNotifier();

// console.log('messageEvent', messageEvent);


module.exports = subscriptionNotifier;