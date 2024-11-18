//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
// var Request = require('../models/request');
// var Requester = require('../models/requester');

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


describe('UserService()', function () {


  // it('signup', function (done) {
  // const myURL =
  // new URL('https://user:pass@sub.example.com:8080/p/a?query=string#hash');
  // console.log(myURL.pathname);
  // console.log(myURL.pathname.split("/")[1]);
  // });

  it('signup', function (done) {

    var email = "test-userservice-signup-" + Date.now() + "@email.com";

    userService.signup(email, "pwd", "Test Firstname", "Test lastname").then(function (savedUser) {

      if (log) { console.log("savedUser resolve"); }
      expect(savedUser.email).to.equal(email);
      expect(savedUser.firstname).to.equal("Test Firstname");
      expect(savedUser.lastname).to.equal("Test lastname");
      done();
    }).catch(function (err) {
      winston.error("test reject", err);
      assert.isNotOk(err, 'Promise error');
      done();
    });
  });


  it('signupUpperCase', function (done) {

    var now = Date.now();
    var email = "test-UserService-signup-" + now + "@email.com";

    userService.signup(email, "pwd", "Test Firstname", "Test lastname").then(function (savedUser) {
      if (log) { console.log("savedUser resolve"); }
      expect(savedUser.email).to.equal("test-userservice-signup-" + now + "@email.com");
      expect(savedUser.firstname).to.equal("Test Firstname");
      expect(savedUser.lastname).to.equal("Test lastname");
      done();
    }).catch(function (err) {
      console.error("test reject", err);
      assert.isNotOk(err, 'Promise error');
      done();
    });
  });


  // it('discriminator', function (done) {

  //       var email = "test-signup-" + Date.now() + "@email.com";
  //       userService.signup( email ,"pwd", "Test Firstname", "Test lastname").then(function(savedUser) {

  //       // var r = new Request({requester_id: 'test',first_text:'ft',id_project:'123', createdBy: '123', requester: new Requester({ref: savedUser, type:'user'})});
  //       // var r = new Request({requester_id: 'test',first_text:'ft',id_project:'123', createdBy: '123', requester:savedUser._id});
  //       var r = new Request({requester_id: 'test',first_text:'ft',id_project:'123', createdBy: '123', requester:savedUser._id, requesterModel:'user'});
  //       r.save(function(err, request) {
  //         winston.error("test reject", err);
  //         winston.info("request", request.toObject());
  //         Request.findById(request._id).populate('requester').exec(function(err, req1){
  //           winston.info("err", err);
  //           winston.info("req1", req1.toObject());
  //           done();
  //         });

  //       });
  //   });
  // });


  // it('discriminator', function (done) {

  //   // var options = {discriminatorKey: 'kind'};
  //   var options = {};

  //   var eventSchema = new mongoose.Schema({time: Date}, options);
  //   var Event = mongoose.model('Event', eventSchema);

  //   // ClickedLinkEvent is a special type of Event that has
  //   // a URL.
  //   var ClickedLinkEvent = Event.discriminator('ClickedLink',
  //     new mongoose.Schema({url: String}, options));

  //   // When you create a generic event, it can't have a URL field...
  //   var genericEvent = new Event({time: Date.now(), url: 'google.com'});
  //   assert.ok(!genericEvent.url);

  //   // But a ClickedLinkEvent can
  //   var clickedEvent =
  //     new ClickedLinkEvent({time: Date.now(), url: 'google.com'});
  //   assert.ok(clickedEvent.url);

  //   clickedEvent.save(function(err, saved) {
  //     console.log("saved", err);

  //   });


  //   Event.findById('5cc80986176f565ffc210ea6', function(err, getted){
  //     console.log("getted", getted.toObject());
  //     console.log("instanceof", getted.toObject() instanceof ClickedLinkEvent);
  //     console.log("instanceof", getted.toObject() instanceof Event);
  //     if (getted.toObject() instanceof ClickedLinkEvent) {
  //       done();
  //     } else {
  //       assert.ok(false);
  //     }

  //   });



  // });





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


