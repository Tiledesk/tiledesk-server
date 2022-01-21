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
var faqService = require('../services/faqService');
var Department = require('../models/department');
var Faq = require('../models/faq');
var faqBotSupport = require('../services/faqBotSupport');
var Project_user = require("../models/project_user");

var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');

var leadService = require('../services/leadService');

// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('bot', () => {

  describe('/messages', () => {
 
   
    // mocha test-int/bot.js  --grep 'createSimpleExatMatch'
    it('createSimpleExatMatch', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
                    var newFaq = new Faq({
                        id_faq_kb: savedBot._id,
                        question: 'question',
                        answer: 'answer',
                        id_project: savedProject._id,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                      });
              
                                newFaq.save(function (err, savedFaq) {


                                Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {

                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/subscriptions')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send({"event":"message.create", "target":"http://localhost:3005/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("message.create"); 
                                            var secret = res.body.secret;
                                            expect(secret).to.not.equal(null);                     
                                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                            
                                        
                                            let messageReceived = 0;
                                            var serverClient = express();
                                            serverClient.use(bodyParser.json());
                                            serverClient.post('/', function (req, res) {
                                                console.log('serverClient req', JSON.stringify(req.body));                        
                                                console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                messageReceived = messageReceived+1;
                                                expect(req.body.hook.event).to.equal("message.create");
                                                expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-sending");
                                                expect(req.body.payload.request.department).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                                expect(req.body.payload.text).to.equal("answer");
                                                // console.log("savedFaq",savedFaq);
                                                expect(req.body.payload.sender).to.equal("bot_"+savedBot.id);
                                                expect(req.body.payload.recipient).to.equal("request_id-subscription-message-sending");
                                                // expect(req.body.payload.attributes._answer._id.toString()).to.equal(savedFaq._id.toString());
                                                 expect(req.body.payload.attributes._answerid.toString()).to.equal(savedFaq._id.toString());

                                                 expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(false);
                                                        
                                                 expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("question");                                                
                                                        

                                                done();
                                                
                                               
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3005, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                requestService.createWithId("request_id-subscription-message-sending", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                    messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                    savedProject._id, savedUser._id).then(function(savedMessage){
                                                        expect(savedMessage.text).to.equal("question");     
                                                        // expect(savedMessage.sender).to.equal("question");     
                                                    });
                                                });
                                            });
                                        });
                        });
                        });
                    });

            });
        });
        }).timeout(20000);





    // mocha test-int/bot.js  --grep 'createSimpleAgent'
    it('createSimpleAgent', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
                    var newFaq = new Faq({
                        id_faq_kb: savedBot._id,
                        question: 'switch agent',
                        answer: '\\agent',
                        id_project: savedProject._id,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                      });
              
                                newFaq.save(function (err, savedFaq) {


                                Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
                                    console.log('000');
                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/subscriptions')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send({"event":"request.update", "target":"http://localhost:3006/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("request.update"); 
                                            var secret = res.body.secret;
                                            expect(secret).to.not.equal(null);                     
                                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                            console.log('001');

                                        
                                            let messageReceived = 0;
                                            var serverClient = express();
                                            serverClient.use(bodyParser.json());
                                            serverClient.post('/', function (req, res) {
                                                console.log('serverClient req', JSON.stringify(req.body));                        
                                                console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                messageReceived = messageReceived+1;
                                                expect(req.body.hook.event).to.equal("request.update");
                                                console.log('11');
                                                expect(req.body.payload.request_id).to.equal("request_id-subscription-message-sending-createSimpleAgent");
                                                console.log('12');
                                                expect(req.body.payload.hasBot).equal(false);
                                                console.log('savedUser._id',savedUser._id);                                               
                                                expect(req.body.payload.participantsAgents[0]).equal(savedUser._id.toString());                                                
                                                console.log('13');                                               
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                                expect(req.body.payload.first_text).to.equal("first_text");
                                               
                                                done();
                                                
                                               
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3006, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            leadService.createIfNotExists("leadfullname-subscription-message-sending-createSimpleAgent", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                requestService.createWithId("request_id-subscription-message-sending-createSimpleAgent", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                    messageService.create(savedUser._id, "test sender", savedRequest.request_id, "switch agent",
                                                    savedProject._id, savedUser._id).then(function(savedMessage){
                                                        expect(savedMessage.text).to.equal("switch agent");     
                                                        // expect(savedMessage.sender).to.equal("question");     
                                                    });
                                                });
                                            });
                                        });
                        });
                        });
                    });

            });
        });
        }).timeout(20000);




 
    // mocha test-int/bot.js  --grep 'createSimpleAgentTwoAgent'
    it('createSimpleAgentTwoAgent', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {

            projectService.create("test-bot", savedUser._id).then(function(savedProject) {   

            userService.signup( "test-bot-" + Date.now() + "@email.com" ,pwd, "Test Firstname", "Test lastname").then(function(savedUser2) {

            var newProject_user = new Project_user({
                // _id: new mongoose.Types.ObjectId(),
                id_project: savedProject._id.toString(),
                id_user: savedUser2._id.toString(),
                role: "agent",           
                user_available: true, 
                createdBy: savedUser._id,
                updatedBy: savedUser._id
                });
        
                return newProject_user.save(function (err, savedProject_user) {
        
                if (err) {
                    console.log("err",err)
                }
                leadService.createIfNotExists("leadfullname-subscription-message-sending-createSimpleAgent", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                requestService.createWithId("request_id-subscription-message-sending-createSimpleAgent-2", createdLead._id, savedProject._id, "first_text").then(function(savedRequest2) {
                    console.log("savedRequest2",  savedRequest2);

                    expect(savedRequest2.request_id).to.equal("request_id-subscription-message-sending-createSimpleAgent-2");
                    // expect(savedRequest2.participantsAgents[0]).equal(savedUser2._id.toString());      
                    var selectedAgent = savedRequest2.participantsAgents[0];
                    console.log("selectedAgent",  selectedAgent);

                    expect(savedRequest2.hasBot).equal(false);

                    messageService.create(savedUser._id, "test sender", savedRequest2.request_id, "switch agent", savedProject._id, savedUser._id).then(function(savedMessage2){
                        expect(savedMessage2.text).to.equal("switch agent");     
                        // expect(savedMessage.sender).to.equal("question");     
                    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
                    var newFaq = new Faq({
                        id_faq_kb: savedBot._id,
                        question: 'switch agent',
                        answer: '\\agent',
                        id_project: savedProject._id,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                      });
              
                                newFaq.save(function (err, savedFaq) {


                                Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
                                    console.log('000');
                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/subscriptions')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send({"event":"request.update", "target":"http://localhost:3021/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("request.update"); 
                                            var secret = res.body.secret;
                                            expect(secret).to.not.equal(null);                     
                                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                            console.log('001');

                                        
                                            let messageReceived = 0;
                                            var serverClient = express();
                                            serverClient.use(bodyParser.json());
                                            serverClient.post('/', function (req, res) {
                                                console.log('serverClient req', JSON.stringify(req.body));                        
                                                console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                messageReceived = messageReceived+1;
                                                expect(req.body.hook.event).to.equal("request.update");
                                                console.log('11');
                                                expect(req.body.payload.request_id).to.equal("request_id-subscription-message-sending-createSimpleAgent");
                                                console.log('12');
                                                expect(req.body.payload.hasBot).equal(false);
                                                console.log('savedUser._id',savedUser._id);                                               
                                                console.log('savedUser2._id',savedUser2._id);                                               
                                                // expect(req.body.payload.participantsAgents[0]).equal(savedUser._id.toString());                                                
                                                expect(req.body.payload.participantsAgents[0]).not.equal(selectedAgent);                                                
                                                
                                                console.log('13');                                               
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                                expect(req.body.payload.first_text).to.equal("first_text");
                                               
                                                done();
                                                
                                               
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3021, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            
                                                requestService.createWithId("request_id-subscription-message-sending-createSimpleAgent", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                    messageService.create(savedUser._id, "test sender", savedRequest.request_id, "switch agent",
                                                    savedProject._id, savedUser._id).then(function(savedMessage){
                                                        expect(savedMessage.text).to.equal("switch agent");   
                                                                                                               
                                                        // expect(savedMessage.sender).to.equal("question");     
                                                    });
                                                });
                                        });
                                        });
                                    });
                                });
                        });
                        });
                    });
                });
            });
            });
        });
        }).timeout(20000);
       


    
    
    // mocha test-int/bot.js  --grep 'createSimpleFulltext'
    it('createSimpleFulltext', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", undefined, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
                    var newFaq = new Faq({
                        id_faq_kb: savedBot._id,
                        question: 'question number one',
                        answer: 'answer',
                        id_project: savedProject._id,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                      });
              
                                newFaq.save(function (err, savedFaq) {


                                Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {

                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/subscriptions')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send({"event":"message.create", "target":"http://localhost:3010/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("message.create"); 
                                            var secret = res.body.secret;
                                            expect(secret).to.not.equal(null);                     
                                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                            
                                        
                                            let messageReceived = 0;
                                            var serverClient = express();
                                            serverClient.use(bodyParser.json());
                                            serverClient.post('/', function (req, res) {
                                                console.log('serverClient req', JSON.stringify(req.body));                        
                                                console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                messageReceived = messageReceived+1;
                                                expect(req.body.hook.event).to.equal("message.create");
                                                expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-sending");
                                                expect(req.body.payload.request.department).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                                expect(req.body.payload.text).to.equal("answer");
                                                // console.log("savedFaq",savedFaq);
                                                expect(req.body.payload.sender).to.equal("bot_"+savedBot.id);
                                                expect(req.body.payload.recipient).to.equal("request_id-subscription-message-sending");
                                                // expect(req.body.payload.attributes._answer._id.toString()).to.equal(savedFaq._id.toString());
                                                 expect(req.body.payload.attributes._answerid.toString()).to.equal(savedFaq._id.toString());
                                                done();
                                                
                                               
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3010, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                requestService.createWithId("request_id-subscription-message-sending", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                    messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                    savedProject._id, savedUser._id).then(function(savedMessage){
                                                        expect(savedMessage.text).to.equal("question");     
                                                        // expect(savedMessage.sender).to.equal("question");     
                                                    });
                                                });
                                            });
                                        });
                        });
                        });
                    });

            });
        });
        }).timeout(20000);    

        
    // mocha test-int/bot.js  --grep 'createSimpleExternalSearcherBot'
    it('createSimpleExternalSearcherBot', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", "http://localhost:3001/samples/bot/external/searcher", savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
                    var newFaq = new Faq({
                        id_faq_kb: savedBot._id,
                        question: 'question number one',
                        answer: 'answer',
                        id_project: savedProject._id,
                        createdBy: savedUser._id,
                        updatedBy: savedUser._id
                      });
              
                                newFaq.save(function (err, savedFaq) {


                                Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {

                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/subscriptions')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send({"event":"message.create", "target":"http://localhost:3010/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("message.create"); 
                                            var secret = res.body.secret;
                                            expect(secret).to.not.equal(null);                     
                                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                            
                                        
                                            let messageReceived = 0;
                                            var serverClient = express();
                                            serverClient.use(bodyParser.json());
                                            serverClient.post('/', function (req, res) {
                                                console.log('serverClient req', JSON.stringify(req.body));                        
                                                console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                messageReceived = messageReceived+1;
                                                expect(req.body.hook.event).to.equal("message.create");
                                                expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-sending");
                                                expect(req.body.payload.request.department).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                                expect(req.body.payload.text).to.equal("answer");
                                                // console.log("savedFaq",savedFaq);
                                                expect(req.body.payload.sender).to.equal("bot_"+savedBot.id);
                                                expect(req.body.payload.recipient).to.equal("request_id-subscription-message-sending");
                                                // expect(req.body.payload.attributes._answer._id.toString()).to.equal(savedFaq._id.toString());
                                                 expect(req.body.payload.attributes._answerid.toString()).to.equal(savedFaq._id.toString());
                                                done();
                                                
                                               
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3010, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                requestService.createWithId("request_id-subscription-message-sending", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                    messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                    savedProject._id, savedUser._id).then(function(savedMessage){
                                                        expect(savedMessage.text).to.equal("question");     
                                                        // expect(savedMessage.sender).to.equal("question");     
                                                    });
                                                });
                                            });
                                        });
                        });
                        });
                    });

            });
        });
        }).timeout(20000);    



    // mocha test-int/bot.js  --grep 'createNotFoundDefaultFallback'

        it('createNotFoundDefaultFallback', (done) => {
       
            var email = "test-bot-" + Date.now() + "@email.com";
            var pwd = "pwd";
     
           
    
             userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                    // create(name, url, projectid, user_id, type) 
                    faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                        
                        var newFaq = new Faq({
                            id_faq_kb: savedBot._id,
                            question: 'question',
                            answer: 'answer',
                            id_project: savedProject._id,
                            createdBy: savedUser._id,
                            updatedBy: savedUser._id
                          });
                  
                                    newFaq.save(function (err, savedFaq) {
    
    
                                    Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
    
                                            chai.request(server)
                                            .post('/'+ savedProject._id + '/subscriptions')
                                            .auth(email, pwd)
                                            .set('content-type', 'application/json')
                                            .send({"event":"message.create", "target":"http://localhost:3008/"})
                                            .end((err, res) => {
                                                console.log("res.body",  JSON.stringify(res.body));
                                                // console.dir("res.body 1",  res.body);
                                                console.log("res.headers",  res.headers);
                                                res.should.have.status(200);
                                                res.body.should.be.a('object');
                                                expect(res.body.event).to.equal("message.create"); 
                                                var secret = res.body.secret;
                                                expect(secret).to.not.equal(null);                     
                                                expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                
                                            
                                                let messageReceived = 0;
                                                var serverClient = express();
                                                serverClient.use(bodyParser.json());
                                                serverClient.post('/', function (req, res) {
                                                    console.log('serverClient req', JSON.stringify(req.body));                        
                                                    console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                    messageReceived = messageReceived+1;
                                                    
                                                    expect(req.body.hook.event).to.equal("message.create");
                                                    expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-sending-createNotFoundDefaultFallback");
                                                    
                                                    expect(req.body.payload.request.department).to.not.equal(null);
                                                    
                                                    expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                    
                                                    expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                    
                                                    expect(req.headers["x-hook-secret"]).to.equal(secret);
                                                    
                                                    expect(req.body.payload.text).to.equal("I can not provide an adequate answer. Write a new question or talk to a human agent.");
                                                    // expect(req.body.payload.attributes._answer.text).to.equal("I can not provide an adequate answer. Write a new question or talk to a human agent.");
                                                    expect(req.body.payload.attributes._answerid).to.not.equal(null);

                                                    res.send('POST request to the homepage');
                                                    
                                                    done();                                                                                                      
                                                    

                                                                        
                                                });
                                                var listener = serverClient.listen(3008, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
    
    
                                                leadService.createIfNotExists("leadfullname-subscription-message-sending-createNotFoundDefaultFallback", "andrea.leo@-subscription-message-sending-createNotFoundDefaultFallback.it", savedProject._id).then(function(createdLead) {
                                                    requestService.createWithId("request_id-subscription-message-sending-createNotFoundDefaultFallback", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                        messageService.create(savedUser._id, "test sender", savedRequest.request_id, "questionNOTFOUND",
                                                        savedProject._id, savedUser._id).then(function(savedMessage){
                                                            expect(savedMessage.text).to.equal("questionNOTFOUND");     
                                                        });
                                                    });
                                                });
                                            });
                            });
                            });
                        });
    
                });
            });
            }).timeout(20000);
    
    









            // mocha test-int/bot.js  --grep 'createFaqWithImage'

            it('createFaqWithImage', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer \n\\image:https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3011/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }

                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("image");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithImage");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer");
                                                        expect(req.body.payload.metadata.src).to.equal("https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png");
                                                        expect(req.body.payload.metadata.width).to.equal(200);
                                                        expect(req.body.payload.metadata.height).to.equal(200);
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(false);
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("question");
                                                        expect(req.body.payload.attributes._raw_message).to.equal('answer \n\\image:https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png');
                                                        
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3011, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithImage", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        
    







            // mocha test-int/bot.js  --grep 'createFaqWithButton'

            it('createFaqWithButton', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer\n* Button 1\n* Button 2',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3012/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithButton");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(false);
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("question");
                                                        expect(req.body.payload.attributes._raw_message).to.equal('answer\n* Button 1\n* Button 2');
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3012, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        




            // mocha test-int/bot.js  --grep 'createFaqWithActionButtonFromId'

            it('createFaqWithActionButtonFromId', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            

                            var newFaq2 = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question2',
                                answer: 'answer2',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                                });

                            newFaq2.save(function (err, savedFaq2) {              

                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'Intro\n* button1 tdAction:'+savedFaq2._id.toString(),
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                            newFaq.save(function (err, savedFaq) {
        
                                                                                    
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3016/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);                                                   

                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }

                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithActionButton");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer2");
                                                        expect(req.body.payload.attributes._raw_message).to.equal('answer2');
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(false);
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("start action");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3016, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithActionButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "start action",
                                                            savedProject._id, savedUser._id, undefined, {action: savedFaq2._id.toString()}).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("start action");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                            });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        



              
            // mocha test-int/bot.js  --grep 'createFaqWithActionButtonFromIntentDisplayName'

            it('createFaqWithActionButtonFromIntentDisplayName', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            

                            var newFaq2 = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question2',
                                answer: 'answer2',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                                });

                            newFaq2.save(function (err, savedFaq2) {              

                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'Intro\n* button1 tdAction:'+savedFaq2.intent_display_name,
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                            newFaq.save(function (err, savedFaq) {
        
                                                                                    
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3017/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);                                                   

                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }

                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithActionButton");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer2");
                                                        expect(req.body.payload.attributes._raw_message).to.equal('answer2');
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(false);
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("start action");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3017, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithActionButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "start action",
                                                            savedProject._id, savedUser._id, undefined, {action: savedFaq2._id.toString()}).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("start action");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                            });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        

  



            // // mocha test-int/bot.js  --grep 'createFaqWithFrame'

            // it('createFaqWithFrame', (done) => {
       
            //     var email = "test-bot-" + Date.now() + "@email.com";
            //     var pwd = "pwd";
         
               
        
            //      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            //          projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
            //             // create(name, url, projectid, user_id, type) 
            //             faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
            //                 var newFaq = new Faq({
            //                     id_faq_kb: savedBot._id,
            //                     question: 'question',
            //                     answer: 'answer frame\\frame:http://localhost:3013/',
            //                     id_project: savedProject._id,
            //                     createdBy: savedUser._id,
            //                     updatedBy: savedUser._id
            //                   });
                      
            //                             newFaq.save(function (err, savedFaq) {
        
        
            //                             Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
            //                                     chai.request(server)
            //                                     .post('/'+ savedProject._id + '/subscriptions')
            //                                     .auth(email, pwd)
            //                                     .set('content-type', 'application/json')
            //                                     .send({"event":"message.create", "target":"http://localhost:3013/"})
            //                                     .end((err, res) => {
            //                                         console.log("res.body",  JSON.stringify(res.body));
            //                                         // console.dir("res.body 1",  res.body);
            //                                         console.log("res.headers",  res.headers);
            //                                         res.should.have.status(200);
            //                                         res.body.should.be.a('object');
            //                                         expect(res.body.event).to.equal("message.create"); 
            //                                         var secret = res.body.secret;
            //                                         expect(secret).to.not.equal(null);                     
            //                                         expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
            //                                         let messageReceived = 0;
            //                                         var serverClient = express();
            //                                         serverClient.use(bodyParser.json());
            //                                         serverClient.post('/', function (req, res) {
            //                                             console.log('serverClient req', JSON.stringify(req.body));                        
            //                                             console.log("serverClient.headers",  JSON.stringify(req.headers));
            //                                             if (req.body.payload.text=="question") {
            //                                                 return res.send('POST request to the homepage');
            //                                             }
            //                                             messageReceived = messageReceived+1;
            //                                             expect(req.body.hook.event).to.equal("message.create");
            //                                             expect(req.body.payload.type).to.equal("frame");
            //                                             expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithFrame");
            //                                             expect(req.body.payload.request.department).to.not.equal(null);
            //                                             expect(req.body.payload.request.department.bot).to.not.equal(null);
            //                                             expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
            //                                             expect(req.headers["x-hook-secret"]).to.equal(secret); 
            //                                             res.send('POST request to the homepage');
            //                                             expect(req.body.payload.text).to.equal("answer frame");
            //                                             // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
            //                                             // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
            //                                             done();;
                                                        
                                                      
                                                                            
            //                                         });
            //                                         var listener = serverClient.listen(3013, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
            //                                         leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
            //                                             requestService.createWithId("request_id-subscription-message-createFaqWithFrame", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            //                                                 messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
            //                                                 savedProject._id, savedUser._id).then(function(savedMessage){
            //                                                     expect(savedMessage.text).to.equal("question");     
            //                                                 });
            //                                             });
            //                                         });
            //                                     });
            //                     });
            //                     });
            //                 });
        
            //         });
            //     });
            //     }).timeout(20000);
        







            // mocha test-int/bot.js  --grep 'createFaqWithTdFrame'

            it('createFaqWithTdFrame', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer frame\ntdFrame:http://localhost:3014/',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3014/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                   
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                        messageReceived = messageReceived+1;
                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }
                                                        
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("frame");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithTdFrame");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer frame");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3014, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithTdFrame", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        





            // mocha test-int/bot.js  --grep 'createFaqWithWebhook'

            it('createFaqWithWebhook', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", undefined, savedProject._id, savedUser._id, "internal", undefined, "http://localhost:3019/", true).then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer',
                                webhook_enabled: true,
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3020/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }

                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        console.log('1');
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithButton");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        console.log('2');
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        console.log('3',req.body.payload.text);
                                                        expect(req.body.payload.text).to.equal("ok from webhook");
                                                        console.log('4');
                                                        expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("button1");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                       
                                                        done();
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3020, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                                    var serverClient2 = express();
                                                    serverClient2.use(bodyParser.json());
                                                    serverClient2.post('/', function (req, res) {
                                                        console.log('serverClient req2', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers2",  JSON.stringify(req.headers));
                                                        res.send({text:"ok from webhook\n* button1"});                                                       
                                                    });
                                                    var listener2 = serverClient2.listen(3019, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        




            // mocha test-int/bot.js  --grep 'createFaqWithDefaultIntentWebhook'

            it('createFaqWithDefaultIntentWebhook', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", undefined, savedProject._id, savedUser._id, "internal", undefined, "http://localhost:3029/", true).then(function(savedBot) {  
                            
                            Faq.findOneAndUpdate({id_project:savedProject._id,id_faq_kb:savedBot._id, question: "defaultFallback" }, {webhook_enabled: true},{new: true, upsert:false}, function (err, savedFaq) {
                            console.log("savedFaq",savedFaq);
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3022/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text.indexOf("I can not provide an adequate answer")>-1) {
                                                            return res.send('POST request to the homepage');
                                                        }
                                                        console.log('sono qui');
                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithDefaultIntentWebhook");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("ok from webhook");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("button1");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");

                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(true);
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("notfoundword");
                                                        expect(req.body.payload.attributes._raw_message).to.equal('ok from webhook\n* button1');
                                                        
                                                       
                                                        done();
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3022, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                                    var serverClient2 = express();
                                                    serverClient2.use(bodyParser.json());
                                                    serverClient2.post('/', function (req, res) {
                                                        console.log('serverClient req2', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers2",  JSON.stringify(req.headers));
                                                        res.send({text:"ok from webhook\n* button1"});                                                       
                                                    });
                                                    var listener2 = serverClient2.listen(3029, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithDefaultIntentWebhook", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "notfoundword",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("notfoundword");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
                        






            // mocha test-int/bot.js  --grep 'createFaqWithDefaultIntentWebhookReturnAttributes'

            it('createFaqWithDefaultIntentWebhookReturnAttributes', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", undefined, savedProject._id, savedUser._id, "internal", undefined, "http://localhost:3028/", true).then(function(savedBot) {  
                            
                            Faq.findOneAndUpdate({id_project:savedProject._id,id_faq_kb:savedBot._id, question: "defaultFallback" }, {webhook_enabled: true},{new: true, upsert:false}, function (err, savedFaq) {
                            console.log("savedFaq",savedFaq);
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3023/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                        console.log('sono qui',req.body.payload.text);
                                                        // if (req.body.payload.text.indexOf("I can not provide an adequate answer")>-1) {
                                                        //     return res.send('POST request to the homepage');
                                                        // }
                                                        
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        console.log('req.body.payload',req.body.payload);
                                                        expect(req.body.payload.type).to.equal("text");
                                                        console.log('01');
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithDefaultIntentWebhookReturnAttributes");
                                                        console.log('02');
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        console.log('03');
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        console.log('04');
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        console.log('05');
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 

                                                        console.log('06');
                                                        res.send('POST request to the homepage');
                                                        console.log('07', req.body.payload.text);
                                                        expect(req.body.payload.text).to.equal("ok from webhook with no microlanguage but attributes");                                                
                                                        console.log('before attributes',req.body.payload.attributes);


                                                        // expect(req.body.payload.channel_type).to.equal("group");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        console.log('11');
                                                        // expect(req.body.payload.language).to.equal("IT");
                                                        // console.log('22');
                                                        // expect(req.body.payload.channel.name).to.equal("custom-channel");

                                                        expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("button1");
                                                        console.log('33');
                                                        expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                        console.log('44');
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(true);
                                                        console.log('55');
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("notfoundword");
                                                        console.log('66');
                                                        expect(req.body.payload.attributes._raw_message).to.equal('ok from webhook with no microlanguage but attributes');
                                                        console.log('77');
                                                       
                                                        done();
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3023, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                                    var serverClient2 = express();
                                                    serverClient2.use(bodyParser.json());
                                                    serverClient2.post('/', function (req, res) {
                                                        console.log('serverClient req2', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers2",  JSON.stringify(req.headers));
                                                        res.send({text:"ok from webhook with no microlanguage but attributes", attributes: {attachment: {buttons: [{value: "button1", type:"text"}]}}});                                                       
                                                    });
                                                    var listener2 = serverClient2.listen(3028, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithDefaultIntentWebhookReturnAttributes", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "notfoundword",
                                                            savedProject._id, savedUser._id
                                                            
                                                             ,undefined, undefined, undefined, undefined, "IT", undefined, 
                                                             //{name:"custom-channel"}
                                                             )
                                                            .then(function(savedMessage){
                                                                console.log("message saved ok")
                                                            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type, channel) {
                                                            // messageService.save({sender:savedUser._id, senderFullname:"test sender",recipient: savedRequest.request_id, text:"notfoundword",
                                                            // id_project:savedProject._id, createdBy: savedUser._id, status: 0, channel:{name:"custom-channel"}}).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("notfoundword");     
                                                                expect(savedMessage.language).to.equal("IT");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
                        




            // mocha test-int/bot.js  --grep 'createFaqWithDefaultIntentWebhookReturnTypeAndMetadata'

            it('createFaqWithDefaultIntentWebhookReturnTypeAndMetadata', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", undefined, savedProject._id, savedUser._id, "internal", undefined, "http://localhost:3030/", true).then(function(savedBot) {  
                            
                            Faq.findOneAndUpdate({id_project:savedProject._id,id_faq_kb:savedBot._id, question: "defaultFallback" }, {webhook_enabled: true},{new: true, upsert:false}, function (err, savedFaq) {
                            console.log("savedFaq",savedFaq);
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3031/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));
                                                        console.log('sono qui',req.body.payload.text);
                                                        // if (req.body.payload.text.indexOf("I can not provide an adequate answer")>-1) {
                                                        //     return res.send('POST request to the homepage');
                                                        // }
                                                        
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        console.log('req.body.payload',req.body.payload);
                                                        expect(req.body.payload.type).to.equal("image");
                                                        console.log('01');
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithDefaultIntentWebhookReturnAttributes");
                                                        console.log('02');
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        console.log('03');
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        console.log('04');
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        console.log('05');
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 

                                                        console.log('06');
                                                        res.send('POST request to the homepage');
                                                        console.log('07', req.body.payload.text);
                                                        expect(req.body.payload.text).to.equal("ok from webhook with no microlanguage but type and metadata");                                                
                                                        console.log('before attributes',req.body.payload.attributes);


                                                        // expect(req.body.payload.channel_type).to.equal("group");
                                                        expect(req.body.payload.type).to.equal("image");
                                                        console.log('11');
                                                        // expect(req.body.payload.language).to.equal("IT");
                                                        // console.log('22');
                                                        // expect(req.body.payload.channel.name).to.equal("custom-channel");

                                                        expect(req.body.payload.metadata.src).to.equal("http://image.jpg");
                                                        console.log('44');
                                                        expect(req.body.payload.attributes.intent_info.is_fallback).to.equal(true);
                                                        console.log('55');
                                                        expect(req.body.payload.attributes.intent_info.question_payload.text).to.equal("notfoundword");
                                                        console.log('66');
                                                        expect(req.body.payload.attributes._raw_message).to.equal('ok from webhook with no microlanguage but type and metadata');
                                                        console.log('77');
                                                       
                                                        done();
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3031, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                                    var serverClient2 = express();
                                                    serverClient2.use(bodyParser.json());
                                                    serverClient2.post('/', function (req, res) {
                                                        console.log('serverClient req2', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers2",  JSON.stringify(req.headers));
                                                        res.send({text:"ok from webhook with no microlanguage but type and metadata", type: "image", metadata: {src: "http://image.jpg" }});                                                       
                                                    });
                                                    var listener2 = serverClient2.listen(3030, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithDefaultIntentWebhookReturnAttributes", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "notfoundword",
                                                            savedProject._id, savedUser._id
                                                            
                                                             ,undefined, undefined, undefined, undefined, "IT", undefined, 
                                                             //{name:"custom-channel"}
                                                             )
                                                            .then(function(savedMessage){
                                                                console.log("message saved ok")
                                                            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type, channel) {
                                                            // messageService.save({sender:savedUser._id, senderFullname:"test sender",recipient: savedRequest.request_id, text:"notfoundword",
                                                            // id_project:savedProject._id, createdBy: savedUser._id, status: 0, channel:{name:"custom-channel"}}).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("notfoundword");     
                                                                expect(savedMessage.language).to.equal("IT");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
                        






            



            // mocha test-int/bot.js  --grep 'createFaqWithWebhookMicrolanguage'

            it('createFaqWithWebhookMicrolanguage', (done) => {
       
                var email = "test-bot-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
               
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                        // create(name, url, projectid, user_id, type) 
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal", undefined, undefined, true).then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer\n\\webhook:http://localhost:3018/',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                chai.request(server)
                                                .post('/'+ savedProject._id + '/subscriptions')
                                                .auth(email, pwd)
                                                .set('content-type', 'application/json')
                                                .send({"event":"message.create", "target":"http://localhost:3025/"})
                                                .end((err, res) => {
                                                    console.log("res.body",  JSON.stringify(res.body));
                                                    // console.dir("res.body 1",  res.body);
                                                    console.log("res.headers",  res.headers);
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.event).to.equal("message.create"); 
                                                    var secret = res.body.secret;
                                                    expect(secret).to.not.equal(null);                     
                                                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
                                                    let messageReceived = 0;
                                                    var serverClient = express();
                                                    serverClient.use(bodyParser.json());
                                                    serverClient.post('/', function (req, res) {
                                                        console.log('serverClient req', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers",  JSON.stringify(req.headers));

                                                        if (req.body.payload.text=="question") {
                                                            return res.send('POST request to the homepage');
                                                        }

                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("text");
                                                        console.log("1")
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithButton");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        console.log("2")
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        console.log("3",req.body.payload.text)
                                                        expect(req.body.payload.text).to.equal("ok from webhook");
                                                        console.log("4")
                                                        expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("button1");
                                                        expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                       
                                                        done();
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3025, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                                    var serverClient2 = express();
                                                    serverClient2.use(bodyParser.json());
                                                    serverClient2.post('/', function (req, res) {
                                                        console.log('serverClient req2', JSON.stringify(req.body));                        
                                                        console.log("serverClient.headers2",  JSON.stringify(req.headers));
                                                        res.send({text:"ok from webhook\n* button1"});
                                                       
                                                    });
                                                    var listener2 = serverClient2.listen(3018, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);

            // // mocha test-int/bot.js  --grep 'createFaqWithTdWebhook'

            // it('createFaqWithTdWebhook', (done) => {
       
            //     var email = "test-bot-" + Date.now() + "@email.com";
            //     var pwd = "pwd";
         
               
        
            //      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            //          projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
            //             // create(name, url, projectid, user_id, type) 
            //             faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
            //                 var newFaq = new Faq({
            //                     id_faq_kb: savedBot._id,
            //                     question: 'question',
            //                     answer: 'answer\ntdWebhook:http://localhost:3020/',
            //                     id_project: savedProject._id,
            //                     createdBy: savedUser._id,
            //                     updatedBy: savedUser._id
            //                   });
                      
            //                             newFaq.save(function (err, savedFaq) {
        
        
            //                             Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
            //                                     chai.request(server)
            //                                     .post('/'+ savedProject._id + '/subscriptions')
            //                                     .auth(email, pwd)
            //                                     .set('content-type', 'application/json')
            //                                     .send({"event":"message.create", "target":"http://localhost:3020/"})
            //                                     .end((err, res) => {
            //                                         console.log("res.body",  JSON.stringify(res.body));
            //                                         // console.dir("res.body 1",  res.body);
            //                                         console.log("res.headers",  res.headers);
            //                                         res.should.have.status(200);
            //                                         res.body.should.be.a('object');
            //                                         expect(res.body.event).to.equal("message.create"); 
            //                                         var secret = res.body.secret;
            //                                         expect(secret).to.not.equal(null);                     
            //                                         expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
            //                                         let messageReceived = 0;
            //                                         var serverClient = express();
            //                                         serverClient.use(bodyParser.json());
            //                                         serverClient.post('/', function (req, res) {
            //                                             console.log('serverClient req', JSON.stringify(req.body));                        
            //                                             console.log("serverClient.headers",  JSON.stringify(req.headers));

            //                                             if (req.body.payload.text=="question") {
            //                                                 return res.send('POST request to the homepage');
            //                                             }
                                                        
            //                                             messageReceived = messageReceived+1;
            //                                             expect(req.body.hook.event).to.equal("message.create");
            //                                             expect(req.body.payload.type).to.equal("text");
            //                                             expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithButton");
            //                                             expect(req.body.payload.request.department).to.not.equal(null);
            //                                             expect(req.body.payload.request.department.bot).to.not.equal(null);
            //                                             expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
            //                                             expect(req.headers["x-hook-secret"]).to.equal(secret); 
            //                                             res.send('POST request to the homepage');
            //                                             expect(req.body.payload.text).to.equal("ok from webhook");
            //                                             // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
            //                                             // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                       
            //                                             done();
                                                      
                                                                            
            //                                         });
            //                                         var listener = serverClient.listen(3020, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

            //                                         var serverClient2 = express();
            //                                         serverClient2.use(bodyParser.json());
            //                                         serverClient2.post('/', function (req, res) {
            //                                             console.log('serverClient req2', JSON.stringify(req.body));                        
            //                                             console.log("serverClient.headers2",  JSON.stringify(req.headers));
            //                                             res.send({text:"ok from webhook"});
                                                       
            //                                         });
            //                                         var listener2 = serverClient2.listen(3019, '0.0.0.0', function(){ console.log('Node js Express started', listener2.address());});
        
        
            //                                         leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
            //                                             requestService.createWithId("request_id-subscription-message-createFaqWithButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            //                                                 messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
            //                                                 savedProject._id, savedUser._id).then(function(savedMessage){
            //                                                     expect(savedMessage.text).to.equal("question");     
            //                                                 });
            //                                             });
            //                                         });
            //                                     });
            //                     });
            //                     });
            //                 });
        
            //         });
            //     });
            //     }).timeout(20000);



    });
});




// 5 failing

// 1) bot
//      /messages
//        createFaqWithWebhook:
//    Error: Timeout of 20000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test-int/bot.js)
//     at listOnTimeout (internal/timers.js:557:17)
//     at processTimers (internal/timers.js:500:7)

// 2) bot
//      /messages
//        createFaqWithDefaultIntentWebhook:
//    Error: Timeout of 20000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test-int/bot.js)
//     at listOnTimeout (internal/timers.js:557:17)
//     at processTimers (internal/timers.js:500:7)

// 3) bot
//      /messages
//        createFaqWithDefaultIntentWebhookReturnAttributes:
//    Error: Timeout of 20000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test-int/bot.js)
//     at listOnTimeout (internal/timers.js:557:17)
//     at processTimers (internal/timers.js:500:7)

// 4) bot
//      /messages
//        createFaqWithDefaultIntentWebhookReturnTypeAndMetadata:
//    Error: Timeout of 20000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test-int/bot.js)
//     at listOnTimeout (internal/timers.js:557:17)
//     at processTimers (internal/timers.js:500:7)

// 5) bot
//      /messages
//        createFaqWithWebhookMicrolanguage:
//    Error: Timeout of 20000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test-int/bot.js)
//     at listOnTimeout (internal/timers.js:557:17)
//     at processTimers (internal/timers.js:500:7)
