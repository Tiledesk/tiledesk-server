//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
var Request = require("../models/request");
var projectService = require('../services/projectService');
var requestservice = require('../services/requestService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();


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
 
    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"5ad5bd52c975820014ba900a", "attributes": {"departmentId":"5b8eb4955ca4d300141fb2cc"}}}' http://localhost:3000/chat21/requests

      it('first-message', (done) => {

        projectService.create("test-first-message", "5badfe5d553d1844ad654072").then(function(savedProject) {
            let webhookContent = {"event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
            "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", 
            "projectid":savedProject._id}};

            chai.request(server)
                .post('/chat21/requests')
                .send(webhookContent)
                .end((err, res) => {
                    console.log("res.body",  res.body);
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('request_id');
                    // res.body.errors.should.have.property('pages');
                    // res.body.errors.pages.should.have.property('kind').eql('required');
                done();
                });
         });
         });


    // curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "recipient":"123456789123456789", "recipient_fullname":"Andrea Leo","text":"text", "projectid":"987654321"}}' http://localhost:3000/chat21/requests
        it('new-message', (done) => {

        projectService.create("test-first-message", "5badfe5d553d1844ad654072").then(function(savedProject) {
            requestservice.createWithId("new-message", "requester_id1", "requester_fullname1", savedProject._id, "first_text").then(function(savedRequest) {

                let webhookContent = {"event_type": "new-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", 
                "recipient":savedRequest.request_id, "recipient_fullname":"Andrea Leo","text":"text", 
                "projectid":savedProject._id}};

                chai.request(server)
                    .post('/chat21/requests')
                    .send(webhookContent)
                    .end((err, res) => {
                        console.log("res.body",  res.body);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('sender');
                        res.body.should.have.property('recipient').eql(savedRequest.request_id);
                        // res.body.errors.should.have.property('pages');
                        // res.body.errors.pages.should.have.property('kind').eql('required');
                    done();
                    });
            });
            });
    });
    });





 












    
});


