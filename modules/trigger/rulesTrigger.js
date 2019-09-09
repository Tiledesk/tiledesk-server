const activityEvent = require('../../event/activityEvent');
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
const triggerEventEmitter = require('./event/triggerEventEmitter');

var Trigger = require('./models/trigger');
var winston = require('../../config/winston');

var Engine = require('@tiledesk/tiledesk-json-rules-engine').Engine;



var messageService = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");

class RulesTrigger {

    constructor() {
      // this.engine = new Engine();;
      // this.engine = undefined;
      this.engines = {};
    }

    // getEngine() {
    //   return this.engine;
    // }

    listen(success, error) {
        var that = this;
     //modify all to async

        // activityEvent.on('user.signup', this.save);
        // activityEvent.on('user.signin', this.save);           
        // activityEvent.on('lead.create', this.save);
        // activityEvent.on('lead.update', this.save);

      //  trigger zendesk
      // TODO aggiungere quanto caricato widget
        requestEvent.on('request.create', function(request) {
          that.exec(request, 'request.create',success,error);
        });

        messageEvent.on('message.create', function(request) {
          that.exec(request, 'message.create',success,error);
        });

        messageEvent.on('message.received', function(request) {
          that.exec(request, 'message.received',success,error);
        });
        

        // action zendesk
        // send message senderFullname + message
        // add tag
        // remove tag
        // set visitor name
        // set department





       
        this.runAction();


        winston.info('RulesTrigger started');
    }

    runAction() {

      triggerEventEmitter.on('message.send', function(eventTrigger) {

        try {

        eventTrigger.triggers.forEach(function(trigger) { 
          winston.debug('runAction trigger', trigger.toObject());

          trigger.actions.forEach(function(action) { 
            winston.debug('runAction action', action.toObject());

            var fullname = action.parameters.fullName || "BOT";
            winston.debug('runAction action fullname: ' + fullname);

            var text = action.parameters.text;
            winston.debug('runAction action text: ' + text);


            var attributes = action.parameters.attributes;
            winston.debug('runAction action attributes: ' + attributes);

            var recipient;
            if (eventTrigger.eventKey=="request.create") {
              recipient = eventTrigger.event.request_id;
            }
            if (eventTrigger.eventKey=="message.create" || eventTrigger.eventKey=="message.received") {
              recipient = eventTrigger.event.recipient;
            }
            
            winston.debug('runAction action recipient: ' + recipient);

            var id_project = eventTrigger.event.id_project;
            winston.debug('runAction action id_project: ' + id_project);


              // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
              messageService.send(
                'system', 
                fullname,                                     
                recipient,
                text,
                id_project,
                null,
                attributes
              );


          });
                           
              
          });

        } catch(e) {
          winston.error("Error runAction", e);
        }

        });
      
      

    }

    createEngine() {

    }

        exec(event, eventKey,successCall,errorCall) {
          var that = this;
           // winston.info('this', this);

            // var eventKey = Object.keys(this._events);
            // var eventKey = Object.values(this._events);
            // winston.info('eventKey: ',eventKey);

            // winston.info('this', JSON.stringify(this));
            setImmediate(() => {

                
                 winston.debug('event', event);
                 winston.debug('successCall', successCall);
                //  winston.debug('event', event.toObject());
                
                let query = {id_project: event.id_project, enabled:true, 'trigger.key':eventKey};
                

                // winston.info('query', query);

                Trigger.find(query, function(err, triggers) {
                    if (err) {
                        winston.error('Error gettting bots ', err);
                        return 0;
                    }
                    if (!triggers || triggers.length==0) {
                      winston.debug('No trigger found');
                      return 0;
                    }

                    winston.info('active triggers found', triggers);


                    // var engineExists = that.engines.hasOwnProperty(event.id_project);
                    // // var engineExists = that.engines.hasOwnProperty(event.id_project+"-"+eventKey);
                    // winston.info("engineExists:"+engineExists);

                    // var engine;
                    // if (!engineExists) {
                    //   engine = new Engine();
                    //   that.engines[event.id_project] = engine;
                    //   // that.engines[event.id_project+"-"+eventKey] = engine;
                    //   winston.info("create engine");
                    // }else {
                    //   engine = that.engines[event.id_project];
                    //   // engine = that.engines[event.id_project+"-"+eventKey];
                    //   winston.info("engine already exists");
                    //   return 0;
                    // }

                    var engine = new Engine();     
                    // winston.info("create engine");              
                    // that.engine = new Engine();


                   

                    triggers.forEach(function(trigger) { 
                      winston.debug('trigger', trigger.toObject());

                      var rule = {
                        conditions: {
                        },
                        event: {  // define the event to fire when the conditions evaluate truthy
                          type: trigger.actions[0].key,
                          params: trigger.actions[0].parameters
                          // params: {
                          //   message: 'Player has fouled out!'
                          // }
                        }
                      };
  
                      if (trigger.conditions.all.toObject() && trigger.conditions.all.toObject().length>0) {
                        rule.conditions.all = trigger.conditions.all.toObject();
                      }
  
                      if (trigger.conditions.any.toObject() && trigger.conditions.any.toObject().length>0) {
                        rule.conditions.any = trigger.conditions.any.toObject();
                      }
  
                     
                      winston.info('rule', rule);

                       // define a rule for detecting the player has exceeded foul limits.  Foul out any player who:
                    // (has committed 5 fouls AND game is 40 minutes) OR (has committed 6 fouls AND game is 48 minutes)
                      
                      engine.addRule(rule);
                    // that.engine.addRule(rule);

                    });
                   
                   



                   


                  


                   
                    
                    /**
                     * Define facts the engine will use to evaluate the conditions above.
                     * Facts may also be loaded asynchronously at runtime; see the advanced example below
                     */
                    

                    // let facts = event.toObject();
                    let facts;
                    if  (event.toObject) {  //request is mongoose object
                       facts = event.toObject();
                    }else {                 //message is plain object because messageEvent replace it
                       facts = event;
                    }
                    winston.info("facts", facts);

                    engine.addFact("json", facts)
                    
                    // that.engine.on('message.send', (params) => {
                    //   winston.info('send message');
                    // });




                    engine.on('success', function(eventSuccess, almanac, ruleResult) {
                      winston.info("success eventSuccess", eventSuccess); 
                      winston.debug("success ruleResult", ruleResult); 

                      var triggerEvent = {event: event, eventKey:eventKey , triggers: triggers, ruleResult:requestEvent,engine:engine };
                      winston.debug("success triggerEvent", triggerEvent); 

                      triggerEventEmitter.emit(eventSuccess.type,triggerEvent );
                      // successCall(eventSuccess.type,triggerEvent);
                    });

                    engine.on('failure', function(eventFailure, almanac, ruleResult) {
                      winston.debug("failure eventFailure", eventFailure); 

                      var triggerEvent = {event: event, eventKey:eventKey , triggers: triggers, ruleResult:requestEvent,engine:engine };
                      winston.debug("failure triggerEvent", triggerEvent); 

                      triggerEventEmitter.emit(eventFailure.type+".failure", triggerEvent);
                      // errorCall(eventSuccess.type,triggerEvent);
                    });





                    // Run the engine to evaluate
                    engine
                      // .run(facts)
                      .run()
                      .then(events => { // run() returns events with truthy conditions
                        winston.info('all rules executed; the following events were triggered: ', events);
                        engine.stop();
                        // events.map(event => console.log(event.params.message));
                      })
                                  


                });


            //     db.bot.aggregate([
            //         {
            //            $project: {                         
            //                  $filter: {
            //                     input: "",
            //                     as: "item",
            //                     cond: { $gte: [ "$$item.price", 100 ] }
            //                     cond: { $gte: [ "$$item.price", 100 ] }
            //                     $$CURRENT
            //                  }                          
            //            }
            //         }
            //      ])

            });
        }

}

var rulesTrigger = new RulesTrigger();
module.exports = rulesTrigger;