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

var leadService = require('../services/leadService');

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

describe('Subscription', () => {

  describe('/leads', () => {
 
   

    it('create', (done) => {
       
        var email = "test-subscription-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-subscription", savedUser._id).then(function(savedProject) {    

               

                            chai.request(server)
                            .post('/'+ savedProject._id + '/subscriptions')
                            .auth(email, pwd)
                            .set('content-type', 'application/json')
                            .send({"event":"lead.create", "target":"http://localhost:3004/"})
                            .end((err, res) => {
                                 console.log("res.body",  JSON.stringify(res.body));
                                // console.dir("res.body 1",  res.body);
                                console.log("res.headers",  res.headers);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.event).to.equal("lead.create"); 
                                var secret = res.body.secret;
                                expect(secret).to.not.equal(null);                     
                                expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                
                            

                                var serverClient = express();
                                serverClient.use(bodyParser.json());
                                serverClient.post('/', function (req, res) {
                                    console.log('serverClient req', JSON.stringify(req.body));                        
                                    console.log("serverClient.headers",  JSON.stringify(req.headers));
                                    expect(req.body.hook.event).to.equal("lead.create");
                                    expect(req.body.payload.fullname).to.equal("fullname-newlead");
                                    // expect(req.body.payload.request.department).to.not.equal(null);
                                    // expect(req.body.payload.request.department.bot).to.not.equal(null);
                                    // expect(req.body.payload.request.department.bot.name).to.equal("testbot");
                                    expect(req.headers["x-hook-secret"]).to.equal(secret); 
                                    res.send('POST request to the homepage');
                                
                                    done();
                                                        
                                });
                                var listener = serverClient.listen(3004, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});

                                var attr = {myprop:123};
                                leadService.create("fullname-newlead", "email@email.com", savedProject._id, savedUser._id, attr).then(function(savedLead) {

                                });
                               
                            });
            });
  

            
        });
        }).timeout(20000);
    });
    
    







});
