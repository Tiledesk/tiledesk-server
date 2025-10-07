//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

require('dotenv').config();

let expect = require('chai').expect;

let assert = require('chai').assert;
let config = require('../../../config/database');
let Request = require('../../../models/request');

let mongoose = require('mongoose');
let winston = require('../../../config/winston');
let MessageConstants = require("../../../models/messageConstants");
require('../../../services/mongoose-cache-fn')(mongoose);

// let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

let userService = require('../../../services/userService');
let projectService = require('../../../services/projectService');
let leadService = require('../../../services/leadService');
let requestService = require('../../../services/requestService');
let messageService = require('../../../services/messageService');

const chat21Event = require('../chat21Event');
const messageEvent = require('../../../event/messageEvent');

let chat21Config = require('../chat21Config');

let adminToken = process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken 
winston.info('Test Chat21Handler adminToken: ' + adminToken);

let chat21 = require('../chat21Client');

let chat21Handler = require('../chat21Handler');
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



// mocha channels/chat21/test-int/chat21Handler.js   --grep 'createRequest'
  it('createRequest', function (done) {
  

    let email = "test-createRequest-chat21handler" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("createWithId", savedUser._id).then(function(savedProject) {
      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {

       
        let counter = 0;
        chat21Event.on('group.create', function(data){
          counter++;
          winston.info("group created", data);

          // if (data){
            if (counter==1) {
              done();
            }
            
          // }
         
        });

      // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
       requestService.createWithId("request_id-chat21-createRequest", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
          expect(savedRequest.request_id).to.equal("request_id-chat21-createRequest");                       

             messageService.create(savedUser._id, "test sender", savedRequest.request_id, "hello",
                                        savedProject._id, savedUser._id).then(function(savedMessage){
                                            expect(savedMessage.text).to.equal("hello");     


                                            


                                        });

        });
    });
  });
  });

  }).timeout(20000);



  // it('firstMessage', function (done) {



  //   let email = "test-createRequest-chat21handler" + Date.now() + "@email.com";
  //   let pwd = "pwd";

  //   userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
  //    projectService.create("createWithId", savedUser._id).then(function(savedProject) {
  //     leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
            
  //     // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
  //      requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
  //         winston.debug("resolve", savedRequest.toObject());
  //         expect(savedRequest.request_id).to.equal("request_id1");                       


  //         // messageEvent.on('message.create.first',function(message) {
  //         //   expect(message.text).to.equal("hello");   
  //         //     done();
  //         // });
  //         chat21Event.on('firestore.first_message', function(firestoreUpdate){
  //                   winston.info("firestore.first_message created", firestoreUpdate);
  //                   winston.info("savedUser._id", savedUser._id);
  //                 if (firestoreUpdate.first_message.sender === savedUser._id.toString()) {
  //                   expect(firestoreUpdate.first_message.attributes).to.not.equal(null);                                               
  //                   done();
  //                 }
                   
  //                 });



  //           //  create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes)
  //            messageService.create(savedUser._id, "test sender", savedRequest.request_id, "first_text",
  //                                       savedProject._id, savedUser._id,MessageConstants.CHAT_MESSAGE_STATUS.SENDING, {attr1:'attr1'}).then(function(savedMessage){
  //                                           expect(savedMessage.text).to.equal("hello");                                               

  //           });

  //       });
  //   });
  // });
  // });

  // }).timeout(20000);


});