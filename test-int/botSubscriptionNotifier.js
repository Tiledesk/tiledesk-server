//During the test the env variable is set to test
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let projectService = require('../services/projectService');
let userService = require('../services/userService');
let should = chai.should();
let messageService = require('../services/messageService');
let requestService = require('../services/requestService');
let faqService = require('../services/faqService');
let Department = require('../models/department');
let Faq = require('../models/faq');
let faqBotSupport = require('../services/faqBotSupport');

let expect = chai.expect;
let assert = chai.assert;

//server client
let express = require('express');
const bodyParser = require('body-parser');

let leadService = require('../services/leadService');

// let http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('botSubscriptionNotifier', () => {
 
   

    it('create', (done) => {
       
        let email = "test-bot-" + Date.now() + "@email.com";
        let pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-bot", savedUser._id).then(function(savedProject) {    
                // create(name, url, projectid, user_id, type) 
                faqService.create(savedProject._id, savedUser._id, { name: "testbot", url: "http://localhost:3036/", type: "external" }).then(function(savedBot) {  
                    
                 

                    Department.findOneAndUpdate({id_project: savedProject._id, default:true}, {id_bot:savedBot._id}, function (err, updatedDepartment) {

                        
                                
                            
                                let serverClient = express();
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
                                let listener = serverClient.listen(3036, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


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
