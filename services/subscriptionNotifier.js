let Subscription = require('../models/subscription');
let SubscriptionLog = require('../models/subscriptionLog');
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

// let Request = require("../models/request");
let Message = require("../models/message");
// let Faq_kb = require("../models/faq_kb");
let winston = require('../config/winston');
let jwt = require('jsonwebtoken');
let config = require('../config/database'); // get db config file
let cacheUtil = require("../utils/cacheUtil");

let cacheEnabler = require("../services/cacheEnabler");

let webhook_origin = process.env.WEBHOOK_ORIGIN || "http://localhost:3000";
winston.debug("webhook_origin: "+webhook_origin);


let request = require('retry-request', {
  request: require('request')
});

class SubscriptionNotifier {
  // let SubscriptionNotifier = {

   
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

    
      //let json = {event: event, timestamp: Date.now(), payload: item};
      winston.debug("subscriptions",subscriptions);
      let json = {timestamp: Date.now(), payload: payload};
      subscriptions.forEach(function(s) {
          
        // winston.debug("s",s);
          let secret = s.secret;
          let xHookSecret = secret;

          let sJson = s.toObject();
          delete sJson.secret;
          delete sJson.global;
          
          json["hook"] = sJson;

    

          let signOptions = {
            issuer:  'https://tiledesk.com',
            subject:  'subscription',        
            audience:  'https://tiledesk.com/subscriptions/'+s._id,        
          };

          if (s.global==true){
            signOptions.audience = 'https://tiledesk.com';

            let alg = process.env.GLOBAL_SECRET_ALGORITHM;
            if (alg) {
              signOptions.algorithm = alg;
            }
            secret = process.env.GLOBAL_SECRET || config.secret;   
            let pKey = process.env.GLOBAL_SECRET_OR_PRIVATE_KEY;
            // console.log("pKey",pKey);

            if (pKey) {
              secret = pKey.replace(/\\n/g, '\n');
            }

          }
    
          let token = jwt.sign(sJson, secret, signOptions); //priv_jwt pp_jwt
          json["token"] = token;

          winston.debug("Calling subscription " + s.event + " TO " + s.target + " with secret " +secret+ " with json " , json);
          // for sync use no retry 
          
          request({
            url: s.target,
            headers: {
             'Content-Type' : 'application/json',        
              'x-hook-secret': xHookSecret,
              'User-Agent': 'tiledesk-webhooks',
              'Origin': webhook_origin
            },
            json: json,
            method: 'POST'

          }, function(err, response, jsonResponse){
            winston.debug("subscription notifier SENT " + s.event + " TO " + s.target +  " with error " , err);
            winston.debug("SubscriptionLog response", response);
            winston.debug("SubscriptionLog jsonResponse", jsonResponse);

              let subscriptionLog = new SubscriptionLog({event: s.event, target: s.target, 
                response: JSON.stringify(response),
                body: JSON.stringify(jsonResponse),
                jsonRequest: JSON.stringify(json),
                err: err, id_project:s.id_project});

              subscriptionLog.save(function (errSL, sl) {           
                if (errSL) {
                  winston.error("Error saving subscriptionLog", errSL);
                  return 0;
                }
                winston.debug("SubscriptionLog saved", sl);
              });

            if (err) {
              winston.error("Error sending webhook for event " + s.event + " TO " + s.target +  " with error " , err);
              if (callback) {
                callback(err, jsonResponse);
              }
              
            }
              //return
              // console.log("callback qui1", callback);
            if (callback) {
              // console.log("callback qui", json);
              callback(null, jsonResponse);
            }

          });
      });
  // });
}
  // https://mongoosejs.com/docs/middleware.html#post-async
  decorate(model, modelName) {
    let isNew = false;

    model.pre('save', function(next) {
      isNew = this.isNew;
      winston.debug("Subscription.notify.pre (isNew)", isNew);
     
      return next();
    });

    //winston.debug("decorate");
    // .afterCreate = function(item, next) {
    model.post('save', function(doc, next) {
     
       // If we have isNew flag then it's an update
       let event = (isNew) ? 'create' : 'update';
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

    let enabled = process.env.RESTHOOK_ENABLED || "false";
    winston.debug('SubscriptionNotifier enabled:'+enabled);

    if (enabled==="true") {
      winston.debug('SubscriptionNotifier enabled');
    }else {
      winston.info('Resthook disabled');
      return 0;
    }

// queued 
    // let messageCreateKey = 'message.create';
    // if (messageEvent.queueEnabled) {
    //   messageCreateKey = 'message.create.queue';
    // }
    // messageEvent.on(messageCreateKey, function(message) {   //queued tested
    //   setImmediate(() => {
    //     winston.info('SubscriptionNotifier message.create');
    //     subscriptionNotifier.subscribe('message.create', message);
    //   });
    // });

    message2Event.on('message.create.**.channel.*', function(message) {    //notqueued high
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



// queued 
    // let requestCreateKey = 'request.create';
    // if (requestEvent.queueEnabled) {
    //   requestCreateKey = 'request.create.queue';
    // }
    // requestEvent.on(requestCreateKey, function(request) {  //queued tested
    //   setImmediate(() => {
    //     winston.info('SubscriptionNotifier request.create');
    //     subscriptionNotifier.subscribe('request.create', request);       
    //   });
    // });


// queued 
    // let requestUpdateKey = 'request.update';
    // if (requestEvent.queueEnabled) {
    //   requestUpdateKey = 'request.update.queue';
    // }
    // requestEvent.on(requestUpdateKey, function(request) {    //queued tested
    //   setImmediate(() => {
    //     winston.info('SubscriptionNotifier request.update');
    //     subscriptionNotifier.subscribe('request.update', request);
    //   });        
    // });


    // queued 
    // let requestCloseKey = 'request.close';   //request.close event here queued under job
    // if (requestEvent.queueEnabled) {
    //   requestCloseKey = 'request.close.queue';
    // }
    // requestEvent.on(requestCloseKey, function(request) {   //request.close event here noqueued     //queued tested
    //   winston.info('SubscriptionNotifier request.close');
    //   winston.info("request.close event here 1")
    //   setImmediate(() => {
    //     Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {
    //       let requestJson = request;
    //       if (request.toJSON) {
    //         requestJson = request.toJSON();
    //       }
          
    //       requestJson.messages = messages;
    //       subscriptionNotifier.subscribe('request.close', requestJson);
    //     });   
    //   });
    // });


    // queued 
    // let leadCreateKey = 'lead.create';   //request.close event here queued under job
    // if (leadEvent.queueEnabled) {
    //   leadCreateKey = 'lead.create.queue';
    // }
    // leadEvent.on(leadCreateKey, function(lead) {    //notqueued high
    //   setImmediate(() => {
    //     subscriptionNotifier.subscribe('lead.create', lead);
    //   });
    // });


      botEvent.on('faqbot.create', function(faqBot) {  //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.create', faqBot);
        });
      });

      botEvent.on('faqbot.update', function(faqBot) {    //queued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.update', faqBot);
        });
      });

      botEvent.on('faqbot.delete', function(faqBot) {    //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faqbot.delete', faqBot);
        });
      });

      faqBotEvent.on('faq.create', function(faq) {       //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.create', faq);
        });
      });

      faqBotEvent.on('faq.update', function(faq) {       //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.update', faq);
        });
      });
      faqBotEvent.on('faq.delete', function(faq) {      //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('faq.delete', faq);
        });
      });

      authEvent.on('user.signup',  function(event) {    //notqueued
        setImmediate(() => {
          let user = event.savedUser;
          delete user.password;

          subscriptionNotifier.subscribe('user.signup', user);         
        });
      });


      // authEvent.emit('project_user.invite', {req:req, savedProject_userPopulated: savedProject_userPopulated});

      authEvent.on('project_user.invite',  function(event) {   //notqueued
        setImmediate(() => {
          subscriptionNotifier.subscribe('project_user.invite', event.savedProject_userPopulated);         
        });
      });
    
      // authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});


      // queued 
      // let authProjectUserUpdateKey = 'project_user.update';
      // if (authEvent.queueEnabled) {
      //   authProjectUserUpdateKey = 'project_user.update.queue';
      // }
      // authEvent.on(authProjectUserUpdateKey,  function(event) {    //notqueued  high
      //   setImmediate(() => {
      //     subscriptionNotifier.subscribe('project_user.update', event.updatedProject_userPopulated);         
      //   });
      // });
    
      // authEvent.emit('project_user.delete', {req: req, project_userPopulated: project_userPopulated});

     authEvent.on('project_user.delete',  function(event) {      //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('project_user.delete', event.project_userPopulated);               
      });
     });


     //TODO lanciare user.signin in questo modo uno esternamente con webhook può creare proactive greetings

    departmentEvent.on('operator.select',  function(result) {     //notqueued
      winston.debug("departmentEvent.on(operator.select");

      let operatorSelectedEvent = result.result;
      let resolve = result.resolve;
      let reject = result.reject;

      // aggiungere context. lascio lo passso già a result.result
      // operatorSelectedEvent["context"] = result.context;

      let disableWebHookCall = result.disableWebHookCall;
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


    departmentEvent.on('department.create',  function(department) {      //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.create', department);         
      });
    });
  
  
    departmentEvent.on('department.update',  function(department) {       //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.update', department);         
      });
    });

    departmentEvent.on('department.delete',  function(department) {        //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('department.delete', department);         
      });
    });


    groupEvent.on('group.create',  function(group) {                      //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.create', group);         
      });
    });
  
  
    groupEvent.on('group.update',  function(group) {                      //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.update', group);         
      });
    });

    groupEvent.on('group.delete',  function(group) {                      //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('group.delete', group);         
      });
    });

    eventEvent.on('event.emit',  function(event) {                        //notqueued
      setImmediate(() => {
        subscriptionNotifier.subscribe('event.emit', event);         
      });
    });

    // event2Event.on(name, savedEventPopulated);
    event2Event.on('**', function(savedEventPopulated) {                //notqueued
      setImmediate(() => {
        winston.debug("eventname",this.event);
        subscriptionNotifier.subscribe('event.emit.'+this.event, savedEventPopulated);         
      });
    });


    projectEvent.on('project.create',  function(project) {              //notqueued
      setImmediate(() => {
        let projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.create', projectJson);         
      });
    });

    projectEvent.on('project.update',  function(project) {              //notqueued
      setImmediate(() => {
        let projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.update', projectJson);         
      });
    });

    projectEvent.on('project.downgrade',  function(project) {           //notqueued
      setImmediate(() => {
        let projectJson = project.toJSON();
        projectJson.id_project = projectJson._id;
        subscriptionNotifier.subscribe('project.downgrade', projectJson);         
      });
    });

    projectEvent.on('project.delete',  function(project) {              //notqueued
      setImmediate(() => {
        let projectJson = project.toJSON();
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
        winston.debug("found Subscription.notify", eventName, payload , "length", subscriptions.length);
        subscriptionNotifier.notify(subscriptions, payload, callback);           
      } else {
        if (callback) {
          let err = {msg:"No subscriptions found", code:404};
          callback(err, undefined);
        }
      }
    });

  }



};

let subscriptionNotifier = new SubscriptionNotifier();

// winston.debug('messageEvent', messageEvent);


module.exports = subscriptionNotifier;
