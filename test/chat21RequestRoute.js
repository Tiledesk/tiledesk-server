//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
var Request = require("../models/request");
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var Lead = require('../models/lead');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;

chai.use(chaiHttp);

// run with 
// npm test -- ./test/chat21RequestRoute.js

//Our parent block
describe('Request', () => {
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

    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"5bae598b085bcf0c0b2d34c3"}}' http://localhost:3000/chat21/requests

      it('first-message', (done) => {

          projectService.create("test-first-message", userid).then(function(savedProject) {

            var request_id = "support-group-123456789123456789";
            let webhookContent = {"event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
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
                    res.body.should.have.property('request_id');
                    res.body.should.have.property('request_id').eql(request_id);
                    res.body.should.have.property('requester_id').eql("sender");
              
                done();
                });
          });
        });


        it('first-messageWithEmailAndFullname', (done) => {

            projectService.create("test-first-message", userid).then(function(savedProject) {
  
              var request_id = "support-group-123456789123456789";
              let webhookContent = {
                  "event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
                  "recipient":request_id, "recipient_fullname":"Andrea Leo","text":"text", 
                  "attributes": {"projectId":savedProject._id, "userEmail": "a1@a1.it", "userFullname":"Andrea"} }
                };
  
              chai.request(server)
                  .post('/chat21/requests')
                  .send(webhookContent)
                  .end((err, res) => {
                      console.log("res",  res);
                      console.log("res.body",  res.body);
                      res.should.have.status(200);
                      res.body.should.be.a('object');
                      res.body.should.have.property('request_id');
                      res.body.should.have.property('request_id').eql(request_id);

                        Lead.findById(res.body.requester_id, function(err, lead) {
                            console.log("lead res", lead);
                            // res.body.should.have.property('requester_id').eql("sender");
                            expect(lead.fullname).equal("Andrea");
                            expect(lead.email).to.equal("a1@a1.it");
                            done();
                        });
                
                 
                  });
            });
          });


    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
        it('new-message', (done) => {

        projectService.create("test-new-message", userid).then(function(savedProject) {
            requestService.createWithId("support-group-newmessageid", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {

                let webhookContent = {"event_type": "new-message", "data":{"sender":userid, "sender_fullname": "agent", 
                "recipient":savedRequest.request_id, "recipient_fullname":"Andrea Leo","text":"text", 
                "attributes": {"projectId":savedProject._id} }};

                chai.request(server)
                    .post('/chat21/requests')
                    .send(webhookContent)
                    .end((err, res) => {
                        console.log("res.body",  res.body);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('sender');
                        res.body.should.have.property('recipient').eql(savedRequest.request_id);

                        Request.findById(savedRequest._id, function(err, request) {
                            console.log("request",  request);
                            expect(request.waiting_time).to.not.equal(null);
                            expect(request.waiting_time).to.gt(0);
                            done();
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


