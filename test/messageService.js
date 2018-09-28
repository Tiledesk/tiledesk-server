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

var requestservice = require('../services/requestService');
var messageservice = require('../services/messageService');
var projectService = require('../services/projectService');

var Request = require("../models/request");


describe('MessageService()', function () {
  it('createMessage', function (done) {
    // this.timeout(10000);

      projectService.create("test1", "5badfe5d553d1844ad654072").then(function(savedProject) {
      messageservice.create("5badfe5d553d1844ad654072", "test sender", "testrecipient-createMessage", "test recipient fullname", "hello",
          savedProject._id, "5badfe5d553d1844ad654072").then(function(savedMessage){
            requestservice.incrementMessagesCountByRequestId(savedMessage.recipient, savedProject._id).then(function() {    
          console.log("test resolve");

          expect(savedMessage.text).to.equal("hello");
          done();

        }).catch(function(err){
          assert.isNotOk(err,'Promise error');
          done();
        });

      });
    });
  });
});



describe('MessageService()', function () {
  it('createMessageAndUpdateTwoMessagesCount', function (done) {
    // this.timeout(10000);

      projectService.create("test1", "5badfe5d553d1844ad654072").then(function(savedProject) {
        requestservice.createWithId("request_id-createTwoMessage", "requester_id1", "requester_fullname1", savedProject._id, "first_text").then(function(savedRequest) {
         messageservice.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "test recipient fullname", "hello",
            savedProject._id, "5badfe5d553d1844ad654072").then(function(savedMessage){
              Promise.all([requestservice.incrementMessagesCountByRequestId(savedRequest.request_id, savedProject._id),
                requestservice.incrementMessagesCountByRequestId(savedRequest.request_id, savedProject._id)]).then(function(savedMessage) {                
                  Request.findOne({"request_id": "request_id-createTwoMessage"}).exec().then(function(req) {
                    console.log("test resolve", req);

                    expect(req.messages_count).to.equal(2);
                    done();                         
                  }).catch(function(err){
                    console.error("test reject", err);
                    assert.isNotOk(err,'Promise error');
                    done();
                  });
              });
          });
        });
    });
  });
});

