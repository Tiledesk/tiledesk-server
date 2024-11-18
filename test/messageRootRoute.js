//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');
var leadService = require('../services/leadService');
var messageService = require('../services/messageService');
var Project_user = require("../models/project_user");
var roleConstants = require('../models/roleConstants');
const uuidv4 = require('uuid/v4');

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

let log = false;

chai.use(chaiHttp);

describe('MessageRoute', () => {


  // mocha test/messageRootRoute.js  --grep 'createSimple'

  it('createSimple', function (done) {
    // this.timeout(10000);

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      var email2 = "test-message-create-" + Date.now() + "@email.com";
      userService.signup(email2, pwd, "Test Firstname2", "Test lastname2").then(function (savedUser2) {

        projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

          var savedProject = savedProjectAndPU.project;

          chai.request(server)
            .post('/' + savedProject._id + '/messages')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "recipient": savedUser2._id.toString(), "recipientFullname": "Dest", "text": "text" })
            .end(function (err, res) {

              if (err) { console.error("err: ", err); }
              if (log) { console.log("res.body: ", res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');

              expect(res.body.sender).to.equal(savedUser._id.toString());
              expect(res.body.senderFullname).to.equal("Test Firstname Test lastname");
              expect(res.body.recipient).to.equal(savedUser2._id.toString());
              expect(res.body.type).to.equal("text");
              expect(res.body.text).to.equal("text");
              expect(res.body.id_project).to.equal(savedProject._id.toString());
              expect(res.body.createdBy).to.equal(savedUser._id.toString());
              expect(res.body.status).to.equal(0);
              expect(res.body.request).to.equal(undefined);
              expect(res.body.channel_type).to.equal("direct");
              expect(res.body.channel.name).to.equal("chat21");


              done();
            });
        });
      });
    });
  });





  // mocha test/messageRootRoute.js  --grep 'createValidationNoRecipient'
  it('createValidationNoRecipient', function (done) {
    // this.timeout(10000);

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text" })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(422);
            res.body.should.be.a('object');

            done();
          });
      });
    });
  });




  // mocha test/messageRootRoute.js  --grep 'createValidationNoText'
  it('createValidationNoText', function (done) {
    // this.timeout(10000);

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "recipient": "5ddd30bff0195f0017f72c6d", "recipientFullname": "Dest" })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(422);
            res.body.should.be.a('object');

            done();
          });
      });
    });
  });




  // mocha test/messageRootRoute.js  --grep 'createWithSenderFullName'

  it('createWithSenderFullName', function (done) {
    // this.timeout(10000);

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "senderFullname": "Pippo", "recipient": "5ddd30bff0195f0017f72c6d", "recipientFullname": "Dest", "text": "text" })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.sender).to.equal(savedUser._id.toString());
            expect(res.body.senderFullname).to.equal("Pippo");
            expect(res.body.recipient).to.equal("5ddd30bff0195f0017f72c6d");
            expect(res.body.type).to.equal("text");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.request).to.equal(undefined);
            expect(res.body.channel_type).to.equal("direct");
            expect(res.body.channel.name).to.equal("chat21");


            done();
          });
      });
    });
  });


});


