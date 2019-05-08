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
var leadService = require('../services/leadService');
var requestService = require('../services/requestService');
var winston = require('../config/winston');

var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');
const util = require('util')


// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('Subscription', () => {
    





    describe('/requests', () => {
 
   

        it('create', (done) => {
           
            var email = "test-subscription-" + Date.now() + "@email.com";
            var pwd = "pwd";
     
            // console.log("server", server);
            // console.log("server.port", server.get('port'));
    
             userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 projectService.create("test-subscription", savedUser._id).then(function(savedProject) {   

                    chai.request(server)
                    .post('/'+ savedProject._id + '/subscriptions')
                    .auth(email, pwd)
                    .set('content-type', 'application/json')
                    .send({"event":"request.create", "target":"http://localhost:3010/"})
                    .end((err, res) => {
                        console.log("res.body",  res.body);
                        console.log("res.headers",  res.headers);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.event).to.equal("request.create"); 
                        var secret = res.body.secret;
                        expect(secret).to.not.equal(null);                     
                        expect(res.headers["x-hook-secret"]).to.equal(secret); 
                        var subid = res.body._id;                    
    
                        var serverClient = express();
                        serverClient.use(bodyParser.json());
                        //serverClient.use(express.bodyParser());
                        serverClient.post('/', function (req, res) {
                            console.log('serverClient req', util.inspect(req.body, {showHidden: false, depth: null}));                        
                            expect(req.body.hook.event).to.equal("request.create");
                            expect(req.body.hook._id).to.equal(subid);                        
                            expect(req.body.payload.request_id).to.equal("request_id1");                        
                            // expect(req.body.payload.lead).to.not.equal(null);                        
                            expect(req.body.payload.department).to.not.equal(null);                        
                            res.send('POST request to the homepage');
                            done();
                                                 
                          });
                          var listener = serverClient.listen(3010, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
    
    
                          leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
                            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
                             requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                                winston.debug("resolve", savedRequest.toObject());
                                expect(savedRequest.request_id).to.equal("request_id1");                                                                                     
                                expect(savedRequest.id_project).to.equal(savedProject._id.toString());                                                    
                              }).catch(function(err) {
                                  console.log("test reject");
                                  assert.isNotOk(err,'Promise error');
                                  done();
                              });
                          });

                    
                    });
                });
            });
            }).timeout(20000);
      







        it('update-addparticipant', (done) => {
           
            var email = "test-subscription-" + Date.now() + "@email.com";
            var pwd = "pwd";
     
            // console.log("server", server);
            // console.log("server.port", server.get('port'));
    
             userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 projectService.create("test-subscription", savedUser._id).then(function(savedProject) {   

                    chai.request(server)
                    .post('/'+ savedProject._id + '/subscriptions')
                    .auth(email, pwd)
                    .set('content-type', 'application/json')
                    .send({"event":"request.update", "target":"http://localhost:3011/"})
                    .end((err, res) => {
                        console.log("res.body",  res.body);
                        console.log("res.headers",  res.headers);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.event).to.equal("request.update"); 
                        var secret = res.body.secret;
                        expect(secret).to.not.equal(null);                     
                        expect(res.headers["x-hook-secret"]).to.equal(secret); 
                        var subid = res.body._id;                               
    
                        var serverClient = express();
                        serverClient.use(bodyParser.json());
                        //serverClient.use(express.bodyParser());
                        serverClient.post('/', function (req, res) {
                            console.log('serverClient req', util.inspect(req.body, {showHidden: false, depth: null}));                        
                            expect(req.body.hook.event).to.equal("request.update");
                            expect(req.body.hook._id).to.equal(subid);
                            expect(req.body.payload.request_id).to.equal("request_id1");                        

                            // expect(req.body.data.sender).to.equal(savedUser._id);
                            // console.log('serverClient req2');                       
                            // console.log('serverClient req3');
                            res.send('POST request to the homepage');
                            //serverClient.close(function () { console.log('Server closed!'); });
                            // console.log('serverClient req4');
                            done();
                            // console.log('serverClient req5');
                                                 
                          });
                          var listener = serverClient.listen(3011, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
    
    
                          requestService.createWithId("request_id1", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
                            var member = 'agent1';
                            requestService.addParticipantByRequestId(savedRequest.request_id, savedProject._id, member).then(function(savedRequestParticipant) {
                             winston.debug("resolve", savedRequestParticipant.toObject());
                             expect(savedRequestParticipant.request_id).to.equal("request_id1");                            
                             expect(savedRequestParticipant.participants).to.have.lengthOf(2);
                             expect(savedRequestParticipant.participants).to.contains(savedUser._id);
                             expect(savedRequestParticipant.participants).to.contains(member);
                             expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());
                     
                           
                           }).catch(function(err) {
                               console.log("test reject");
                               assert.isNotOk(err,'Promise error');
                               done();
                           });
                     
                         });

                    
                    });
                });
            });
            }).timeout(20000);
        




            it('update-removeparticipant', (done) => {
           
                var email = "test-subscription-" + Date.now() + "@email.com";
                var pwd = "pwd";
         
                // console.log("server", server);
                // console.log("server.port", server.get('port'));
        
                 userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                     projectService.create("test-subscription", savedUser._id).then(function(savedProject) {   
    
                        chai.request(server)
                        .post('/'+ savedProject._id + '/subscriptions')
                        .auth(email, pwd)
                        .set('content-type', 'application/json')
                        .send({"event":"request.update", "target":"http://localhost:3012/"})
                        .end((err, res) => {
                            console.log("res.body",  res.body);
                            console.log("res.headers",  res.headers);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.event).to.equal("request.update"); 
                            var secret = res.body.secret;
                            expect(secret).to.not.equal(null);                     
                            expect(res.headers["x-hook-secret"]).to.equal(secret); 
                            var subid = res.body._id;                                
        
                            var serverClient = express();
                            serverClient.use(bodyParser.json());
                            //serverClient.use(express.bodyParser());
                            serverClient.post('/', function (req, res) {
                                console.log('serverClient req', util.inspect(req.body, {showHidden: false, depth: null}));                        
                                expect(req.body.hook.event).to.equal("request.update");
                                expect(req.body.hook._id).to.equal(subid);                               
                                res.send('POST request to the homepage');
                                done();
                                                     
                              });
                              var listener = serverClient.listen(3012, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
        
        
                              requestService.createWithId("request_id-remove", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
                               
                                requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, savedUser._id).then(function(savedRequestParticipant) {
                                    winston.debug("resolve", savedRequestParticipant.toObject());
                                    
                                    //savedRequest is assigned -> 200
                                    expect(savedRequest.status).to.equal(200);
                            
                                    //savedRequestParticipant is unserved -> 100
                                    expect(savedRequestParticipant.request_id).to.equal("request_id-remove");                                    
                                    expect(savedRequestParticipant.agents).to.have.lengthOf(1);
                                    expect(savedRequestParticipant.status).to.equal(100);
                                    expect(savedRequestParticipant.participants).to.have.lengthOf(0);
                                    expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());
        
                                }).catch(function(err) {
                                    console.log("test reject");
                                    assert.isNotOk(err,'Promise error');
                                    done();
                                });
                         
                             });
    
                        
                        });
                    });
                });
                }).timeout(20000);







                it('update-close', (done) => {
           
                    var email = "test-subscription-" + Date.now() + "@email.com";
                    var pwd = "pwd";
             
                    // console.log("server", server);
                    // console.log("server.port", server.get('port'));
            
                     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                         projectService.create("test-subscription", savedUser._id).then(function(savedProject) {   
        
                            chai.request(server)
                            .post('/'+ savedProject._id + '/subscriptions')
                            .auth(email, pwd)
                            .set('content-type', 'application/json')
                            .send({"event":"request.close", "target":"http://localhost:3013/"})
                            .end((err, res) => {
                                console.log("res.body",  res.body);
                                console.log("res.headers",  res.headers);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.event).to.equal("request.close"); 
                                var secret = res.body.secret;
                                expect(secret).to.not.equal(null);                     
                                expect(res.headers["x-hook-secret"]).to.equal(secret); 
                                var subid = res.body._id;                                
            
                                var serverClient = express();
                                serverClient.use(bodyParser.json());
                                //serverClient.use(express.bodyParser());
                                serverClient.post('/', function (req, res) {
                                    console.log('serverClient req11', util.inspect(req.body, {showHidden: false, depth: null}));                        
                                    expect(req.body.hook.event).to.equal("request.close");
                                    expect(req.body.hook.secret).to.equal(undefined);
                                    expect(req.body.hook._id).to.equal(subid);
                                    expect(req.body.payload.request_id).to.equal("request_id-closeRequest");
                                    expect(req.body.payload.messages).to.have.lengthOf(2);                       
                                    //console.log('quiiii');
                                    res.send('POST request to the homepage');
                                    done();
                                                         
                                  });
                                  var listener = serverClient.listen(3013, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});
            
            
                                  requestService.createWithId("request_id-closeRequest", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
                                    Promise.all([
                                      messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id,  "hello1",
                                      savedProject._id, "5badfe5d553d1844ad654072"),
                                      messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
                                      savedProject._id, "5badfe5d553d1844ad654072")]).then(function(all) {
                                        requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {
                                              winston.debug("resolve closedRequest", closedRequest.toObject());
                                              expect(closedRequest.status).to.equal(1000);
                                              expect(closedRequest.closed_at).to.not.equal(null);
                                              expect(closedRequest.transcript).to.contains("hello1");
                                              expect(closedRequest.transcript).to.contains("hello2");
                                            }).catch(function(err){
                                              winston.error("test reject", err);
                                              assert.isNotOk(err,'Promise error');
                                              done();
                                            });
                                        });
                                    });        
                            
                            });
                        });
                    });
                    }).timeout(20000);


        });

});
