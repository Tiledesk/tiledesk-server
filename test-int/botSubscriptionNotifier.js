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

describe('botSubscriptionNotifier', () => {
 
   

    it('create', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create("testbot", 'http://localhost:3036/', savedProject._id, savedUser._id, "external").then(function(savedBot) {  
                    
                 

                    Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {

                        
                                
                            
                                var serverClient = express();
                                serverClient.use(bodyParser.json());
                                serverClient.post('/', function (req, res) {
                                    console.log('serverClient req', JSON.stringify(req.body));                        
                                    console.log("serverClient.headers",  JSON.stringify(req.headers));
                                  
                                   
                                
                                        expect(req.body.payload.text).to.equal("question");
                                        expect(req.body.hook.name).to.equal("testbot");
                                        expect(req.body.hook.secret).to.equal(undefined);
                                        expect(req.body.token).to.not.equal(null);
                                        done();
                                        res.send('POST request to the homepage');

                                    
                                                        
                                });
                                var listener = serverClient.listen(3036, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


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
        }).timeout(20000);








});
