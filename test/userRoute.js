//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');

chai.use(chaiHttp);

var expect = require('chai').expect;
var assert = require('chai').assert;
var config = require('../config/database');

var mongoose = require('mongoose');
var winston = require('../config/winston');

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var userService = require('../services/userService');


describe('UserService()', function () {

  it('loginemail', (done) => {
    var now = Date.now();
    var email = "test-UserService-signup-" + now + "@email.com";
    var pwd = "pwd";

    userService.signup(email , pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      expect(savedUser.email).to.equal("test-userservice-signup-" + now + "@email.com");
      expect(savedUser.firstname).to.equal( "Test Firstname");
      expect(savedUser.lastname).to.equal("Test lastname");

      chai.request(server)
          .post('/users/loginemail')
          .auth(email, pwd)
          .send({ "id_project": "123456789" })
          .end((err, res) => {
            console.log("res.body: ", res.body);
            console.log("res.status: ", res.status);
            
            done();
          })


    }).catch(function(err) {
      winston.error("test reject", err);
      assert.isNotOk(err,'Promise error');
      done();
    });

  })


});


