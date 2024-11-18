//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

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
let log = false;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('MessageRoute', () => {

  // mocha test/messageRoute.js  --grep 'createSimple'
  it('createSimple', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text" })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
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
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(null);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);

            done();
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createSimpleEmptyText'
  it('createSimpleEmptyText', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "" })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(422);

            done();
          });
      });
    });
  }).timeout(20000);

  // mocha test/messageRoute.js  --grep 'createSimpleNoText'
  it('createSimpleNoText', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({})
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(422);

            done();
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createSimpleWithAttributes'
  it('createSimpleWithAttributes', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123-createSimpleWithAttributes/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text", "attributes": { "a": "b" } })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req123-createSimpleWithAttributes");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.attributes.a).to.equal("b");
            expect(res.body.request.request_id).to.equal("req123-createSimpleWithAttributes");
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(null);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.request.attributes.a).to.equal("b");
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);

            done();
          });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createWithSender'
  it('createWithSender', function (done) {

    var email = "test-message-createwithsender-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      var email2 = "test-message-createwithsender22-" + Date.now() + "@email.com";
      var pwd2 = "pwd";

      userService.signup(email2, pwd2, "Test Firstname22", "Test lastname22").then(function (savedUser2) {
        projectService.createAndReturnProjectAndProjectUser("message-createwithsender", savedUser._id).then(function (savedProjectAndPU) {

          var savedProject = savedProjectAndPU.project;

          var pu2 = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: savedProject._id,
            id_user: savedUser2._id,
            role: roleConstants.AGENT,
            user_available: true,
            createdBy: savedUser2._id,
            updatedBy: savedUser2._id,
          });
          pu2.save(function (err, savedProject_user2) {

            chai.request(server)
              .post('/' + savedProject._id + '/requests/req123-createwithsender/messages')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "text", "sender": savedUser2._id.toString() })
              .end(function (err, res) {
                
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                
                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.sender).to.equal(savedUser2._id.toString());
                // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                expect(res.body.senderFullname).to.equal("Test Firstname22 Test lastname22");
                expect(res.body.recipient).to.equal("req123-createwithsender");
                expect(res.body.text).to.equal("text");
                expect(res.body.id_project).to.equal(savedProject._id.toString());
                expect(res.body.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.status).to.equal(0);
                expect(res.body.request.request_id).to.equal("req123-createwithsender");
                expect(res.body.request.requester._id).to.equal(savedProject_user2._id.toString());
                expect(res.body.request.requester.id_user.email).to.equal(email2);
                expect(res.body.request.requester.id_user.firstname).to.equal("Test Firstname22");
                expect(res.body.request.requester.id_user.lastname).to.equal("Test lastname22");
                // expect(res.body.request.requester._id).to.equal(savedProject_user2._id.toString());
                // expect(res.body.request.requester_id).to.equal("sender");
                expect(res.body.request.first_text).to.equal("text");
                expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
                // expect(res.body.request.messages_count).to.equal(1);
                expect(res.body.request.status).to.equal(200);
                expect(res.body.request.snapshot.agents.length).to.equal(2);
                expect(res.body.request.participants.length).to.equal(1);
                expect(res.body.request.department).to.not.equal(null);
                expect(res.body.request.lead).to.not.equal(null);
                expect(res.body.channel_type).to.equal("group");
                expect(res.body.channel.name).to.equal("chat21");
                expect(res.body.request.channel.name).to.equal("chat21");
                expect(res.body.request.location).to.equal(undefined);

                done();
              });
          });
        });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createWithSenderFromLead'
  it('createWithSenderFromLead', function (done) {

    var email = "test-message-createwithsenderfromlead-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createwithsender", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        var uid = uuidv4();
        var pu = new Project_user({
          // _id: new mongoose.Types.ObjectId(),
          id_project: savedProject._id,
          uuid_user: uid,
          role: roleConstants.USER,
          user_available: true,
          createdBy: savedUser._id,
          updatedBy: savedUser._id,
        });
        pu.save(function (err, savedProject_user) {
          // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy, attributes, status) {
          leadService.createIfNotExistsWithLeadId(uid, "leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {

            var now = Date.now();
            chai.request(server)
              .post('/' + savedProject._id + '/requests/req123-createwithsender-' + now + '/messages')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "text", "sender": uid })
              .end(function (err, res) {
                // console.log("res",  res);
                if (log) { console.log("res.body", res.body); }
                res.should.have.status(200);
                res.body.should.be.a('object');

                expect(res.body.sender).to.equal(uid);
                // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                expect(res.body.senderFullname).to.equal("leadfullname");
                expect(res.body.recipient).to.equal("req123-createwithsender-" + now);
                expect(res.body.text).to.equal("text");
                expect(res.body.id_project).to.equal(savedProject._id.toString());
                expect(res.body.createdBy).to.equal(savedUser._id.toString());
                expect(res.body.status).to.equal(0);

                expect(res.body.request.request_id).to.equal("req123-createwithsender-" + now);
                expect(res.body.request.requester._id).to.equal(savedProject_user._id.toString());
                expect(res.body.request.requester.uuid_user).to.equal(uid);
                // expect(res.body.request.requester.id_user.firstname).to.equal("Test Firstname22");
                // expect(res.body.request.requester.id_user.lastname).to.equal("Test lastname22");
                // expect(res.body.request.requester._id).to.equal(savedProject_user2._id.toString());
                // expect(res.body.request.requester_id).to.equal("sender");
                expect(res.body.request.first_text).to.equal("text");
                expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
                // expect(res.body.request.messages_count).to.equal(1);
                expect(res.body.request.status).to.equal(200);
                expect(res.body.request.snapshot.agents.length).to.equal(1);
                expect(res.body.request.participants.length).to.equal(1);
                expect(res.body.request.department).to.not.equal(null);
                expect(res.body.request.lead).to.not.equal(null);
                expect(res.body.channel_type).to.equal("group");
                expect(res.body.channel.name).to.equal("chat21");
                expect(res.body.request.channel.name).to.equal("chat21");
                expect(res.body.request.location).to.equal(undefined);

                done();
              });
          });
        });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createWithLocation'
  it('createWithLocation', function (done) {
    
    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req-createWithLocation/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ text: "text", location: { country: "Italy", streetAddress: "Via Roma, 767b", ipAddress: "192.168.1.1", geometry: { type: "Point", coordinates: [-109, 41] } } })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req-createWithLocation");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.request_id).to.equal("req-createWithLocation");
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.location.country).to.equal("Italy");
            expect(res.body.request.location.streetAddress).to.equal("Via Roma, 767b");
            expect(res.body.request.location.ipAddress).to.equal("192.168.1.1");
            expect(res.body.request.location.geometry.type).to.equal("Point");
            expect(res.body.request.location.geometry.coordinates[0]).to.equal(-109);
            expect(res.body.request.location.geometry.coordinates[1]).to.equal(41);

            done();
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createWithLocationAsAttributes'
  it('createWithLocationAsAttributes', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req-createWithLocationAsAttributes/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ text: "text", attributes: { ipAddress: "95.255.73.34" } })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req-createWithLocationAsAttributes");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.request_id).to.equal("req-createWithLocationAsAttributes");
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());

            chai.request(server)
              .get('/' + savedProject._id + '/requests/req-createWithLocationAsAttributes')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send()
              .end(function (err, res) {
                
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                
                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.request_id).to.equal("req-createWithLocationAsAttributes");
                expect(res.body.location.country).to.equal("IT");
                expect(res.body.location.ipAddress).to.equal("95.255.73.34");
                expect(res.body.location.geometry.type).to.equal("Point");
                expect(res.body.location.geometry.coordinates[0]).to.equal(42.6716);
                expect(res.body.location.geometry.coordinates[1]).to.equal(14.0148);

                done();
              });
          });
      });
    });
  });

  it('createDifferentChannel', function (done) {

    var email = "test-message-createdifferentchannel-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123-channel1/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ text: "text", channel: { name: "channel1" } })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req123-channel1");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.request.request_id).to.equal("req123-channel1");
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(undefined);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("channel1");
            expect(res.body.request.channel.name).to.equal("channel1");

            done();
          });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createWithMessageStatus'
  it('createWithMessageStatus', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123-createWithMessageStatus/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text", "status": 999 })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req123-createWithMessageStatus");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(999);
            expect(res.body.request.request_id).to.equal("req123-createWithMessageStatus");
            if (log) { console.log("res.body.request.requester", JSON.stringify(res.body.request.requester)); }
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(null);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);

            done();
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createWithParticipants'
  it('createWithParticipants', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123-createWithParticipants/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text", "participants": [savedUser._id] })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req123-createWithParticipants");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.request.request_id).to.equal("req123-createWithParticipants");
            // expect(res.body.request.requester).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.participants[0]).to.equal(savedUser._id.toString());
            if (log) { console.log("res.body.request.participatingAgents[0]", JSON.stringify(res.body.request.participatingAgents[0])); }
            expect(res.body.request.participatingAgents[0]._id).to.equal(savedUser._id.toString());
            expect(res.body.request.department).to.equal(undefined);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);

            done();
          });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createWithPriority'
  it('createWithPriority', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createWithPriority", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;
        var reqid = 'req123-createWithPriority' + Date.now();

        chai.request(server)
          .post('/' + savedProject._id + '/requests/' + reqid + '/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text", "priority": "hight" })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal(reqid);
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.request.request_id).to.equal(reqid);
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(null);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.request.priority).to.equal("hight");
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);
            done();
          });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createSimpleWithFollowers'
  it('createSimpleWithFollowers', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests/req123-createSimpleWithFollowers/messages')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "text", "followers": [savedProjectAndPU.project_user._id.toString()] })
          .end(function (err, res) {
            
            if (err) { console.error("err", err); }
            if (log) { console.log("res.body", JSON.stringify(res.body)); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.senderFullname).to.equal("senderFullname");
            expect(res.body.recipient).to.equal("req123-createSimpleWithFollowers");
            expect(res.body.text).to.equal("text");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.createdBy).to.equal(savedUser._id.toString());
            expect(res.body.status).to.equal(0);
            expect(res.body.request.request_id).to.equal("req123-createSimpleWithFollowers");
            expect(res.body.request.requester._id).to.equal(savedProjectAndPU.project_user._id.toString());
            // expect(res.body.request.requester_id).to.equal("sender");
            expect(res.body.request.first_text).to.equal("text");
            expect(res.body.request.id_project).to.equal(savedProject._id.toString());
            expect(res.body.request.createdBy).to.equal(savedUser._id.toString());
            // expect(res.body.request.messages_count).to.equal(1);
            expect(res.body.request.status).to.equal(200);
            expect(res.body.request.snapshot.agents.length).to.equal(1);
            expect(res.body.request.participants.length).to.equal(1);
            expect(res.body.request.department).to.not.equal(null);
            expect(res.body.request.lead).to.not.equal(null);
            expect(res.body.channel_type).to.equal("group");
            expect(res.body.channel.name).to.equal("chat21");
            expect(res.body.request.channel.name).to.equal("chat21");
            expect(res.body.request.location).to.equal(undefined);
            expect(res.body.request.followers[0]).to.equal(savedProjectAndPU.project_user._id.toString());

            done();
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createMultiTextNoSender1'
  it('createMultiTextNoSender1', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createMultiText", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (log) { console.log("res.body", res.body); }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('first_text').eql('first_text');

            var request_id = res.body.request_id;
            if (log) { console.log("request_id", request_id); }

            chai.request(server)
              .post('/' + savedProject._id + '/requests/' + request_id + '/messages/multi')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send([{ "text": "text1" }, { "text": "text2" }])
              .end(function (err, res) {
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                res.should.have.status(200);
                res.body.should.be.a('array');

                expect(res.body[0].sender).to.equal(savedUser._id.toString());
                expect(res.body[0].senderFullname).to.equal("Test Firstname Test lastname");
                expect(res.body[0].recipient).to.equal(request_id);
                expect(res.body[0].text).to.equal("text1");
                expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                expect(res.body[0].createdBy).to.equal(savedUser._id.toString());
                expect(res.body[0].status).to.equal(0);
                expect(res.body[0].channel_type).to.equal("group");
                expect(res.body[0].channel.name).to.equal("chat21");
                expect(res.body[1].sender).to.equal(savedUser._id.toString());
                expect(res.body[0].senderFullname).to.equal("Test Firstname Test lastname");
                expect(res.body[1].recipient).to.equal(request_id);
                expect(res.body[1].text).to.equal("text2");
                expect(res.body[1].id_project).to.equal(savedProject._id.toString());
                expect(res.body[1].createdBy).to.equal(savedUser._id.toString());
                expect(res.body[1].status).to.equal(0);
                expect(res.body[1].channel_type).to.equal("group");
                expect(res.body[1].channel.name).to.equal("chat21");

                done();
              });
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createMultiTextNoSenderNoText'
  it('createMultiTextNoSenderNoText', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createMultiText", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (log) { console.log("res.body", res.body); }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('first_text').eql('first_text');

            var request_id = res.body.request_id;
            if (log) { console.log("request_id", request_id); }

            chai.request(server)
              .post('/' + savedProject._id + '/requests/' + request_id + '/messages/multi')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send([{}, { "text": "text2" }])
              .end(function (err, res) {
                
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                
                res.should.have.status(200);
                done();
              });
          });
      });
    });
  });

  // mocha test/messageRoute.js  --grep 'createMultiTextWithSender'
  it('createMultiTextWithSender', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      var email2 = "test-message-createwithsender22-" + Date.now() + "@email.com";
      var pwd2 = "pwd";

      userService.signup(email2, pwd2, "Test Firstname22", "Test lastname22").then(function (savedUser2) {
        projectService.createAndReturnProjectAndProjectUser("message-createMultiText", savedUser._id).then(function (savedProjectAndPU) {

          var savedProject = savedProjectAndPU.project;

          var pu2 = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: savedProject._id,
            id_user: savedUser2._id,
            role: roleConstants.USER,
            user_available: true,
            createdBy: savedUser2._id,
            updatedBy: savedUser2._id,
          });
          pu2.save(function (err, savedProject_user2) {

            chai.request(server)
              .post('/' + savedProject._id + '/requests')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "first_text": "first_text" })
              .end(function (err, res) {

                if (log) { console.log("res.body", res.body); }
                res.should.have.status(200);
                res.body.should.be.a('object');

                res.body.should.have.property('first_text').eql('first_text');

                var request_id = res.body.request_id;
                if (log) { console.log("request_id", request_id); }

                chai.request(server)
                  .post('/' + savedProject._id + '/requests/' + request_id + '/messages/multi')
                  .auth(email, pwd)
                  .set('content-type', 'application/json')
                  .send([{ "sender": savedUser2._id, "text": "text1" }, { "sender": savedUser2._id, "text": "text2" }])
                  .end(function (err, res) {
                    
                    if (err) { console.error("err", err); }
                    if (log) { console.log("res.body", res.body); }
                    
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    expect(res.body[0].sender).to.equal(savedUser2._id.toString());
                    expect(res.body[0].senderFullname).to.equal("Test Firstname Test lastname");
                    expect(res.body[0].recipient).to.equal(request_id);
                    expect(res.body[0].text).to.equal("text1");
                    expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                    expect(res.body[0].createdBy).to.equal(savedUser2._id.toString());
                    expect(res.body[0].status).to.equal(0);
                    expect(res.body[0].channel_type).to.equal("group");
                    expect(res.body[0].channel.name).to.equal("chat21");
                    expect(res.body[1].sender).to.equal(savedUser2._id.toString());
                    expect(res.body[1].senderFullname).to.equal("Test Firstname Test lastname");
                    expect(res.body[1].recipient).to.equal(request_id);
                    expect(res.body[1].text).to.equal("text2");
                    expect(res.body[1].id_project).to.equal(savedProject._id.toString());
                    expect(res.body[1].createdBy).to.equal(savedUser2._id.toString());
                    expect(res.body[1].status).to.equal(0);
                    expect(res.body[1].channel_type).to.equal("group");
                    expect(res.body[1].channel.name).to.equal("chat21");

                    done();
                  });
              });
          });
        });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createMultiTextWithHardcodedSender'
  it('createMultiTextWithHardcodedSender', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createMultiTextWithHardcodedSender", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (log) { console.log("res.body", res.body); }
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('first_text').eql('first_text');

            var request_id = res.body.request_id;
            if (log) { console.log("request_id", request_id); }

            chai.request(server)
              .post('/' + savedProject._id + '/requests/' + request_id + '/messages/multi')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send([{ "sender": "andrealeo", "text": "text1" }, { "sender": "rocco", "text": "text2" }])
              .end(function (err, res) {
                
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                res.should.have.status(200);
                res.body.should.be.a('array');

                expect(res.body[0].sender).to.equal("andrealeo");
                expect(res.body[0].senderFullname).to.equal("Test Firstname Test lastname");
                expect(res.body[0].recipient).to.equal(request_id);
                expect(res.body[0].text).to.equal("text1");
                expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                expect(res.body[0].createdBy).to.equal("andrealeo");
                expect(res.body[0].status).to.equal(0);
                expect(res.body[0].channel_type).to.equal("group");
                expect(res.body[0].channel.name).to.equal("chat21");
                expect(res.body[1].sender).to.equal("rocco");
                expect(res.body[1].senderFullname).to.equal("Test Firstname Test lastname");
                expect(res.body[1].recipient).to.equal(request_id);
                expect(res.body[1].text).to.equal("text2");
                expect(res.body[1].id_project).to.equal(savedProject._id.toString());
                expect(res.body[1].createdBy).to.equal("rocco");
                expect(res.body[1].status).to.equal(0);
                expect(res.body[1].channel_type).to.equal("group");
                expect(res.body[1].channel.name).to.equal("chat21");

                done();
              });
          });
      });
    });
  });


  // mocha test/messageRoute.js  --grep 'createMultiTextWithHardcodedSenderAndSenderFullname'
  it('createMultiTextWithHardcodedSenderAndSenderFullname', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("message-createMultiTextWithHardcodedSenderAndSenderFullname", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        chai.request(server)
          .post('/' + savedProject._id + '/requests')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (log) { console.log("res.body", res.body); }
            res.should.have.status(200);
            res.body.should.be.a('object');

            res.body.should.have.property('first_text').eql('first_text');

            var request_id = res.body.request_id;
            if (log) { console.log("request_id", request_id); }

            chai.request(server)
              .post('/' + savedProject._id + '/requests/' + request_id + '/messages/multi')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send([{ "sender": "andrealeo", "senderFullname": "Andrea", "text": "text1" }, { "sender": "rocco", "senderFullname": "Rocco", "text": "text2" }])
              .end(function (err, res) {
                if (err) { console.error("err", err); }
                if (log) { console.log("res.body", res.body); }
                res.should.have.status(200);
                res.body.should.be.a('array');

                expect(res.body[0].sender).to.equal("andrealeo");
                expect(res.body[0].senderFullname).to.equal("Andrea");
                expect(res.body[0].recipient).to.equal(request_id);
                expect(res.body[0].text).to.equal("text1");
                expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                expect(res.body[0].createdBy).to.equal("andrealeo");
                expect(res.body[0].status).to.equal(0);
                expect(res.body[0].channel_type).to.equal("group");
                expect(res.body[0].channel.name).to.equal("chat21");
                expect(res.body[1].sender).to.equal("rocco");
                expect(res.body[1].senderFullname).to.equal("Rocco");
                expect(res.body[1].recipient).to.equal(request_id);
                expect(res.body[1].text).to.equal("text2");
                expect(res.body[1].id_project).to.equal(savedProject._id.toString());
                expect(res.body[1].createdBy).to.equal("rocco");
                expect(res.body[1].status).to.equal(0);
                expect(res.body[1].channel_type).to.equal("group");
                expect(res.body[1].channel.name).to.equal("chat21");

                done();
              });
          });
      });
    });
  });


  it('getall', function (done) {

    var email = "test-ssa-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      // projectService.create("message-create", savedUser._id).then(function(savedProject) {
      projectService.createAndReturnProjectAndProjectUser("message-create", savedUser._id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname-message-getall", "andrea.leo@-subscription-message-getall.it", savedProject._id).then(function (createdLead) {
          // requestService.createWithId("request_id-message-getall", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          requestService.createWithIdAndRequester("request_id-message-getall", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
            messageService.create(savedUser._id, "senderFullname", savedRequest.request_id, "hello",
              savedProject._id, savedUser._id).then(function (savedMessage) {
                expect(savedMessage.text).to.equal("hello");

                chai.request(server)
                  .get('/' + savedProject._id + '/requests/request_id-message-getall/messages')
                  .auth(email, pwd)
                  .set('content-type', 'application/json')
                  .end(function (err, res) {
                    if (err) { console.error("err", err); }
                    if (log) { console.log("res.body", res.body); }
                    res.should.have.status(200);
                    res.body.should.be.a('array');

                    expect(res.body[0].sender).to.equal(savedUser._id.toString());
                    expect(res.body[0].senderFullname).to.equal("senderFullname");
                    expect(res.body[0].recipient).to.equal("request_id-message-getall");
                    expect(res.body[0].text).to.equal("hello");
                    expect(res.body[0].id_project).to.equal(savedProject._id.toString());
                    expect(res.body[0].createdBy).to.equal(savedUser._id.toString());
                    expect(res.body[0].status).to.equal(200);
                    expect(res.body[0].channel_type).to.equal("group");
                    expect(res.body[0].channel.name).to.equal("chat21");
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

    // mocha test/messageRoute.js  --grep 'sendMessageSigninWithCustomTokenOk'
    it('sendMessageSigninWithCustomTokenOk', (done) => {

      var email = "test-sendmessagesigninwithcustomtokenok-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-sendMessageSigninWithCustomTokenOk", savedUser._id).then(function (savedProject) {

          chai.request(server)
            .post('/' + savedProject._id + '/keys/generate')
            .auth(email, pwd)
            .send()
            .end((err, res) => {
              if (err) { console.error("err", err); }
              if (log) { console.log("res.body", res.body); }
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.jwtSecret).to.not.equal(null);

              // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
              var externalUserId = "123";
              var externalUserObj = { _id: externalUserId, firstname: "andrea", lastname: "leo", email: "email2@email.com" };
              if (log) { console.log("externalUserObj", externalUserObj); }

              var signOptions = {
                subject: 'userexternal',
                audience: 'https://tiledesk.com/projects/' + savedProject._id,
              };

              var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
              if (log) { console.log("jwtToken", jwtToken); }

              chai.request(server)
                .post('/auth/signinWithCustomToken')
                .set('Authorization', 'JWT ' + jwtToken)
                //.send({ id_project: savedProject._id})
                .send()
                .end((err, res) => {
                  if (err) { console.error("err", err); }
                  if (log) { console.log("res.body", res.body); }
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.success).to.equal(true);
                  expect(res.body.user.email).to.equal("email2@email.com");
                  expect(res.body.user.firstname).to.equal("andrea");

                  expect(res.body.token).to.not.equal(undefined);
                  expect(res.body.token).to.equal('JWT ' + jwtToken);

                  chai.request(server)
                    .post('/' + savedProject._id + '/requests/sendMessageSigninWithCustomTokenOk/messages')
                    .set('Authorization', 'JWT ' + jwtToken)
                    .set('content-type', 'application/json')
                    .send({ "text": "text" })
                    .end(function (err, res) {
                      if (err) { console.error("err", err); }
                      if (log) { console.log("res.body", res.body); }
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
                      // expect(res.body.request.messages_count).to.equal(1);
                      expect(res.body.request.status).to.equal(200);
                      expect(res.body.request.snapshot.agents.length).to.equal(1);
                      expect(res.body.request.participants.length).to.equal(1);
                      expect(res.body.request.department).to.not.equal(null);
                      expect(res.body.request.lead).to.not.equal(null);

                      chai.request(server)
                        .get('/' + savedProject._id + '/requests/sendMessageSigninWithCustomTokenOk')
                        .auth(email, pwd)
                        .set('content-type', 'application/json')
                        .end(function (err, res) {
                          
                          if (err) { console.error("err", err); }
                          if (log) { console.log("res.body", res.body); }
                          
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


    // mocha test/messageRoute.js  --grep 'sendMessageSigninWithCustomTokenModified'
    it('sendMessageSigninWithCustomTokenModified', (done) => {

      var email = "test-sendmessagesigninwithcustomtokenModified-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-sendMessageSigninWithCustomTokenModified", savedUser._id).then(function (savedProject) {

          chai.request(server)
            .post('/' + savedProject._id + '/keys/generate')
            .auth(email, pwd)
            .send()
            .end((err, res) => {
              if (err) { console.error("err", err); }
              if (log) { console.log("res.body", res.body); }
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.jwtSecret).to.not.equal(null);

              // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
              var externalUserId = "123";
              var externalUserObj = { _id: externalUserId, firstname: "andrea", lastname: "leo", email: "email2@email.com" };

              if (log) { console.log("externalUserObj", externalUserObj); }

              var signOptions = {
                subject: 'userexternal',
                audience: 'https://tiledesk.com/projects/' + savedProject._id,
              };

              var secret = res.body.jwtSecret;
              var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);

              if (log) { console.log("jwtToken", jwtToken); }

              chai.request(server)
                .post('/auth/signinWithCustomToken')
                .set('Authorization', 'JWT ' + jwtToken)
                //.send({ id_project: savedProject._id})
                .send()
                .end((err, res) => {
                  
                  if (err) { console.error("err", err); }
                  if (log) { console.log("res.body", res.body); }
                  
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.success).to.equal(true);
                  expect(res.body.user.email).to.equal("email2@email.com");
                  expect(res.body.user.firstname).to.equal("andrea");
                  expect(res.body.token).to.not.equal(undefined);
                  expect(res.body.token).to.equal('JWT ' + jwtToken);

                  chai.request(server)
                    .post('/' + savedProject._id + '/requests/sendMessageSigninWithCustomTokenModified/messages')
                    .set('Authorization', 'JWT ' + jwtToken)
                    .set('content-type', 'application/json')
                    .send({ "text": "text" })
                    .end(function (err, res) {
                      if (err) { console.error("err", err); }
                      if (log) { console.log("res.body", res.body); }
                      res.should.have.status(200);
                      res.body.should.be.a('object');

                      expect(res.body.sender).to.equal(externalUserId);
                      // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                      // expect(res.body.senderFullname).to.equal("senderFullname");
                      expect(res.body.recipient).to.equal("sendMessageSigninWithCustomTokenModified");
                      expect(res.body.text).to.equal("text");
                      expect(res.body.id_project).to.equal(savedProject._id.toString());
                      expect(res.body.createdBy).to.equal(externalUserId);
                      expect(res.body.status).to.equal(0);
                      expect(res.body.request.request_id).to.equal("sendMessageSigninWithCustomTokenModified");
                      expect(res.body.request.first_text).to.equal("text");
                      expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                      expect(res.body.request.createdBy).to.equal(externalUserId);
                      // expect(res.body.request.messages_count).to.equal(1);
                      expect(res.body.request.status).to.equal(200);
                      expect(res.body.request.snapshot.agents.length).to.equal(1);
                      expect(res.body.request.participants.length).to.equal(1);
                      expect(res.body.request.department).to.not.equal(null);
                      expect(res.body.request.lead).to.not.equal(null);
                      expect(res.body.request.lead.email).to.equal("email2@email.com");

                      chai.request(server)
                        .get('/' + savedProject._id + '/requests/sendMessageSigninWithCustomTokenModified')
                        .auth(email, pwd)
                        .set('content-type', 'application/json')
                        .end(function (err, res) {
                          if (err) { console.error("err", err); }
                          if (log) { console.log("res.body", res.body); }
                          expect(res.body.lead.lead_id).to.equal(externalUserId);
                          expect(res.body.lead.email).to.equal("email2@email.com");
                          expect(res.body.lead.fullname).to.equal("andrea leo");
                          expect(res.body.requester.role).to.equal("user");
                          expect(res.body.requester.uuid_user).to.equal(externalUserId);
                          expect(res.body.requester.id_user).to.equal(undefined);

                          externalUserObj.email = "email33@email.com";

                          jwtToken = jwt.sign(externalUserObj, secret, signOptions);
                          if (log) { console.log("jwtToken2", jwtToken); }

                          chai.request(server)
                            .post('/auth/signinWithCustomToken')
                            .set('Authorization', 'JWT ' + jwtToken)
                            //.send({ id_project: savedProject._id})
                            .send()
                            .end((err, res) => {
                              if (err) { console.error("err", err); }
                              if (log) { console.log("res.body", res.body); }
                              res.should.have.status(200);
                              res.body.should.be.a('object');
                              expect(res.body.success).to.equal(true);
                              expect(res.body.user.email).to.equal("email33@email.com");
                              expect(res.body.user.firstname).to.equal("andrea");

                              chai.request(server)
                                .post('/' + savedProject._id + '/requests/sendMessageSigninWithCustomTokenModified33/messages')
                                .set('Authorization', 'JWT ' + jwtToken)
                                .set('content-type', 'application/json')
                                .send({ "text": "text" })
                                .end(function (err, res) {
                                  
                                  if (err) { console.error("err", err); }
                                  if (log) { console.log("res.body", res.body); }
                                  
                                  res.should.have.status(200);
                                  res.body.should.be.a('object');
                                  expect(res.body.request.lead.email).to.equal("email33@email.com");
                                  done()

                                });
                            });
                        });
                    });
                });
            });
        });
      });
    });

  });


  // mocha test/messageRoute.js  --grep 'sendMessageSigninAnonym'
  describe('/SendMessageSigninAnonym', () => {

    it('sendMessageSigninAnonym', (done) => {

      var email = "test-sendmessagesigninanonym-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-sendMessageSigninAnonym", savedUser._id).then(function (savedProject) {

          chai.request(server)
            .post('/auth/signinAnonymously')
            .send({ id_project: savedProject._id })
            .end((err, res) => {
              
              if (err) { console.error("err", err); }
              if (log) { console.log("res.body", res.body); }
              
              res.should.have.status(200);
              res.body.should.be.a('object');
              
              var userId = res.body.user._id;
              expect(res.body.success).to.equal(true);
              expect(res.body.user.email).to.equal(undefined);
              expect(res.body.user.firstname).to.contains("guest#");      // guest_here                                          
              expect(res.body.token).to.not.equal(undefined);

              var rid = 'support-group-' + Date.now();

              chai.request(server)
                .post('/' + savedProject._id + '/requests/' + rid + '/messages')
                .set('Authorization', res.body.token)
                .set('content-type', 'application/json')
                .send({ "text": "text" })
                .end(function (err, res) {
                  if (err) { console.error("err", err); }
                  if (log) { console.log("res.body", res.body); }
                  res.should.have.status(200);
                  res.body.should.be.a('object');

                  expect(res.body.sender).to.equal(userId);
                  // expect(res.body.sender).to.equal(savedProjectAndPU.project_user._id.toString());
                  // expect(res.body.senderFullname).to.equal("senderFullname");
                  expect(res.body.recipient).to.equal(rid);
                  expect(res.body.text).to.equal("text");
                  expect(res.body.id_project).to.equal(savedProject._id.toString());
                  expect(res.body.createdBy).to.equal(userId);
                  expect(res.body.status).to.equal(0);
                  expect(res.body.request.request_id).to.equal(rid);
                  expect(res.body.request.first_text).to.equal("text");
                  expect(res.body.request.id_project).to.equal(savedProject._id.toString());
                  expect(res.body.request.createdBy).to.equal(userId);
                  // expect(res.body.request.messages_count).to.equal(1);
                  expect(res.body.request.status).to.equal(200);
                  expect(res.body.request.snapshot.agents.length).to.equal(1);
                  expect(res.body.request.participants.length).to.equal(1);
                  expect(res.body.request.department).to.not.equal(null);
                  expect(res.body.request.lead).to.not.equal(null);

                  chai.request(server)
                    .get('/' + savedProject._id + '/requests/' + rid)
                    .auth(email, pwd)
                    .set('content-type', 'application/json')
                    .end(function (err, res) {
                      if (err) { console.error("err", err); }
                      if (log) { console.log("res.body", res.body); }
                      expect(res.body.lead.lead_id).to.equal(userId);
                      expect(res.body.lead.email).to.equal(undefined);
                      expect(res.body.lead.fullname).to.contains("guest#"); // guest_here
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


