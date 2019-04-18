//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
var Request = require("../models/request");
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var leadService = require('../services/leadService');
var Lead = require('../models/lead');
var Message = require('../models/message');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

// run with 
// npm test -- ./test/chat21RequestRoute.js

//Our parent block
describe('Chat21Requests', () => {
    // beforeEach((done) => { //Before each test we empty the database
    //     Book.remove({}, (err) => { 
    //        done();           
    //     });        
    // });
/*
  * Test the /GET route
  */

  describe('/POST', () => {
 
    var userid = "5badfe5d553d1844ad654072";


      it('new-messageWithoutEmail', (done) => {

          projectService.create("test-new-message", userid).then(function(savedProject) {

            var request_id = "support-group-"+savedProject._id;
            let webhookContent = {"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
            "recipient":request_id, "recipient_fullname":"Andrea Leo","text":"text", 
            "attributes": {"projectId":savedProject._id} }
               };

            chai.request(server)
                .post('/chat21/requests')
                .send(webhookContent)
                .end((err, res) => {
                    console.log("res.body",  res.body);
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('request_id').eql(request_id);
                    // res.body.should.have.property('requester_id').eql("sender");
                    expect(res.body.id_project).to.equal(savedProject._id.toString());
                    expect(res.body.participants).to.have.lengthOf(1);       
                    expect(res.body.messages_count).to.equal(1);     
                    // expect(request.waiting_time).to.not.equal(null);
                    // expect(request.waiting_time).to.gt(0);
                    Message.findOne({recipient : request_id, id_project: savedProject._id}, function(err, message){

                        expect(message.sender).to.equal("sender");    
                        expect(message.recipient).to.equal(request_id);     
                        expect(message.attributes.projectId).to.equal(savedProject._id.toString());     
                        Lead.findById(res.body.requester_id, function (err, lead){
                            expect(lead.fullname).to.equal("sender_fullname");   
                            assert(lead.email == null)
                            
                            done();
                        });

                        
                    });
                    
                   
                });
          });
        });



        it('new-messageWithEmail', (done) => {

            projectService.create("test-new-message", userid).then(function(savedProject) {
  
              var request_id = "support-group-"+savedProject._id;
              let webhookContent = {"event_type": "new-message", 
                "data":{
                    "sender":"sender", "sender_fullname": "sender_fullname", 
                    "recipient":request_id, "recipient_fullname":"Andrea Leo","text":"text", 
                    "attributes": {"projectId":savedProject._id, "userEmail": "user@email.com", "userFullname": "userFullname"},
                    
                    "senderAuthInfo":
                            {
                                "authType" : "USER",
                                "authVar" : {
                                "token" : {
                                    "aud" : "chat-v2-dev",
                                    "auth_time" : 1542282861,
                                    "exp" : 1542389465,
                                    "firebase" : {
                                    "sign_in_provider" : "anonymous"
                                    },
                                    "iat" : 1542385865,
                                    "iss" : "https://securetoken.google.com/chat-v2-dev",
                                    "provider_id" : "anonymous",
                                    "sub" : "yfSkr0RLgsRIVGNoHnJT8y4wIRj1",
                                    "user_id" : "yfSkr0RLgsRIVGNoHnJT8y4wIRj1"
                                },
                                "uid" : "yfSkr0RLgsRIVGNoHnJT8y4wIRj1"
                                }
                            }
                      

                    }
                 };
  
              chai.request(server)
                  .post('/chat21/requests')
                  .send(webhookContent)
                  .end((err, res) => {
                      console.log("res.body",  res.body);
                      res.should.have.status(200);
                      res.body.should.be.a('object');
                      res.body.should.have.property('request_id').eql(request_id);
                      // res.body.should.have.property('requester_id').eql("sender");
                      expect(res.body.id_project).to.equal(savedProject._id.toString());
                      expect(res.body.participants).to.have.lengthOf(1);       
                      expect(res.body.messages_count).to.equal(1);     
                      // expect(request.waiting_time).to.not.equal(null);
                      // expect(request.waiting_time).to.gt(0);
                      Message.findOne({recipient : request_id, id_project: savedProject._id}, function(err, message){

                        expect(message.sender).to.equal("sender");    
                        expect(message.recipient).to.equal(request_id);     
                        Lead.findById(res.body.requester_id, function (err, lead){
                            console.log("lead.attributes", JSON.stringify(lead.attributes));
                            expect(lead.fullname).to.equal("userFullname");   
                            expect(lead.email).to.equal("user@email.com");   
                            expect(lead.attributes.projectId).to.equal(savedProject._id.toString());   
                            expect(lead.attributes.userEmail).to.equal("user@email.com");   
                            expect(lead.attributes.senderAuthInfo.authVar.token.provider_id).to.equal("anonymous");   
                            
                            done();
                        });
                     });
  
                     
                  });
            });
          });



          it('new-messageWithEmailAndFullnameAndRequestAlreadyExists', (done) => {

            projectService.create("test-new-message", userid).then(function(savedProject) {
                var request_id = "support-group-"+savedProject._id;

                leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
                        // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy) {
                        requestService.createWithId(request_id, createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                            
                            let webhookContent = {"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
                            "recipient":request_id, "recipient_fullname":"Andrea Leo","text":"text", 
                            "attributes": {"projectId":savedProject._id, "userEmail": createdLead.email, "userFullname": createdLead.fullname} }
                                };
                
                            chai.request(server)
                                .post('/chat21/requests')
                                .send(webhookContent)
                                .end((err, res) => {
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    res.body.should.have.property('request_id').eql(request_id);
                                    res.body.should.have.property('requester_id').eql(createdLead._id.toString());
                                    expect(res.body.id_project).to.equal(savedProject._id.toString());
                                    expect(res.body.participants).to.have.lengthOf(1);       
                                    expect(res.body.messages_count).to.equal(1);     
                                    // expect(request.waiting_time).to.not.equal(null);
                                    // expect(request.waiting_time).to.gt(0);
                                    Message.findOne({recipient : request_id, id_project: savedProject._id}, function(err, message){

                                        expect(message.sender).to.equal("sender");    
                                        expect(message.recipient).to.equal(request_id);     
                                        Lead.findById(res.body.requester_id, function (err, lead){
                                            expect(lead.fullname).to.equal("leadfullname");   
                                            expect(lead.email).to.equal("email@email.com");   
                                            done();
                                        });
                                    });
                
                                    
                                });

                                });
                    });
            });
          });

    




          it('new-messageWithEmailAndFullnameAndRequestAlreadyExistsAndNOProjectID', (done) => {

            projectService.create("test-new-message", userid).then(function(savedProject) {
                var request_id = "support-group-"+savedProject._id;

                leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
                        // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy) {
                        requestService.createWithId(request_id, createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
                            
                            let webhookContent = {"event_type": "new-message", 
                                "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":request_id, "recipient_fullname":"Andrea Leo","text":"text"}
                                };
                
                            chai.request(server)
                                .post('/chat21/requests')
                                .send(webhookContent)
                                .end((err, res) => {
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    res.body.should.have.property('request_id').eql(request_id);
                                    res.body.should.have.property('requester_id').eql(createdLead._id.toString());
                                    expect(res.body.id_project).to.equal(savedProject._id.toString());
                                    expect(res.body.participants).to.have.lengthOf(1);       
                                    expect(res.body.messages_count).to.equal(1);     
                                    // expect(request.waiting_time).to.not.equal(null);
                                    // expect(request.waiting_time).to.gt(0);
                                    Message.findOne({recipient : request_id, id_project: savedProject._id}, function(err, message){

                                        expect(message.sender).to.equal("sender");    
                                        expect(message.recipient).to.equal(request_id);     
                                        Lead.findById(res.body.requester_id, function (err, lead){
                                            expect(lead.fullname).to.equal("leadfullname");   
                                            expect(lead.email).to.equal("email@email.com");   
                                            done();
                                        });
                                    });
                
                                    
                                });

                                });
                    });
            });
          });



        it('join-member', (done) => {

            projectService.create("test-join-member", userid).then(function(savedProject) {
                requestService.createWithId("join-member", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
    
                    var webhookContent =     { "event_type": 'join-member', "createdAt": 1538156223681, "group_id": savedRequest.request_id, 
                            "app_id": 'tilechat', "member_id": 'agentid1', "data": { "member_id": 'agentid1', "group":  { "createdOn": 1538156223311,
                        "iconURL": 'NOICON', "members": [Object], "name": 'Bash', "owner": 'system', 'attributes': {"projectId":savedProject._id} } } }
                        
            
                    chai.request(server)
                        .post('/chat21/requests')
                        .send(webhookContent)
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('status').eql(200);
                            

                            res.body.should.have.property('participants').to.have.lengthOf(2);
                            res.body.should.have.property('participants').contains("agentid1");
                            res.body.should.have.property('participants').contains(userid);
                           
                        done();
                        });

                        
                });
                });
        });



        it('join-member-butnottherequesterid', (done) => {

            projectService.create("test-join-member", userid).then(function(savedProject) {
                leadService.createIfNotExistsWithLeadId("requester_id1-join-member-butnottherequesterid", "leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
                requestService.createWithId("join-member-requestid", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
    
                    var webhookContent =     { "event_type": 'join-member', "createdAt": 1538156223681, "group_id": savedRequest.request_id, 
                            "app_id": 'tilechat', "member_id": createdLead.lead_id, "data": { "member_id": createdLead.lead_id, "group":  { "createdOn": 1538156223311,
                        "iconURL": 'NOICON', "members": [Object], "name": 'Bash', "owner": 'system', 'attributes': {"projectId":savedProject._id} } } }
                        
            
                    chai.request(server)
                        .post('/chat21/requests')
                        .send(webhookContent)
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(400);
                            
                           
                        done();
                        });
                    });
                        
                });
                });
        });








        it('leave-member', (done) => {

            projectService.create("test-leave-member", userid).then(function(savedProject) {
                requestService.createWithId("leave-member", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
    
                    var webhookContent =     { "event_type": 'leave-member', "createdAt": 1538156223681, "group_id": savedRequest.request_id, 
                            "app_id": 'tilechat', "member_id": userid, "id_project":savedProject._id, "data": { "member_id": userid, "group":  { "createdOn": 1538156223311,
                        "iconURL": 'NOICON', "members": [Object], "name": 'Bash', "owner": 'system', 'attributes': {"projectId":savedProject._id} } } }
                        
            
                    chai.request(server)
                        .post('/chat21/requests')
                        .send(webhookContent)
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('status').eql(100);
                            

                            res.body.should.have.property('participants').to.have.lengthOf(0);
                            // res.body.should.have.property('participants').contains("agentid1");
                            // res.body.should.have.property('participants').contains(userid);
                        
                        done();
                        });
                });
                });
        });




        it('deleted-archivedconversation', (done) => {

            projectService.create("test-deleted-archivedconversation", userid).then(function(savedProject) {
                requestService.createWithId("support-group-test-deleted-archivedconversation", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
                    requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {

                        

                        var webhookContent =     { "event_type": 'deleted-archivedconversation', "createdAt": 1538156223681, 
                                "app_id": 'tilechat',"user_id": "system", "recipient_id": "support-group-test-deleted-archivedconversation",
                                "data": {"attributes" : {"projectId" : savedProject._id} }};
                            
                
                        chai.request(server)
                            .post('/chat21/requests')
                            .send(webhookContent)
                            .end((err, res) => {
                                console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                res.body.should.have.property('status').eql(200);
                                

                                res.body.should.have.property('participants').to.have.lengthOf(1);
                                // res.body.should.have.property('participants').contains("agentid1");
                                // res.body.should.have.property('participants').contains(userid);
                            
                            done();
                            });
                    });
                });
            });
        });









 













});

});


