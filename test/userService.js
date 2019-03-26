//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// require('./controllers/todo.controller.test.js');
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
// var admin = require('../utils/firebaseConnector');


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
        winston.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });



  // it('getUser', function (done) {
  //   // admin.auth().getUser('5aaa99024c3b110014b478f0')
  //   // admin.auth().getUser('5bf3cbbc20cb5d0015702910')
  //   admin.auth().getUser('5b55e806c93dde00143163dd_12345678910')
    
    
    
  //   .then(function(userRecord) {
  //     // See the UserRecord reference doc for the contents of userRecord.
  //     console.log("Successfully fetched user data:", userRecord.toJSON());
  //     done();
  //   })
  //   .catch(function(error) {
  //     console.log("Error fetching user data:", error);
  //   });
  // });

});


