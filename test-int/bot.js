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
 
   

    it('create', (done) => {
       
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
                                        .send({"event":"message.sending", "target":"http://localhost:3006/"})
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.event).to.equal("message.sending"); 
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
                                                expect(req.body.hook.event).to.equal("message.sending");
                                                expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-sending");
                                                expect(req.body.payload.request.department).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot).to.not.equal(null);
                                                expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                                
                                                expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                                res.send('POST request to the homepage');
                                            
                                                if (messageReceived==1) {
                                                    expect(req.body.payload.text).to.equal("answer");
                                                }
                                                if (messageReceived==2) {
                                                    
                                                    expect(req.body.payload.text).to.equal(faqBotSupport.LABELS.EN.DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE);
                                                    done();
                                                }
                                                
                                                                    
                                            });
                                            var listener = serverClient.listen(3006, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                                            leadService.createIfNotExists("leadfullname-subscription-message-sending", "andrea.leo@-subscription-message-sending.it", savedProject._id).then(function(createdLead) {
                                                requestService.createWithId("request_id-subscription-message-sending", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
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









    });
});
