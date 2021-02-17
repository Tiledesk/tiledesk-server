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
                                        .send({"event":"message.create", "target":"http://localhost:3006/"})
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
                                            var listener = serverClient.listen(3006, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


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





    
    // mocha test-int/bot.js  --grep 'createSimpleFulltext'
    it('createSimpleFulltext', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                    
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
                                                        messageReceived = messageReceived+1;
                                                        expect(req.body.hook.event).to.equal("message.create");
                                                        expect(req.body.payload.type).to.equal("image");
                                                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-createFaqWithImage");
                                                        expect(req.body.payload.request.department).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                        expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                        
                                                        expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                        res.send('POST request to the homepage');
                                                        expect(req.body.payload.text).to.equal("answer https://www.tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png");
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
        




            // mocha test-int/bot.js  --grep 'createFaqWithActionButton'

            it('createFaqWithActionButton', (done) => {
       
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
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].value).to.equal("Button 1");
                                                        // expect(req.body.payload.attributes.attachment.buttons[0].type).to.equal("text");
                                                    
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3012, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
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
                                answer: 'answer frame \n tdFrame:http://localhost:3014/',
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
                        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function(savedBot) {  
                            
                            var newFaq = new Faq({
                                id_faq_kb: savedBot._id,
                                question: 'question',
                                answer: 'answer\n\\webhook:http://localhost:3015/',
                                id_project: savedProject._id,
                                createdBy: savedUser._id,
                                updatedBy: savedUser._id
                              });
                      
                                        newFaq.save(function (err, savedFaq) {
        
        
                                        Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {
        
                                                // chai.request(server)
                                                // .post('/'+ savedProject._id + '/subscriptions')
                                                // .auth(email, pwd)
                                                // .set('content-type', 'application/json')
                                                // .send({"event":"message.create", "target":"http://localhost:3009/"})
                                                // .end((err, res) => {
                                                //     console.log("res.body",  JSON.stringify(res.body));
                                                //     // console.dir("res.body 1",  res.body);
                                                //     console.log("res.headers",  res.headers);
                                                //     res.should.have.status(200);
                                                //     res.body.should.be.a('object');
                                                //     expect(res.body.event).to.equal("message.create"); 
                                                //     var secret = res.body.secret;
                                                //     expect(secret).to.not.equal(null);                     
                                                //     expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                                    
                                                
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
                                                    
                                                        done();;
                                                        
                                                      
                                                                            
                                                    });
                                                    var listener = serverClient.listen(3015, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                                                    leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                        requestService.createWithId("request_id-subscription-message-createFaqWithButton", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                                            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "question",
                                                            savedProject._id, savedUser._id).then(function(savedMessage){
                                                                expect(savedMessage.text).to.equal("question");     
                                                            });
                                                        });
                                                    });
                                                // });
                                });
                                });
                            });
        
                    });
                });
                }).timeout(20000);
        





    });
});
