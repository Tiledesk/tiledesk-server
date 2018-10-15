//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('RequestRoute', () => {

  describe('/assign', () => {
 
   

    it('assign', (done) => {

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-join-member", savedUser._id).then(function(savedProject) {
                requestService.createWithId("join-member", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {

                    var webhookContent =     { "assignee": 'assignee-member'}
                        
            
                    chai.request(server)
                        .post('/'+ savedProject._id + '/requests/' + savedRequest.request_id + '/assign')
                        .auth(email, pwd)
                        .send(webhookContent)
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('status').eql(200);
                            

                            res.body.should.have.property('participants').to.have.lengthOf(2);
                            res.body.should.have.property('participants').contains("agentid1");
                            res.body.should.have.property('participants').contains(savedUser._id);
                        
                        done();
                        });

                        
                });
                });
                });
    });








});

});


