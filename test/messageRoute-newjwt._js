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
var jwt = require('jsonwebtoken');
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
     projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function(savedProjectAndPU) {
     
      var savedProject = savedProjectAndPU.project;

          chai.request(server)
            .post('/'+ savedProject._id + '/requests/req123/messages')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({"text":"text"})
            .end(function(err, res) {
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');                          

                expect(res.body.sender).to.equal(savedUser._id.toString());
                // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                // expect(res.body.senderFullname).to.equal("senderFullname");
                expect(res.body.recipient).to.equal("req123");
                expect(res.body.text).to.equal("text");
                expect(res.body.id_project).to.equal(savedProject._id.toString());
                expect(res.body.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.status).to.equal(0);

                expect(res.body.request.request_id).to.equal("req123");
                // expect(res.body.request.requester_id).to.equal("sender");
                expect(res.body.request.first_text).to.equal("text");
                expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.request.messages_count).to.equal(1);
                expect(res.body.request.status).to.equal(200);                                
                expect(res.body.request.agents.length).to.equal(1);
                expect(res.body.request.participants.length).to.equal(1);
                expect(res.body.request.department).to.not.equal(null);
                expect(res.body.request.lead).to.not.equal(null);               
                            
          
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



describe('/SendMessageSigninWithCustomToken', () => {
 

  it('sendMessageSigninWithCustomTokenOk', (done) => {

      
      var email = "test-sendMessageSigninWithCustomTokenOk-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
          // create(name, createdBy, settings)
          projectService.create("test-sendMessageSigninWithCustomTokenOk", savedUser._id).then(function(savedProject) {     
        
              chai.request(server)
              .post('/'+ savedProject._id + '/keys/generate')
              .auth(email, pwd)
              .send()
              .end((err, res) => {
                  //console.log("res",  res);
                  console.log("res.body",  res.body);
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.jwtSecret).to.not.equal(null);                                                                              
              
                  // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                  var externalUserId = "123";
                  var externalUserObj = {_id: externalUserId, firstname:"andrea", lastname:"leo", email: "email2@email.com"};
                  
                  console.log("externalUserObj", externalUserObj);

// attento qui
                  var signOptions = {                                                            
                      subject:  'userexternal',                                                                 
                      audience:  '/projects/'+savedProject._id ,                                              
                      // audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                      };


                  var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
              
                  console.log("jwtToken", jwtToken);


                  chai.request(server)
                      .post('/auth/signinWithCustomToken' )
                      .set('Authorization', 'JWT '+jwtToken)
                      //.send({ id_project: savedProject._id})
                      .send()
                      .end((err, res) => {
                          //console.log("res",  res);
                          console.log("res.body",  res.body);
                          res.should.have.status(200);
                          res.body.should.be.a('object');
                          expect(res.body.success).to.equal(true);                                                                                                                     
                          expect(res.body.user.email).to.equal("email2@email.com");  
                          expect(res.body.user.firstname).to.equal("andrea");                                               
                         
                          expect(res.body.token).to.not.equal(undefined);  
                          expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                       
                      
                          chai.request(server)
                              .post('/'+ savedProject._id + '/requests/sendMessageSigninWithCustomTokenOk/messages')
                              .set('Authorization', 'JWT '+jwtToken)
                              .set('content-type', 'application/json')
                              .send({"text":"text"})
                              .end(function(err, res) {
                                  //console.log("res",  res);
                                  console.log("res.body",  res.body);
                                  res.should.have.status(200);
                                  res.body.should.be.a('object');                          

                                  expect(res.body.sender).to.equal(externalUserId);
                                  // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                                  // expect(res.body.senderFullname).to.equal("senderFullname");
                                  expect(res.body.recipient).to.equal("sendMessageSigninWithCustomTokenOk");
                                  expect(res.body.text).to.equal("text");
                                  expect(res.body.id_project).to.equal(savedProject._id.toString());
                                  expect(res.body.createdBy).to.equal(externalUserId);
                                  expect(res.body.status).to.equal(0);

                                  expect(res.body.request.request_id).to.equal("sendMessageSigninWithCustomTokenOk");
                                  expect(res.body.request.first_text).to.equal("text");
                                  expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                                  expect(res.body.request.createdBy).to.equal(externalUserId);
                                  expect(res.body.request.messages_count).to.equal(1);
                                  expect(res.body.request.status).to.equal(200);                                
                                  expect(res.body.request.agents.length).to.equal(1);
                                  expect(res.body.request.participants.length).to.equal(1);
                                  expect(res.body.request.department).to.not.equal(null);
                                  expect(res.body.request.lead).to.not.equal(null);               
                                 
                            
                                  chai.request(server)
                                    .get('/'+ savedProject._id + '/requests/sendMessageSigninWithCustomTokenOk')
                                    .auth(email, pwd)
                                    .set('content-type', 'application/json')                                   
                                    .end(function(err, res) {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        expect(res.body.lead.lead_id).to.equal(externalUserId);
                                        expect(res.body.lead.email).to.equal("email2@email.com");
                                        expect(res.body.lead.fullname).to.equal("andrea leo");
                                        expect(res.body.requester.role).to.equal("user");
                                        expect(res.body.requester.uuid_user).to.equal(externalUserId);
                                        expect(res.body.requester.id_user).to.equal(undefined);
                                        done()
                                    });
                                        
                              });
                      });
                  });
              });
          });
              
  });

});








describe('/SendMessageSigninAnonym', () => {
 

  it('sendMessageSigninAnonym', (done) => {

      
      var email = "test-sendMessageSigninAnonym-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
          // create(name, createdBy, settings)
          projectService.create("test-sendMessageSigninAnonym", savedUser._id).then(function(savedProject) {     
        
             

                  chai.request(server)
                      .post('/auth/signinAnonymously' )
                      .send({ id_project: savedProject._id})
                      .end((err, res) => {
                          //console.log("res",  res);
                          console.log("res.body",  res.body);
                          res.should.have.status(200);
                          res.body.should.be.a('object');
                          var userId = res.body.user._id;
                          expect(res.body.success).to.equal(true);                                                                                                                     
                          expect(res.body.user.email).to.equal(undefined);  
                          expect(res.body.user.firstname).to.equal("Guest");                                               
                         
                          expect(res.body.token).to.not.equal(undefined);  
                                                                       
                      
                          chai.request(server)
                              .post('/'+ savedProject._id + '/requests/sendMessageSigninAnonym/messages')
                              .set('Authorization', res.body.token)
                              .set('content-type', 'application/json')
                              .send({"text":"text"})
                              .end(function(err, res) {
                                  //console.log("res",  res);
                                  console.log("res.body",  res.body);
                                  res.should.have.status(200);
                                  res.body.should.be.a('object');                          

                                  expect(res.body.sender).to.equal(userId);
                                  // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                                  // expect(res.body.senderFullname).to.equal("senderFullname");
                                  expect(res.body.recipient).to.equal("sendMessageSigninAnonym");
                                  expect(res.body.text).to.equal("text");
                                  expect(res.body.id_project).to.equal(savedProject._id.toString());
                                  expect(res.body.createdBy).to.equal(userId);
                                  expect(res.body.status).to.equal(0);

                                  expect(res.body.request.request_id).to.equal("sendMessageSigninAnonym");
                                  expect(res.body.request.first_text).to.equal("text");
                                  expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                                  expect(res.body.request.createdBy).to.equal(userId);
                                  expect(res.body.request.messages_count).to.equal(1);
                                  expect(res.body.request.status).to.equal(200);                                
                                  expect(res.body.request.agents.length).to.equal(1);
                                  expect(res.body.request.participants.length).to.equal(1);
                                  expect(res.body.request.department).to.not.equal(null);
                                  expect(res.body.request.lead).to.not.equal(null);               
                                 
                            
                                  chai.request(server)
                                    .get('/'+ savedProject._id + '/requests/sendMessageSigninAnonym')
                                    .auth(email, pwd)
                                    .set('content-type', 'application/json')                                   
                                    .end(function(err, res) {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        expect(res.body.lead.lead_id).to.equal(userId);
                                        expect(res.body.lead.email).to.equal(undefined);
                                        expect(res.body.lead.fullname).to.equal("Guest ");
                                        expect(res.body.requester.role).to.equal("guest");
                                        expect(res.body.requester.uuid_user).to.equal(userId);
                                        expect(res.body.requester.id_user).to.equal(undefined);
                                        done()
                                    });
                                        
                              });
                      });
              
              });
          });
              
  });

});

});


