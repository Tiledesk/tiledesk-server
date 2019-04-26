//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

require('dotenv').config();

// require('./controllers/todo.controller.test.js');
var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var Request = require('../models/request');

var mongoose = require('mongoose');
var winston = require('../config/winston');
var MessageConstants = require("../models/messageConstants");

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var userService = require('../services/userService');
var projectService = require('../services/projectService');
var leadService = require('../services/leadService');
var requestService = require('../services/requestService');
var messageService = require('../services/messageService');

const chat21Event = require('../channels/chat21/chat21Event');
const messageEvent = require('../event/messageEvent');

var chat21Config = require('../channels/chat21/chat21Config');

var adminToken = process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken 
winston.info('Test Chat21Handler adminToken: ' + adminToken);

var chat21 = require('../channels/chat21/chat21Client');

var chat21Handler = require('../channels/chat21/chat21Handler');
chat21Handler.listen();

describe('Chat21Handler', function () {
  
  before(function() {
    // runs before all tests in this block

  

  });

 

  it('creategroup', function (done) {






    chat21.auth.setAdminToken(adminToken);
    winston.info("create group");
    chat21.groups.create('test1', ['12345'], {attr:'a1'}).then(function(data){
            winston.info("group created: " + data);
                         done();              

        }).catch(function(err) {
            winston.error("Error creating chat21 group ", err);
        });

});




  it('createRequest', function (done) {
  

    var email = "test-createRequest-chat21handler" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("createWithId", savedUser._id).then(function(savedProject) {
      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {

       
        chat21Event.on('group.create', function(data){
          winston.info("group created", data);
          done();
        });

      // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
       requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
          expect(savedRequest.request_id).to.equal("request_id1");                       

             messageService.create(savedUser._id, "test sender", savedRequest.request_id, "hello",
                                        savedProject._id, savedUser._id).then(function(savedMessage){
                                            expect(savedMessage.text).to.equal("hello");     


                                            


                                        });

        });
    });
  });
  });

  }).timeout(20000);



  it('firstMessage', function (done) {



    var email = "test-createRequest-chat21handler" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("createWithId", savedUser._id).then(function(savedProject) {
      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
            
      // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
       requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
          expect(savedRequest.request_id).to.equal("request_id1");                       


          // messageEvent.on('message.create.first',function(message) {
          //   expect(message.text).to.equal("hello");   
          //     done();
          // });
          chat21Event.on('firestore.first_message', function(firestoreUpdate){
                    winston.debug("firestore.first_message created", firestoreUpdate);
                    expect(firestoreUpdate.first_message.attributes).to.not.equal(null);                                               
                    done();
                  });



            //  create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes)
             messageService.create(savedUser._id, "test sender", savedRequest.request_id, "hello",
                                        savedProject._id, savedUser._id,MessageConstants.CHAT_MESSAGE_STATUS.SENDING, {attr1:'attr1'}).then(function(savedMessage){
                                            expect(savedMessage.text).to.equal("hello");                                               

            });

        });
    });
  });
  });

  }).timeout(20000);


});