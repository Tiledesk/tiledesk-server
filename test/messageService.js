//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var chai = require("chai");
chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;
let should = chai.should();
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);
require('../services/mongoose-cache-fn')(mongoose);

var requestService = require('../services/requestService');
var messageService = require('../services/messageService');
var projectService = require('../services/projectService');

var Request = require("../models/request");

var { QuoteManager } = require('../services/QuoteManager');

// CONNECT REDIS - CHECK IT
const { TdCache } = require('../utils/TdCache');
let tdCache = new TdCache({
  host: '127.0.0.1',
  port: '6379'
});

tdCache.connect();

describe('messageService', function () {

  var userid = "5badfe5d553d1844ad654072";

  it('createMessageQuote', function (done) {
    // this.timeout(10000);
    let qm = new QuoteManager({ tdCache: tdCache });
    qm.start();

    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language) {

      messageService.create(userid, "test sender", "testrecipient-createMessage", "hello",
        savedProject._id, userid, undefined, { a1: "a1" }, undefined, undefined, "it").then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("hello");
          expect(savedMessage.sender).to.equal(userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessage");
          expect(savedMessage.language).to.equal("it");
          expect(savedMessage.attributes.a1).to.equal("a1");
          expect(savedMessage.channel_type).to.equal("group");
          expect(savedMessage.channel.name).to.equal("chat21");


          setTimeout(async () => {
            let obj = { createdAt: new Date() }

            let quotes = await qm.getAllQuotes(savedProject, obj);
            quotes.messages.quote.should.be.a('number');
            expect(quotes.messages.quote).to.equal(1);
            
            done();
            
          }, 1000);


        }).catch(function (err) {
          assert.isNotOk(err, 'Promise error');
          done();
        });

    });
  }).timeout(10000);

  it('createMessage', function (done) {
    // this.timeout(10000);

    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language) {

      let quoteManager = new QuoteManager({ project: savedProject, tdCache: tdCache })
      quoteManager.start();

      messageService.create(userid, "test sender", "testrecipient-createMessage", "hello",
        savedProject._id, userid, undefined, { a1: "a1" }, undefined, undefined, "it").then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("hello");
          expect(savedMessage.sender).to.equal(userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessage");
          expect(savedMessage.language).to.equal("it");
          expect(savedMessage.attributes.a1).to.equal("a1");
          expect(savedMessage.channel_type).to.equal("group");
          expect(savedMessage.channel.name).to.equal("chat21");
          done();

        }).catch(function (err) {
          assert.isNotOk(err, 'Promise error');
          done();
        });

    });
  });




  it('createMessageAndUpdateTwoMessagesCount', function (done) {
    // this.timeout(10000);  
    // projectService.create("test1", userid).then(function(savedProject) {
    projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;

      // attento reqid
      // requestService.createWithId("request_id-createTwoMessage", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
      requestService.createWithIdAndRequester("request_id-createTwoMessage", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {

        messageService.create(userid, "test sender", savedRequest.request_id, "hello",
          savedProject._id, userid).then(function (savedMessage) {

            // Promise.all([requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedProject._id),
            //   requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedProject._id)]).then(function(savedMessage) {

            Request.findOne({ "request_id": "request_id-createTwoMessage", "id_project": savedProject._id }).exec().then(function (req) {
              console.log("test resolve", req);

              // expect(req.messages_count).to.equal(2);

              done();
            }).catch(function (err) {
              winston.error("test reject", err);
              assert.isNotOk(err, 'Promise error');
              done();
            });
            // });
          });
      });
    });


  });








  // mocha test/messageService.js  --grep 'createMessageMultiLanguageSimple'
  it('createMessageMultiLanguageSimple', function (done) {
    // this.timeout(10000);


    var messageTransformerInterceptor = require('../pubmodules/messageTransformer/messageTransformerInterceptor');
    console.log("messageTransformerInterceptor", messageTransformerInterceptor);
    messageTransformerInterceptor.listen();



    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
      messageService.create(userid, "test sender", "testrecipient-createMessage", "${LABEL_PLACEHOLDER}",
        savedProject._id, userid).then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("type your message..");
          expect(savedMessage.sender).to.equal(userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessage");
          done();

        }).catch(function (err) {
          assert.isNotOk(err, 'Promise error');
          done();
        });

    });
  });



  it('createMessageMultiLanguageNOTFound', function (done) {
    // this.timeout(10000);


    var messageTransformerInterceptor = require('../pubmodules/messageTransformer/messageTransformerInterceptor');
    console.log("messageTransformerInterceptor", messageTransformerInterceptor);
    messageTransformerInterceptor.listen();



    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy) {
      messageService.create(userid, "test sender", "testrecipient-createMessage", "${NOTFOUND_LABEL}",
        savedProject._id, userid).then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("${NOTFOUND_LABEL}");
          expect(savedMessage.sender).to.equal(userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessage");
          done();

        }).catch(function (err) {
          assert.isNotOk(err, 'Promise error');
          done();
        });

    });
  });





  it('createMessageMultiLanguageNOLanguage', function (done) {
    // this.timeout(10000);


    var messageTransformerInterceptor = require('../pubmodules/messageTransformer/messageTransformerInterceptor');
    console.log("messageTransformerInterceptor", messageTransformerInterceptor);
    messageTransformerInterceptor.listen();



    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language) {
      messageService.create(userid, "test sender", "testrecipient-createMessage", "${LABEL_PLACEHOLDER}",
        savedProject._id, userid, undefined, undefined, undefined, undefined, "XXXX").then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("type your message.."); //EN default
          expect(savedMessage.sender).to.equal(userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessage");
          done();

        }).catch(function (err) {
          assert.isNotOk(err, 'Promise error');
          done();
        });

    });
  });







  // mocha test/messageService.js  --grep 'createMessageMicroLanguageWithAttribute'

  it('createMessageMicroLanguageWithAttribute', function (done) {
    // this.timeout(10000);


    var microLanguageTransformerInterceptor = require('../pubmodules/messageTransformer/microLanguageTransformerInterceptor');
    console.log("microLanguageTransformerInterceptor", microLanguageTransformerInterceptor);
    microLanguageTransformerInterceptor.listen();



    projectService.create("test1", userid).then(function (savedProject) {
      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
      messageService.create("bot_" + userid, "test sender", "testrecipient-createMessageMicroLanguageWithAttribute", "ciao\n* Button1",
        savedProject._id, userid, undefined, { microlanguage: true }).then(function (savedMessage) {
          winston.debug("resolve savedMessage", savedMessage.toObject());

          expect(savedMessage.text).to.equal("ciao");
          expect(savedMessage.type).to.equal("text");
          expect(savedMessage.attributes._raw_message).to.equal("ciao\n* Button1", "attachment");
          expect(savedMessage.attributes.attachment.type).to.equal("template");
          expect(savedMessage.attributes.attachment.buttons[0].value).to.equal("Button1");
          expect(savedMessage.sender).to.equal("bot_" + userid);
          expect(savedMessage.senderFullname).to.equal("test sender");
          expect(savedMessage.recipient).to.equal("testrecipient-createMessageMicroLanguageWithAttribute");
          done();

        })
    });
  });



});
