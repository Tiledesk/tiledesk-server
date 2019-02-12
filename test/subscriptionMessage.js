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

var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');


// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('Subscription', () => {

  describe('/messages', () => {
 
   

    it('create', (done) => {
       
        var email = "test-subscription-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-subscription", savedUser._id).then(function(savedProject) {    
                chai.request(server)
                .post('/'+ savedProject._id + '/subscriptions')
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({"event":"message.create", "target":"http://localhost:3003/"})
                .end((err, res) => {
                    console.log("res.body",  res.body);
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
                        console.log('serverClient req', req.body);                        
                        expect(req.body.hook.event).to.equal("message.create");
                        expect(req.body.payload.request.request_id).to.equal("request_id-subscription-message-create");
                        expect(req.body.payload.request.department).to.not.equal(null);
                        // expect(req.body.payload.request.department).to.not.equal(null);
                        res.send('POST request to the homepage');
                      
                        done();
                                             
                      });
                      var listener = serverClient.listen(3003, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                      requestService.createWithId("request_id-subscription-message-create", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
                        messageService.create(savedUser._id, "test sender", savedRequest.request_id, "hello",
                        savedProject._id, savedUser._id).then(function(savedMessage){
                            expect(savedMessage.text).to.equal("hello");      
                        });
                    });
                });
            });
        });
        }).timeout(20000);
    });
    
    







});
