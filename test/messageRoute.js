//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');
var leadService = require('../services/leadService');
var messageService = require('../services/messageService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var winston = require('../config/winston');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('MessageRoute', () => {



  it('create', function (done) {
    // this.timeout(10000);

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("message-create", savedUser._id).then(function(savedProject) {
     

          chai.request(server)
            .post('/'+ savedProject._id + '/requests/req123/messages')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({"sender":"sender", "senderFullname":"senderFullname", "text":"text"})
            .end(function(err, res) {
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');                          

                expect(res.body.sender).to.equal("sender");
                expect(res.body.senderFullname).to.equal("senderFullname");
                expect(res.body.recipient).to.equal("req123");
                expect(res.body.text).to.equal("text");
                expect(res.body.id_project).to.equal(savedProject._id.toString());
                expect(res.body.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.status).to.equal(0);

                expect(res.body.request.request_id).to.equal("req123");
                expect(res.body.request.requester_id).to.equal("sender");
                expect(res.body.request.first_text).to.equal("text");
                expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.request.messages_count).to.equal(1);
                expect(res.body.request.status).to.equal(200);                                
                expect(res.body.request.agents.length).to.equal(1);
                expect(res.body.request.participants.length).to.equal(1);
                expect(res.body.request.department).to.not.equal(null);
                expect(res.body.request.lead).to.equal(null);               
                            
          
               done();
            });
    });
  });
});





it('getall', function (done) {
  // this.timeout(10000);

  var email = "test-ssa-" + Date.now() + "@email.com";
  var pwd = "pwd";

  userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    projectService.create("message-create", savedUser._id).then(function(savedProject) {

      leadService.createIfNotExists("leadfullname-message-getall", "andrea.leo@-subscription-message-getall.it", savedProject._id).then(function(createdLead) {
        requestService.createWithId("request_id-message-getall", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            messageService.create(savedUser._id, "senderFullname", savedRequest.request_id, "hello",
            savedProject._id, savedUser._id).then(function(savedMessage){
                expect(savedMessage.text).to.equal("hello");     



                      chai.request(server)
                  .get('/'+ savedProject._id + '/requests/request_id-message-getall/messages')
                  .auth(email, pwd)
                  .set('content-type', 'application/json')
                  .end(function(err, res) {
                      //console.log("res",  res);
                      console.log("res.body",  res.body);
                      res.should.have.status(200);
                      res.body.should.be.a('array');                          

                      expect(res.body[0].sender).to.equal(savedUser._id.toString());
                      expect(res.body[0].senderFullname).to.equal("senderFullname");
                      expect(res.body[0].recipient).to.equal("request_id-message-getall");
                      expect(res.body[0].text).to.equal("hello");
                      expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                      expect(res.body[0].createdBy).to.equal(savedUser._id.toString());
                      expect(res.body[0].status).to.equal(200);

                      // expect(res.body.request.request_id).to.equal("req123");
                      // expect(res.body.request.requester_id).to.equal("sender");
                      // expect(res.body.request.first_text).to.equal("text");
                      // expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                      // expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
                      // expect(res.body.request.messages_count).to.equal(1);
                      // expect(res.body.request.status).to.equal(200);                                
                      // expect(res.body.request.agents.length).to.equal(1);
                      // expect(res.body.request.participants.length).to.equal(1);
                      // expect(res.body.request.department).to.not.equal(null);
                      // expect(res.body.request.lead).to.equal(null);               
                                  
                
                    done();
                  });

                  
                });
            });
        });
    });
  });
     


});


});


