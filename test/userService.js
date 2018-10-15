//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// require('./controllers/todo.controller.test.js');
var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var userService = require('../services/userService');


describe('UserService()', function () {



  it('signup', function (done) {

    var email = "test-signup-" + Date.now() + "@email.com";

    userService.signup( email ,"pwd", "Test Firstname", "Test lastname").then(function(savedUser) {
        console.log("savedUser resolve");
         expect(savedUser.email).to.equal(email);
         expect(savedUser.firstname).to.equal( "Test Firstname");
         expect(savedUser.lastname).to.equal("Test lastname");
        done();
    }).catch(function(err) {
        console.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });
});


