const activityEvent = require('../event/activityEvent');
const requestEvent = require('../event/requestEvent');
var Bot = require('../models/bot');
var winston = require('../config/winston');

// import { Engine } from 'json-rules-engine'
var Engine = require('json-rules-engine').Engine;

class RulesTrigger {

    listen() {
        var that = this;
     //modify all to async

        // activityEvent.on('user.signup', this.save);
        // activityEvent.on('user.signin', this.save);           
        // activityEvent.on('lead.create', this.save);
        // activityEvent.on('lead.update', this.save);
       
    
        requestEvent.on('request.create', this.exec);
    }

        exec(event) {
            // winston.info('this', this);
            // winston.info('this', JSON.stringify(this));
            setImmediate(() => {

                
                // winston.info('event', event.toObject());
                
                let query = {id_project: event.id_project, enabled:true, 'trigger.key':'request.create'};

                // winston.info('query', query);

                Bot.find(query, function(err, bots) {
                    if (err) {
                        winston.error('Error gettting bots ', err);
                        return 0;
                    }

                    winston.info('active bots found', bots);



                    let engine = new Engine();

                    // define a rule for detecting the player has exceeded foul limits.  Foul out any player who:
                    // (has committed 5 fouls AND game is 40 minutes) OR (has committed 6 fouls AND game is 48 minutes)
                    engine.addRule({
                      conditions: {
                        all: [{
                            fact: 'first_text',
                            operator: 'equal',
                            value: 'first_text'
                          }]
                      },
                      event: {  // define the event to fire when the conditions evaluate truthy
                        type: 'fouledOut',
                        params: {
                          message: 'Player has fouled out!'
                        }
                      }
                    })
                    
                    /**
                     * Define facts the engine will use to evaluate the conditions above.
                     * Facts may also be loaded asynchronously at runtime; see the advanced example below
                     */
                    // let facts = {
                    //   personalFoulCount: 6,
                    //   gameDuration: 40
                    // }

                    let facts = event.toObject();
                    
                    // Run the engine to evaluate
                    engine
                      .run(facts)
                      .then(events => { // run() returns events with truthy conditions
                        events.map(event => console.log(event.params.message));
                      })
                    
                    /*
                     * Output:
                     *
                     * Player has fouled out!
                     */








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