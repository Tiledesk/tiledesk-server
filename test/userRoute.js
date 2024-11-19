//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);

var expect = require('chai').expect;
var assert = require('chai').assert;
var config = require('../config/database');

var mongoose = require('mongoose');
var winston = require('../config/winston');

let log = false;

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var userService = require('../services/userService');
const projectService = require('../services/projectService');


describe('UserService()', function () {

  it('loginemail', function (done) {
    var now = Date.now();
    var email = "test-UserService-signup-" + now + "@email.com";
    var pwd = "pwd";

    userService.signup(email , pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      expect(savedUser.email).to.equal("test-userservice-signup-" + now + "@email.com");
      expect(savedUser.firstname).to.equal( "Test Firstname");
      expect(savedUser.lastname).to.equal("Test lastname");
      projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        chai.request(server)
          .post('/' + savedProject._id + '/faq_kb')
          .auth(email, pwd)
          .send({ "name": "testbot", type: "internal", template: "example", language: 'en' })
          .end((err, res) => {
  
            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }
  
            res.should.have.status(200);

            let bot_id = res.body._id;
  
            chai.request(server)
                .post('/users/loginemail')
                .auth(email, pwd)
                .send({ "id_project": savedProject._id, bot_id: bot_id })
                .end((err, res) => {
      
                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("res.body: ", res.body); }

                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.success).to.equal(true);
                  expect(res.body.message).to.equal("Sending email...");

                  done();
                })
          })
      })





    }).catch(function(err) {
      winston.error("test reject", err);
      assert.isNotOk(err,'Promise error');
      done();
    });

  })


});


