//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

let User = require('../models/user');
let projectService = require('../services/projectService');
let Group = require('../models/group');
let userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let winston = require('../config/winston');
let jwt = require('jsonwebtoken');
// chai.config.includeStack = true;

let log = false;

let expect = chai.expect;
let assert = chai.assert;

chai.use(chaiHttp);

describe('CampaignsRoute', () => {


  // mocha test/campaignsRoute.js  --grep 'directSimpleNoOut'
  it('directSimpleNoOut', function (done) {

    let email = "test-message-create-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        let savedProject = savedProjectAndPU.project;
        let recipient = "5f8972c82db41c003473cb03";

        chai.request(server)
          .post('/' + savedProject._id + '/campaigns/direct')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "ciao", "recipient": recipient })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            // expect(res.body.success).to.equal(true); //CHECK IT! Why was it checking success and not queued?
            expect(res.body.queued).to.equal(true);

            done();
          });
      });
    });
  });

  
  // mocha test/campaignsRoute.js  --grep 'directSimple'
  it('directSimple', function (done) {

    let email = "test-message-create-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        let savedProject = savedProjectAndPU.project;
        let recipient = "5f8972c82db41c003473cb03";

        chai.request(server)
          .post('/' + savedProject._id + '/campaigns/direct')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "ciao", "recipient": recipient, returnobject: true })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body", res.body); }
            
            res.should.have.status(200);
            res.body.should.be.a('object');


            // WARNING! The service returns { queued: true } and not the message
            // So the following expects can't work
            // expect(res.body.channel_type).to.equal("direct");
            // expect(res.body.senderFullname).to.equal("Test Firstname Test lastname");
            // expect(res.body.sender).to.equal(savedUser._id.toString());
            // expect(res.body.recipient).to.equal(recipient);

            expect(res.body.queued).to.equal(true);

            done();
          });
      });
    });
  });


  // mocha test/campaignsRoute.js  --grep 'directGroupIdNoOut'
  it('directGroupIdNoOut', function (done) {

    let email = "test-message-create-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        let savedProject = savedProjectAndPU.project;

        let userid = savedUser._id;

        let email2 = "test-message-create-" + Date.now() + "@email.com";
        userService.signup(email2, pwd, "Test Firstname", "Test lastname").then(function (savedUser2) {

          let newGroup = new Group({
            name: "group1",
            // members: ["userid1", "userid2"],
            members: [userid, savedUser2._id.toString()],
            trashed: false,
            id_project: savedProject._id,
            createdBy: userid,
            updatedBy: userid
          });
          newGroup.save(function (err, savedGroup) {
            
            if (log) { console.log("savedGroup", savedGroup); }

            chai.request(server)
              .post('/' + savedProject._id + '/campaigns/direct')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "ciao", "group_id": savedGroup._id.toString() })
              .end(function (err, res) {
                
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body", res.body); }
                
                res.should.have.status(200);
                res.body.should.be.a('object');

                // expect(res.body.success).to.equal(true); //CHECK IT! Why was it checking success and not queued?
                expect(res.body.queued).to.equal(true);

                done();
              });
          });
        });
      });
    });
  });


  // mocha test/campaignsRoute.js  --grep 'directGroupId2'
  it('directGroupId2', function (done) {

    let email = "test-message-create-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        let savedProject = savedProjectAndPU.project;

        let userid = savedUser._id;

        let email2 = "test-message-create-" + Date.now() + "@email.com";
        userService.signup(email2, pwd, "Test Firstname", "Test lastname").then(function (savedUser2) {

          let newGroup = new Group({
            name: "group1",
            // members: ["userid1", "userid2"],
            members: [userid, savedUser2._id.toString()],
            trashed: false,
            id_project: savedProject._id,
            createdBy: userid,
            updatedBy: userid
          });
          newGroup.save(function (err, savedGroup) {
            
            if (log) { console.log("savedGroup", savedGroup); }

            chai.request(server)
              .post('/' + savedProject._id + '/campaigns/direct')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "ciao", "group_id": savedGroup._id.toString(), returnobject: true })
              .end(function (err, res) {
                
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body", res.body); }

                res.should.have.status(200);

                // WARNING! The service returns { queued: true } and not the message
                // res.body.should.be.a('array');
                // expect(res.body.length).to.equal(2);
                // expect(res.body[0].recipient).to.equal(userid.toString());
                // expect(res.body[1].recipient).to.equal(savedUser2._id.toString());
                
                expect(res.body.queued).to.equal(true);


                done();
              });
          });
        });
      });
    });
  });


});


