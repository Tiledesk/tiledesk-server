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
   

    // it('requestCreate', (done) => {
       
    //     var email = "test-trigger-" + Date.now() + "@email.com";
    //     var pwd = "pwd";
 
       

    //      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //          projectService.create("test-trigger", savedUser._id).then(function(savedProject) {    
                    


    //             var t = new Trigger({
    //                 name: 'test',
    //                 description: 'test desc',
    //                 id_project: savedProject._id,
    //                 trigger: {key:'request.create',name:'request create event', description: 'request create event descr'},
    //                 conditions:{ all: [{fact: 'first_text', operator:'equal', value: 'first message'}]},
    //                 actions: [{key:'message.send', parameters: {fullName:"fullName",text: "hello"}}], 

    //                 // actions: [new TriggerAction({key:'message.send', name:'request create', description: 'request create descr'})], 
    //                 enabled:true,
    //                 createdBy: savedUser._id,
    //                 updatedBy: savedUser._id
    //                 });

    //                 // var t = new Trigger({
    //                 //     name: 'test',
    //                 //     description: 'test desc',
    //                 //     id_project: savedProject._id,
    //                 //     trigger: new TriggerEvent({key:'request.create',name:'request create event', description: 'request create event descr'}),
    //                 //     conditions:{ all: [new TriggerCondition({fact: 'first_text', operator:'equal', value: 'first message'})]},
    //                 //     actions: [new TriggerAction({key:'message.send', parameters: {fullName:"fullName",text: "hello"}})], 
    
    //                 //     // actions: [new TriggerAction({key:'message.send', name:'request create', description: 'request create descr'})], 
    //                 //     enabled:true,
    //                 //     createdBy: savedUser._id,
    //                 //     updatedBy: savedUser._id
    //                 //     });



    //                 // aggiungi callback a trigger per vedere quando scatta 

    //                 t.save(function (err, sb1) {                        
    //                     winston.info('trigger',sb1.toObject(),err);
    //                     expect(sb1.name).to.equal("test");
    //                     expect(sb1.trigger.key).to.equal("request.create");
    //                     expect(sb1.conditions.all[0].fact).to.equal("first_text");
    //                     expect(sb1.conditions.all[0].operator).to.equal("equal");

    //                     rulesTrigger.listen();

    //                     // rulesTrigger.getEngine().on('message.send', function(event, almanac, ruleResult) {
    //                     //     winston.info("success event", event); 
    //                     //         done(); 
    //                     //   })

    //                     triggerEventEmitter.on('message.send', function(eventTrigger) {
    //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb1._id);

    //                         if (eventTrigger.triggers[0]._id.toString() == sb1._id.toString()) {
    //                             winston.info("success eventTrigger done", eventTrigger);
    //                             done(); 
    //                         }
                           
    //                     });

    //                     triggerEventEmitter.on('message.send.failure', function(eventTrigger) {
    //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb1._id);

    //                         if (eventTrigger.triggers[0]._id.toString() == sb1._id.toString()) {
    //                             winston.info("error eventTrigger", eventTrigger);
    //                             expect(true).to.equal(false);
    //                         }
    //                     });


    //                     leadService.createIfNotExists("leadfullname-trigger", "andrea.leo@-trigger.it", savedProject._id).then(function(createdLead) {
    //                         requestService.createWithId("request_id-trigger", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
    //                                 expect(savedRequest.request_id).to.equal("request_id-trigger");                                     
    //                             });
    //                         });

                       
                            
    //                 });

    //                 });
    //             });
           
                 
           

    //     });

        it('MessageCreate', (done) => {
       
            var email = "test-trigger-" + Date.now() + "@email.com";
            var pwd = "pwd";
     
           
    
             userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 projectService.create("test-trigger", savedUser._id).then(function(savedProject) {    
                        
    
    
                    var t = new Trigger({
                        name: 'test',
                        description: 'test desc',
                        id_project: savedProject._id,
                        trigger: {key:'message.create',name:'message create event', description: 'message create event descr'},
                        // conditions:{ all: [{fact: 'status', operator:'equal', value: 200},{fact: 'text', operator:'equal', value: 'hello'}]},
                        conditions:{ all: [{fact: 'json',path:'request.first_text', operator:'equal', value: 'first message'}]},
                        // conditions:{ all: [{fact: 'request',path:'.first_text', operator:'equal', value: 'first message'}]},
                        // conditions:{ all: [{fact: 'text', operator:'equal', value: 'hello'},{fact: 'request.first_text', operator:'equal', value: 'first message'}]},
                        // conditions:{ all: [{fact: 'text', operator:'equal', value: 'hello'}]},
                        actions: [{key:'message.send', parameters: {fullName:"fullName",text: "hi"}}], 
                        enabled:true,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                        });
    
                      
    
                        // aggiungi callback a trigger per vedere quando scatta 
    
                        t.save(function (err, sb2) {                        
                            winston.debug('trigger',sb2.toObject(),err);
                            expect(sb2.name).to.equal("test");
                            expect(sb2.trigger.key).to.equal("message.create");
                            // expect(sb2.conditions.all[0].fact).to.equal("text");
                            expect(sb2.conditions.all[0].operator).to.equal("equal");
                            expect(sb2.actions[0].key).to.equal("message.send");
                            expect(sb2.actions[0].parameters.text).to.equal("hi");
    
                            rulesTrigger.listen(function(action, eventTrigger){
                                console.log("action",action,eventTrigger);
                            },function(action, eventTrigger) {
                                console.log("action",action,eventTrigger);
                            });
    
                          
    
                            // triggerEventEmitter.on('message.send', function(eventTrigger) {
                            //     // console.log("eventTrigger.engine",eventTrigger.engine);
                            //     winston.info("test success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb2._id+" " + eventTrigger.engine);
    
                            //     if (eventTrigger.triggers[0]._id.toString() == sb2._id.toString() && eventTrigger.event.text == "hello") {
                            //         winston.info("test success eventTrigger done");
                            //         done(); 
                            //     }
                               
                            // });
    
                            // triggerEventEmitter.on('message.send.failure', function(eventTrigger) {
                            //     winston.debug("test success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb2._id);
    
                            //     if (eventTrigger.triggers[0]._id.toString() == sb2._id.toString() && eventTrigger.event.text == "hello") {
                            //         winston.info("test error eventTrigger", eventTrigger);
                            //         expect(true).to.equal(false);
                            //     }
                            // });
    
    
                            leadService.createIfNotExists("leadfullname-trigger", "andrea.leo@-trigger.it", savedProject._id).then(function(createdLead) {
                                requestService.createWithId("request_id-trigger", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
                                        expect(savedRequest.request_id).to.equal("request_id-trigger");   
                                        messageService.create(savedUser._id, "test sender", savedRequest.request_id, "hello",
                                        savedProject._id, savedUser._id).then(function(savedMessage){
                                            expect(savedMessage.text).to.equal("hello");     
                                        });
                                    });
                                });
    
                           
                                
                        });
    
                        });
                    });
               
                     
               
    
            });


            // it('MessageReceived', (done) => {
       
            //     var email = "test-trigger-" + Date.now() + "@email.com";
            //     var pwd = "pwd";
         
               
        
            //      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            //          projectService.create("test-trigger", savedUser._id).then(function(savedProject) {    
                            
        
        
            //             var t = new Trigger({
            //                 name: 'test',
            //                 description: 'test desc',
            //                 id_project: savedProject._id,
            //                 trigger: {key:'message.received',name:'message received event', description: 'message received event descr'},
            //                 conditions:{ all: [{fact: 'text', operator:'equal', value: 'first message'}]},
            //                 actions: [{key:'message.send', parameters: {fullName:"fullName",text: "hello"}}], 
            //                 enabled:true,
            //                 createdBy: savedUser._id,
            //                 updatedBy: savedUser._id
            //                 });
        
                          
        
            //                 // aggiungi callback a trigger per vedere quando scatta 
        
            //                 t.save(function (err, sb) {                        
            //                     winston.info('trigger',sb.toObject(),err);
            //                     expect(sb.name).to.equal("test");
            //                     expect(sb.trigger.key).to.equal("message.received");
            //                     expect(sb.conditions.all[0].fact).to.equal("text");
            //                     expect(sb.conditions.all[0].operator).to.equal("equal");
        
            //                     rulesTrigger.listen();
        
            //                     // rulesTrigger.getEngine().on('message.send', function(event, almanac, ruleResult) {
            //                     //     winston.info("success event", event); 
            //                     //         done(); 
            //                     //   })
        
            //                     triggerEventEmitter.on('message.send', function(eventTrigger) {
            //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);
        
            //                         if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
            //                             winston.info("success eventTrigger", eventTrigger);
            //                             // done(); 
            //                         }
                                   
            //                     });
        
            //                     triggerEventEmitter.on('message.send.failure', function(eventTrigger) {
            //                         winston.info("success eventTrigger.triggers[0]._id:"+ eventTrigger.triggers[0]._id+ " " + sb._id);
        
            //                         if (eventTrigger.triggers[0]._id.toString() === sb._id.toString()) {
            //                             winston.info("error eventTrigger", eventTrigger);
            //                             expect(true).to.equal(false);
            //                         }
            //                     });
        
        
            //                     leadService.createIfNotExists("leadfullname-trigger", "andrea.leo@-trigger.it", savedProject._id).then(function(createdLead) {
            //                         requestService.createWithId("request_id-trigger", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
            //                                 expect(savedRequest.request_id).to.equal("request_id-trigger");   
            //                             });
            //                         });
        
                               
                                    
            //                 });
        
            //                 });
            //             });
                   
                         
                   
        
            //     });



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
