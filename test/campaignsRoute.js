//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var Group = require('../models/group');
var userService = require('../services/userService');

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

describe('CampaignsRoute', () => {


  // mocha test/campaignsRoute.js  --grep 'directSimpleNoOut'

  it('directSimpleNoOut', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;
        var recipient = "5f8972c82db41c003473cb03";

        chai.request(server)
          .post('/' + savedProject._id + '/campaigns/direct')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "ciao", "recipient": recipient })
          .end(function (err, res) {
            //console.log("res",  res);
            console.log("res.body", res.body);
            res.should.have.status(200);
            res.body.should.be.a('object');



            expect(res.body.success).to.equal(true);


            done();
          });
      });
    });
  });






  // mocha test/campaignsRoute.js  --grep 'directSimple'

  it('directSimple', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;
        var recipient = "5f8972c82db41c003473cb03";

        chai.request(server)
          .post('/' + savedProject._id + '/campaigns/direct')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "text": "ciao", "recipient": recipient, returnobject: true })
          .end(function (err, res) {
            //console.log("res",  res);
            console.log("res.body", res.body);
            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.channel_type).to.equal("direct");
            expect(res.body.senderFullname).to.equal("Test Firstname Test lastname");
            expect(res.body.sender).to.equal(savedUser._id.toString());
            expect(res.body.recipient).to.equal(recipient);


            // expect(res.body.success).to.equal(true);


            done();
          });
      });
    });
  });




  // mocha test/campaignsRoute.js  --grep 'directGroupIdNoOut'

  it('directGroupIdNoOut', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        var userid = savedUser._id;

        var email2 = "test-message-create-" + Date.now() + "@email.com";
        userService.signup(email2, pwd, "Test Firstname", "Test lastname").then(function (savedUser2) {

          var newGroup = new Group({
            name: "group1",
            // members: ["userid1", "userid2"],
            members: [userid, savedUser2._id.toString()],
            trashed: false,
            id_project: savedProject._id,
            createdBy: userid,
            updatedBy: userid
          });
          newGroup.save(function (err, savedGroup) {
            console.log("savedGroup", savedGroup)


            chai.request(server)
              .post('/' + savedProject._id + '/campaigns/direct')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "ciao", "group_id": savedGroup._id.toString() })
              .end(function (err, res) {
                //console.log("res",  res);
                console.log("res.body", res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');


                expect(res.body.success).to.equal(true);


                done();
              });
          });
        });
      });
    });
  });




  // mocha test/campaignsRoute.js  --grep 'directGroupId2'

  it('directGroupId2', function (done) {

    var email = "test-message-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("directSimple", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        var userid = savedUser._id;

        var email2 = "test-message-create-" + Date.now() + "@email.com";
        userService.signup(email2, pwd, "Test Firstname", "Test lastname").then(function (savedUser2) {

          var newGroup = new Group({
            name: "group1",
            // members: ["userid1", "userid2"],
            members: [userid, savedUser2._id.toString()],
            trashed: false,
            id_project: savedProject._id,
            createdBy: userid,
            updatedBy: userid
          });
          newGroup.save(function (err, savedGroup) {
            console.log("savedGroup", savedGroup)


            chai.request(server)
              .post('/' + savedProject._id + '/campaigns/direct')
              .auth(email, pwd)
              .set('content-type', 'application/json')
              .send({ "text": "ciao", "group_id": savedGroup._id.toString(), returnobject: true })
              .end(function (err, res) {
                //console.log("res",  res);
                console.log("res.body", res.body);
                res.should.have.status(200);
                res.body.should.be.a('array');

                expect(res.body.length).to.equal(2);
                expect(res.body[0].recipient).to.equal(userid.toString());
                expect(res.body[1].recipient).to.equal(savedUser2._id.toString());
                // expect(res.body.success).to.equal(true);


                done();
              });
          });
        });
      });
    });
  });






});


