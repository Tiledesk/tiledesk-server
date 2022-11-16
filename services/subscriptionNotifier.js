var Subscription = require('../models/subscription');
var SubscriptionLog = require('../models/subscriptionLog');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const message2Event = require('../event/message2Event');
const leadEvent = require('../event/leadEvent');
const botEvent = require('../event/botEvent');
const authEvent = require('../event/authEvent');
const departmentEvent = require('../event/departmentEvent');
const groupEvent = require('../event/groupEvent');
const faqBotEvent = require('../event/faqBotEvent');
const eventEvent = require('../pubmodules/events/eventEvent');
const event2Event = require('../pubmodules/events/event2Event');
const projectEvent = require('../event/projectEvent');

// var Request = require("../models/request");
var Message = require("../models/message");
// var Faq_kb = require("../models/faq_kb");
var winston = require('../config/winston');
var jwt = require('jsonwebtoken');
var config = require('../config/database'); // get db config file
var cacheUtil = require("../utils/cacheUtil");

var cacheEnabler = require("../services/cacheEnabler");

var webhook_origin = process.env.WEBHOOK_ORIGIN || "http://localhost:3000";
winston.debug("webhook_origin: "+webhook_origin);


var request = require('retry-request', {
  request: require('request')
});

class SubscriptionNotifier {
  // var SubscriptionNotifier = {

   
  findSubscriber(event, id_project) {
    return new Promise(function (resolve, reject) {
      let q = Subscription.find({event:event, $or:[{id_project: id_project}, {global: true}]});
      if (cacheEnabler.subscription) {
        q.cache(cacheUtil.longTTL, id_project+":subscriptions:event:"+event);  //CACHE_SUBSCRIPTION
        winston.debug('subscription cache enabled');
      }
      
      q.select("+secret +global")
      .exec(function (err, subscriptions) {
        // if (subscriptions && subscriptions.length>0) {
        //   winston.debug("Subscription.notify", event, item , "length", subscriptions.length);
        // }
        resolve(subscriptions);
      });
    });
  } 

  notify(subscriptions, payload, callback) {
    // winston.debug("Subscription.notify", event, item);
    
    // Subscription.find({event:event, id_project: item.id_project}).exec(function (err, subscriptions) {
    //   if (subscriptions && subscriptions.length>0) {
    //     winston.debug("Subscription.notify", event, item , "length", subscriptions.length);
    //   }

    
      //var json = {event: event, timestamp: Date.now(), payload: item};
      winston.debug("subscriptions",subscriptions);
      var json = {timestamp: Date.now(), payload: payload};
      subscriptions.forEach(function(s) {
          
        // winston.debug("s",s);
          var secret = s.secret;

          let sJson = s.toObject();
          delete sJson.secret;
          delete sJson.global;
          
          json["hook"] = sJson;

    

          var signOptions = {
            issuer:  'https://tiledesk.com',
            subject:  'subscription',        
            audience:  'https://tiledesk.com/subscriptions/'+s._id,        
          };

          if (s.global==true){
            signOptions.audience = 'https://tiledesk.com';
            secret = process.env.GLOBAL_SECRET || config.secret;
          }
    
          var token = jwt.sign(sJson, secret, signOptions);
          json["token"] = token;


          // for sync use no retry 
          
          request({
            url: s.target,
            headers: {
             'Content-Type' : 'application/json',        
              'x-hook-secret': secret,
              'User-Agent': 'tiledesk-webhooks',
              'Origin': webhook_origin
            },
            json: json,
            method: 'POST'

          }, function(err, response, json){
            winston.debug("SENT " + s.event + " TO " + s.target,  "with error " , err);
            winston.debug("SubscriptionLog response", response);
            winston.debug("SubscriptionLog json", json);

              var subscriptionLog = new SubscriptionLog({event: s.event, target: s.target, 
                response: JSON.stringify(response),
                body: JSON.stringify(json),
                err: err, id_project:s.id_project});

              subscriptionLog.save(function (errSL, sl) {           
                if (errSL) {
                  winston.error("Error saving subscriptionLog", errSL);
                  return 0;
                }
                winston.debug("SubscriptionLog saved", sl);
              });

            if (err) {
              winston.error("Error sending webhook for event " + s.event + " TO " + s.target,  "with error " , err);
              if (callback) {
                callback(err, json);
              }
              
            }
              //return
              // console.log("callback qui1", callback);
            if (callback) {
              // console.log("callback qui", json);
              callback(null, json);
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

    //winston.debug("decorate");
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
    winston.debug('SubscriptionNotifier start');

    var enabled = process.env.RESTHOOK_ENABLED || "false";
    winston.debug('SubscriptionNotifier enabled:'+enabled);

    if (enabled==="true") {
      winston.debug('SubscriptionNotifier enabled');
    }else {
      winston.info('Resthook disabled');
      return 0;
    }


    messageEvent.on('message.create', function(message) {
      setImmediate(() => {
        subscriptionNotifier.subscribe('message.create', message);
      });
    });

    message2Event.on('message.create.**.channel.*', function(message) {
      // message2Event.on('message.create.request.channel.*', function(message) {
      winston.debug("message2Event: "+this.event, message);
      subscriptionNotifier.subscribe(this.event, message);         
  }, {async: true});



    // messageEvent.on('message.received.for.bot', function(message) {
    //   setImmediate(() => {
    //     subscriptionNotifier.subscribe('message.received.for.bot', message);
    //   });
    // });

    // messageEvent.on('message.received', function(message) {
    //   setImmediate(() => {
    //     subscriptionNotifier.subscribe('message.received', message);
    //   });
    // });
    // messageEvent.on('message.sending', function(message) {
    //   setImmediate(() => {
    //     subscriptionNotifier.subscribe('message.sending', message);
    //   });
    // });


    requestEvent.on('request.create', function(request) {
      setImmediate(() => {
        subscriptionNotifier.subscribe('request.create', request);       
      });
    });

    requestEvent.on('request.update', function(request) {
      setImmediate(() => {
        subscriptionNotifier.subscribe('request.update', request);
      });        
    });

    requestEvent.on('request.close', function(request) {
      setImmediate(() => {
        Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
          var requestJson = request.toJSON();
          requestJson.messages = messages;
          subscriptionNotifier.subscribe('request.close', requestJson);
        });   
      });
    });


      leadEvent.on('lead.create', function(lead) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('lead.create', lead);
        });
      });


      botEvent.on('faqbot.create', function(faqBot) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.create', faqBot);
        });
      });

      botEvent.on('faqbot.update', function(faqBot) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.update', faqBot);
        });
      });

      botEvent.on('faqbot.delete', function(faqBot) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.delete', faqBot);
        });
      });

      faqBotEvent.on('faq.create', function(faq) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.create', faq);
        });
      });

      faqBotEvent.on('faq.update', function(faq) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.update', faq);
        });
      });
      faqBotEvent.on('faq.delete', function(faq) {
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.delete', faq);
        });
      });

      authEvent.on('user.signup',  function(event) { 
        setImmediate(() => {
          var user = event.savedUser;
          delete user.password;

          subscriptionNotifier.subscribe('user.signup', user);         
        });
      });


      // authEvent.emit('project_user.invite', {req:req, savedProject_userPopulated: savedProject_userPopulated});

      authEvent.on('project_user.invite',  function(event) { 
        setImmediate(() => {
          subscriptionNotifier.subscribe('project_user.invite', event.savedProject_userPopulated);         
        });
      });
    
      // authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});

      authEvent.on('project_user.update',  function(event) {      
        setImmediate(() => {
          subscriptionNotifier.subscribe('project_user.update', event.updatedProject_userPopulated);         
        });
      });
    
      // authEvent.emit('project_user.delete', {req: req, project_userPopulated: project_userPopulated});

     authEvent.on('project_user.delete',  function(event) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('project_user.delete', event.project_userPopulated);               
      });
     });


     //TODO lanciare user.signin in questo modo uno esternamente con webhook può creare proactive greetings

    departmentEvent.on('operator.select',  function(result) { 
      winston.debug("departmentEvent.on(operator.select");

      var operatorSelectedEvent = result.result;
      var resolve = result.resolve;
      var reject = result.reject;

      // aggiungere context. lascio lo passso già a result.result
      // operatorSelectedEvent["context"] = result.context;

      var disableWebHookCall = result.disableWebHookCall;
      winston.debug("subscriptionNotifier disableWebHookCall: "+ disableWebHookCall);

      if (disableWebHookCall === true) {      
        winston.debug("subscriptionNotifier disableWebHookCall enabled: "+ disableWebHookCall);
        return resolve(operatorSelectedEvent);
      }
      subscriptionNotifier.subscribe('operator.select', operatorSelectedEvent, function(err, json) {
        winston.debug("qui callback",json, err);
        if (err) {
          if (err.code == 404) {
            winston.debug("call resolve default resolve because not found", err);
          }else {
            winston.warn("call resolve default resolve because err", err);
          }
          return resolve(operatorSelectedEvent);
        }
        if (json && json.operators) {
          winston.verbose("call resolve valid json", json);
          return resolve(json);
        }else {
          winston.verbose("call resolve default resolve");
          return resolve(operatorSelectedEvent);
        }

      });         
    });


    departmentEvent.on('department.create',  function(department) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.create', department);         
      });
    });
  
  
    departmentEvent.on('department.update',  function(department) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.update', department);         
      });
    });

    departmentEvent.on('department.delete',  function(department) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.delete', department);         
      });
    });


    groupEvent.on('group.create',  function(group) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.create', group);         
      });
    });
  
  
    groupEvent.on('group.update',  function(group) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.update', group);         
      });
    });

    groupEvent.on('group.delete',  function(group) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.delete', group);         
      });
    });

    eventEvent.on('event.emit',  function(event) { 
      setImmediate(() => {
        subscriptionNotifier.subscribe('event.emit', event);         
      });
    });

    // event2Event.on(name, savedEventPopulated);
    event2Event.on('**', function(savedEventPopulated) {
      setImmediate(() => {
        winston.debug("eventname",this.event);
        subscriptionNotifier.subscribe('event.emit.'+this.event, savedEventPopulated);         
      });
    });


    projectEvent.on('project.create',  function(project) { 
      setImmediate(() => {
        var projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.create', projectJson);         
      });
    });

    projectEvent.on('project.update',  function(project) { 
      setImmediate(() => {
        var projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.update', projectJson);         
      });
    });

    projectEvent.on('project.downgrade',  function(project) { 
      setImmediate(() => {
        var projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.downgrade', projectJson);         
      });
    });

    projectEvent.on('project.delete',  function(project) { 
      setImmediate(() => {
        var projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.delete', projectJson);         
      });
    });

    


    // tagEvent.webhook for pypestream


      // TODO add user events

      winston.info('SubscriptionNotifier started');
  }


  subscribe(eventName, payload, callback ) {
    winston.debug("Subscription.notify");
    // findSubscriber(event, id_project) 
    subscriptionNotifier.findSubscriber(eventName, payload.id_project).then(function(subscriptions) { 
      //winston.debug("Subscription.notify subscriptionNotifier", subscriptions.length);
      if (subscriptions && subscriptions.length>0) {
        winston.debug("Subscription.notify", eventName, payload , "length", subscriptions.length);
        subscriptionNotifier.notify(subscriptions, payload, callback);           
      } else {
        if (callback) {
          var err = {msg:"No subscriptions found", code:404};
          callback(err, undefined);
        }
      }
    });

  }



};

var subscriptionNotifier = new SubscriptionNotifier();

// winston.debug('messageEvent', messageEvent);


module.exports = subscriptionNotifier;
