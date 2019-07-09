//During the test the env variable is set to test
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
let should = chai.should();
var messageService = require('../services/messageService');
var requestService = require('../services/requestService');


var Trigger = require('../modules/trigger/models/trigger');

var rulesTrigger = require('../modules/trigger/rulesTrigger');

var triggerEventEmitter = require('../modules/trigger/event/triggerEventEmitter');


var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');

var leadService = require('../services/leadService');
var winston = require('../config/winston');

// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('Trigger', () => { 
   

    it('create', (done) => {
       
        var email = "test-trigger-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-trigger", savedUser._id).then(function(savedProject) {    
                    


                var t = new Trigger({
                    name: 'test',
                    description: 'test desc',
                    id_project: savedProject._id,
                    trigger: {key:'request.create',name:'request create event', description: 'request create event descr'},
                    conditions:{ all: [{fact: 'first_text', operator:'equal', value: 'first message'}]},
                    actions: [{key:'message.send', parameters: {fullName:"fullName",text: "hello"}}], 

                    // actions: [new TriggerAction({key:'message.send', name:'request create', description: 'request create descr'})], 
                    enabled:true,
                    createdBy: savedUser._id,
                    updatedBy: savedUser._id
                    });

                    // var t = new Trigger({
                    //     name: 'test',
                    //     description: 'test desc',
                    //     id_project: savedProject._id,
                    //     trigger: new TriggerEvent({key:'request.create',name:'request create event', description: 'request create event descr'}),
                    //     conditions:{ all: [new TriggerCondition({fact: 'first_text', operator:'equal', value: 'first message'})]},
                    //     actions: [new TriggerAction({key:'message.send', parameters: {fullName:"fullName",text: "hello"}})], 
    
                    //     // actions: [new TriggerAction({key:'message.send', name:'request create', description: 'request create descr'})], 
                    //     enabled:true,
                    //     createdBy: savedUser._id,
                    //     updatedBy: savedUser._id
                    //     });



                    // aggiungi callback a trigger per vedere quando scatta 

                    t.save(function (err, sb) {                        
                        winston.info('trigger',sb.toObject(),err);
                        expect(sb.name).to.equal("test");
                        expect(sb.trigger.key).to.equal("request.create");
                        expect(sb.conditions.all[0].fact).to.equal("first_text");
                        expect(sb.conditions.all[0].operator).to.equal("equal");

                        rulesTrigger.listen();

                        // rulesTrigger.getEngine().on('message.send', function(event, almanac, ruleResult) {
                        //     winston.info("success event", event); 
                        //         done(); 
                        //   })

                        triggerEventEmitter.on('message.send', function(eventTrigger) {
                            winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);

                            if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
                                winston.info("success eventTrigger", eventTrigger);
                                // done(); 
                            }
                           
                        });

                        triggerEventEmitter.on('message.send.failure', function(eventTrigger) {
                            winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);

                            if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
                                winston.info("error eventTrigger", eventTrigger);
                                expect(true).to.equal(false);
                            }
                        });


                        leadService.createIfNotExists("leadfullname-trigger", "andrea.leo@-trigger.it", savedProject._id).then(function(createdLead) {
                            requestService.createWithId("request_id-trigger", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
                                    expect(savedRequest.request_id).to.equal("request_id-trigger");   
                                    done(); 
                                });
                            });

                       
                            
                    });

                    });
                });
           
                 
           

        });



        // it('createKO', (done) => {
       
        //     var email = "test-trigger-" + Date.now() + "@email.com";
        //     var pwd = "pwd";
     
           
    
        //      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        //          projectService.create("test-trigger", savedUser._id).then(function(savedProject) {    
                        
    
    
        //             var t = new Trigger({
        //                 name: 'test',
        //                 description: 'test desc',
        //                 id_project: savedProject._id,
        //                 trigger: new TriggerEvent({key:'request.create',name:'request create event', description: 'request create event descr'}),
        //                 conditions:{ all: [new TriggerCondition({fact: 'first_text', operator:'equal', value: 'first messageKOOOO'})]},
        //                 actions: [new TriggerAction({key:'message.send', parameters: {fullName:"fullName",text: "hello"}})], 
        //                  // actions: [new TriggerAction({key:'message.send', name:'request create', description: 'request create descr'})], 
        //                 enabled:true,
        //                 createdBy: savedUser._id,
        //                 updatedBy: savedUser._id
        //                 });
    
    
        //                 // aggiungi callback a trigger per vedere quando scatta 
    
        //                 t.save(function (err, sb) {                        
        //                     winston.info('trigger',sb.toObject(),err);
        //                     expect(sb.name).to.equal("test");
        //                     expect(sb.trigger.key).to.equal("request.create");
        //                     expect(sb.conditions.all[0].fact).to.equal("first_text");
        //                     expect(sb.conditions.all[0].operator).to.equal("equal");
    
        //                     rulesTrigger.listen();
    
        //                     // rulesTrigger.getEngine().on('message.send', function(event, almanac, ruleResult) {
        //                     //     winston.info("success event", event); 
        //                     //         done(); 
        //                     //   })
    
        //                     triggerEventEmitter.on('message.send', function(eventTrigger) {
        //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);

        //                         if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
        //                             winston.info("success event", eventTrigger);
        //                             expect(true).to.equal(false);
        //                         }
                                
        //                     });
    
        //                     triggerEventEmitter.on('message.send.failure', function(eventTrigger) {
        //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);
                                
        //                         if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
        //                             winston.info("error event done", eventTrigger);
        //                             done(); 
        //                         }
        //                     });
    
    
        //                     leadService.createIfNotExists("leadfullname-trigger-ko", "andrea.leo@-trigger.it", savedProject._id).then(function(createdLead) {
        //                         requestService.createWithId("request_id-trigger-ko", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
        //                                 expect(savedRequest.request_id).to.equal("request_id-trigger-ko");   
        //                                 //done(); 
        //                             });
        //                         });
    
                           
                                
        //                 });
    
        //                 });
        //             });
               
                     
               
    
        //     });



});
