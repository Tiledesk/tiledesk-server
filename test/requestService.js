//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
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
var projectUserService = require('../services/projectUserService');
var departmentService = require('../services/departmentService');
var leadService = require('../services/leadService');
var userService = require('../services/userService');

var Request = require("../models/request");
var Group = require("../models/group");
var Project_user = require("../models/project_user");
// var Tag = require('../models/tag');
var requestEvent = require('../event/requestEvent');

var { QuoteManager } = require('../services/QuoteManager');
const projectMock = require('./mock/projectMock');

// CONNECT REDIS - CHECK IT
const { TdCache } = require('../utils/TdCache');
let tdCache = new TdCache({
    host: '127.0.0.1',
    port: '6379'
  });

tdCache.connect();

// var redis = require('redis')
// var redis_client;

// connectRedis();

// function connectRedis() {
//   console.log(">>> connectRedis for test")
//   redis_client = redis.createClient({
//     host: "127.0.0.1",
//     port: 6379,
//   });

//   redis_client.on('error', err => {
//     winston.info('(wab) Connect Redis Error ' + err);
//   })

//   redis_client.on('ready', () => {
//     winston.info("(wab) Redis ready!")
//   })

// }

describe('RequestService', function () {

  // var userid = "5badfe5d553d1844ad654072";

  // mocha test/requestService.js  --grep 'createObjSimple'
  it('createObjSimpleQuote', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";


    let qm = new QuoteManager({ tdCache: tdCache });
    qm.start();

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser.id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_id-createObjSimple-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };
          // attributes: { sourcePage: "https://widget-pre.tiledesk.com/v2/index.html?tiledesk_projectid=5ce3d1ceb25ad30017279999&td_draft=true" } // for quote test

          requestService.create(request).then(async function (savedRequest) {
            winston.verbose("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id-createObjSimple-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.department).to.not.equal(null);
            expect(savedRequest.ticket_id).to.equal(1);
            expect(savedRequest.status).to.equal(200);
            expect(savedRequest.participants).to.have.lengthOf(1);
            expect(savedRequest.participants).to.contains(userid);
            expect(savedRequest.participantsAgents).to.contains(userid);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);

            expect(savedRequest.participants[0].toString()).to.equal(userid);
            expect(savedRequest.participantsAgents[0].toString()).to.equal(userid);
            expect(savedRequest.assigned_at).to.not.equal(null);

            expect(savedRequest.snapshot.department.name).to.not.equal(null);
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.snapshot.lead.fullname).to.equal("leadfullname");
            expect(savedRequest.snapshot.requester.role).to.equal("owner");
            expect(savedRequest.snapshot.requester.isAuthenticated).to.equal(true);
            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.id_project).to.equal(savedProject._id.toString());
            
            //expect(savedRequest.attributes.sourcePage).to.equal("https://widget-pre.tiledesk.com/v2/index.html?tiledesk_projectid=5ce3d1ceb25ad30017279999&td_draft=true")


            setTimeout(async () => {
              let obj = { createdAt: new Date() }
  
              let quotes = await qm.getAllQuotes(savedProject, obj);
              console.log("quotes: ", quotes);
              // quotes.requests.quote.should.be.a('string');
              // expect(quotes.requests.quote).to.equal('1');
              
              done();
            }, 200);


          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            // done();
          });
        });
      });
    });
  }).timeout(10000);

  it('createObjSimple', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";


    let qm = new QuoteManager({ tdCache: tdCache });
    qm.start();

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser.id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_id-createObjSimple-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };

          requestService.create(request).then(function (savedRequest) {
            winston.verbose("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id-createObjSimple-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.department).to.not.equal(null);
            expect(savedRequest.ticket_id).to.equal(1);
            expect(savedRequest.status).to.equal(200);
            expect(savedRequest.participants).to.have.lengthOf(1);
            expect(savedRequest.participants).to.contains(userid);
            expect(savedRequest.participantsAgents).to.contains(userid);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            console.log("savedRequest.participants[0]", savedRequest.participants[0]);
            expect(savedRequest.participants[0].toString()).to.equal(userid);
            expect(savedRequest.participantsAgents[0].toString()).to.equal(userid);
            expect(savedRequest.assigned_at).to.not.equal(null);
            console.log("savedRequest.participants1");

            expect(savedRequest.snapshot.department.name).to.not.equal(null);
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.snapshot.lead.fullname).to.equal("leadfullname");
            expect(savedRequest.snapshot.requester.role).to.equal("owner");
            expect(savedRequest.snapshot.requester.isAuthenticated).to.equal(true);
            // expect(savedRequest.snapshot.requester.role).to.equal("owner");
            console.log("savedRequest.participants2");

            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

            // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
            // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

            expect(savedRequest.id_project).to.equal(savedProject._id.toString());
            console.log("savedRequest.participants3");
            // aiuto
            // expect(savedRequest.department).to.equal("requester_id1");

            requestService.create(request).then(function (savedRequest) {
              // assert.isNotOk('No duplicate check index');
              console.log("no index check ???");
              // done();
            }).catch(function (err) {
              console.log("ok duplicate check index ", err);
              done();
            });
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            // done();
          });
        });
      });
    });
  });




  // mocha test/requestService.js  --grep 'createObjSimpleUpdateLeadUpdateSnapshot'

  it('createObjSimpleUpdateLeadUpdateSnapshot', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_idcreateObjSimpleUpdateLeadUpdateSnapshot-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };

          requestService.create(request).then(function (savedRequest) {
            winston.info("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_idcreateObjSimpleUpdateLeadUpdateSnapshot-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.department).to.not.equal(null);
            expect(savedRequest.status).to.equal(200);
            expect(savedRequest.participants).to.have.lengthOf(1);
            expect(savedRequest.participants).to.contains(userid);
            expect(savedRequest.participantsAgents).to.contains(userid);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            console.log("savedRequest.participants[0]", savedRequest.participants[0]);
            expect(savedRequest.participants[0].toString()).to.equal(userid);
            expect(savedRequest.participantsAgents[0].toString()).to.equal(userid);
            expect(savedRequest.assigned_at).to.not.equal(null);

            expect(savedRequest.snapshot.department.name).to.not.equal(null);
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.snapshot.lead.fullname).to.equal("leadfullname");
            expect(savedRequest.snapshot.requester.role).to.equal("owner");
            expect(savedRequest.snapshot.requester.isAuthenticated).to.equal(true);
            // expect(savedRequest.snapshot.requester.role).to.equal("owner");

            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

            // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
            // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

            expect(savedRequest.id_project).to.equal(savedProject._id.toString());


            leadService.updateWitId(createdLead.lead_id, "fullname2", "email2@email2.com", savedProject._id).then(function (updatedLead) {

              expect(updatedLead.fullname).to.equal("fullname2");
              expect(updatedLead.email).to.equal("email2@email2.com");
              expect(updatedLead.id_project).to.equal(savedProject._id.toString());
              expect(updatedLead.lead_id).to.not.equal(createdLead.id);
              console.log("updatedLead", updatedLead);

              requestEvent.on('request.update.snapshot.lead', function (data) {

                Request.findById(savedRequest._id, function (err, request) {
                  console.log("err", err);
                  expect(request.request_id).to.equal("request_idcreateObjSimpleUpdateLeadUpdateSnapshot-" + now);
                  expect(request.snapshot.lead.fullname).to.equal("fullname2");
                  done();
                });

              });



            });


          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });





  // mocha test/requestService.js  --grep 'createObjParticipantsAgent'

  it('createObjParticipantsAgent', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_id-createObjParticipantsAgent-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user,
            participants: [userid.toString()]
          };

          requestService.create(request).then(function (savedRequest) {
            winston.debug("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id-createObjParticipantsAgent-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.department).to.equal(undefined);
            expect(savedRequest.status).to.equal(200);
            expect(savedRequest.participants).to.have.lengthOf(1);
            expect(savedRequest.participants).to.contains(userid);
            expect(savedRequest.participantsAgents).to.contains(userid);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            console.log("savedRequest.participants[0]", savedRequest.participants[0]);
            expect(savedRequest.participants[0].toString()).to.equal(userid);
            expect(savedRequest.participantsAgents[0].toString()).to.equal(userid);
            expect(savedRequest.assigned_at).to.not.equal(null);

            expect(savedRequest.snapshot.department).to.equal(undefined);
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.snapshot.lead.fullname).to.equal("leadfullname");
            expect(savedRequest.snapshot.requester.role).to.equal("owner");
            // expect(savedRequest.snapshot.requester.role).to.equal("owner");

            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

            // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
            // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

            expect(savedRequest.id_project).to.equal(savedProject._id.toString());

            // aiuto
            // expect(savedRequest.department).to.equal("requester_id1");
            done();
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });







  // mocha test/requestService.js  --grep 'createObjTemp'

  it('createObjTemp', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_id-createObjTemp-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user,
            status: 50
          };

          requestService.create(request).then(function (savedRequest) {
            winston.debug("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id-createObjTemp-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.department).to.not.equal(undefined);
            expect(savedRequest.status).to.equal(50);
            expect(savedRequest.participants).to.have.lengthOf(0);
            expect(savedRequest.participantsAgents).to.have.lengthOf(0);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            console.log("savedRequest.participants[0]", savedRequest.participants[0]);
            expect(savedRequest.assigned_at).to.equal(undefined);

            expect(savedRequest.snapshot.department.name).to.not.equal(null);
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.snapshot.lead.fullname).to.equal("leadfullname");
            expect(savedRequest.snapshot.requester.role).to.equal("owner");
            // expect(savedRequest.snapshot.requester.role).to.equal("owner");

            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

            // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
            // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

            expect(savedRequest.id_project).to.equal(savedProject._id.toString());

            // aiuto
            // expect(savedRequest.department).to.equal("requester_id1");
            done();
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });

  it('createWithIdAndCreateNewLead', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          requestService.createWithIdAndRequester("request_id-createWithIdAndCreateNewLead-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {
            winston.debug("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id-createWithIdAndCreateNewLead-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.status).to.equal(200);
            expect(savedRequest.participants).to.have.lengthOf(1);
            expect(savedRequest.participants).to.contains(userid);
            expect(savedRequest.participantsAgents).to.contains(userid);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            console.log("savedRequest.participants[0]", savedRequest.participants[0]);
            expect(savedRequest.participants[0].toString()).to.equal(userid);
            expect(savedRequest.participantsAgents[0].toString()).to.equal(userid);
            expect(savedRequest.assigned_at).to.not.equal(null);

            expect(savedRequest.snapshot.department.name).to.not.equal(null);
            expect(savedRequest.snapshot.agents).to.not.equal(null);
            expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);
            expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

            // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
            // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

            expect(savedRequest.id_project).to.equal(savedProject._id.toString());

            // aiuto
            // expect(savedRequest.department).to.equal("requester_id1");
            done();
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });





  it('createWithIdAndCreateNewLeadAndCheckRequestEvent', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {

          requestEvent.on('request.create', function (savedRequest) {

            if (savedRequest.request_id === "createWithIdAndCreateNewLeadAndCheckRequestEvent-" + now) {


              console.log("savedRequest", savedRequest.toJSON());

              winston.debug("resolve", savedRequest.toObject());
              expect(savedRequest.request_id).to.equal("createWithIdAndCreateNewLeadAndCheckRequestEvent-" + now);
              expect(savedRequest.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
              expect(savedRequest.first_text).to.equal("first_text");
              expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
              expect(savedRequest.status).to.equal(200);
              expect(savedRequest.participants).to.have.lengthOf(1);
              expect(savedRequest.participants).to.contains(userid);
              expect(savedRequest.participantsAgents).to.contains(userid);
              expect(savedRequest.participantsBots).to.have.lengthOf(0);
              expect(savedRequest.hasBot).to.equal(false);
              console.log("savedRequest.participants[0]", savedRequest.participants[0]);
              expect(savedRequest.participants[0].toString()).to.equal(userid);

              expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

              expect(savedRequest.participatingAgents.length).to.equal(1);
              expect(savedRequest.participatingBots.length).to.equal(0);
              expect(savedRequest.snapshot.availableAgentsCount).to.equal(1);

              // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
              // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

              expect(savedRequest.id_project).to.equal(savedProject._id.toString());

              // aiuto
              // expect(savedRequest.department).to.equal("requester_id1");
              done();
            }

          });
          requestService.createWithIdAndRequester("createWithIdAndCreateNewLeadAndCheckRequestEvent-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {

          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });

  });




  // it('createWithIdLead', function (done) {
  //   // this.timeout(10000);

  //    projectService.create("createWithId", userid).then(function(savedProject) {
  //     leadService.createIfNotExists("leadfullname", "email@email.com",  savedProject._id).then(function(lead) {
  //     // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
  //      requestService.createWithId("request_id1", lead._id,  savedProject._id, "first_text").then(function(savedRequest) {
  //        leadService.findByEmail("email@email.com", savedProject._id).then(function(lead) {
  //         winston.debug("resolve", savedRequest);
  //         expect(savedRequest.request_id).to.equal("request_id1");
  //         expect(savedRequest.requester_id).to.equal(lead._id.toString());
  //         expect(savedRequest.first_text).to.equal("first_text");
  //         expect(savedRequest.agents).to.have.lengthOf(1);
  //         expect(savedRequest.status).to.equal(200);
  //         expect(savedRequest.participants).to.contains(userid);
  //         expect(savedRequest.createdBy).to.equal(lead._id.toString());

  //         // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
  //         // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

  //         expect(savedRequest.id_project).to.equal(savedProject._id.toString());

  //         // aiuto
  //         // expect(savedRequest.department).to.equal("requester_id1");
  //         done();
  //       }).catch(function(err) {
  //           console.log("test reject");
  //           assert.isNotOk(err,'Promise error');
  //           done();
  //       });
  //     });
  //     });
  // });

  // });






  it('createWithIdAndCreatedBy', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithIdAndCreatedBy", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
        requestService.createWithIdAndRequester("request_id-createWithIdAndCreatedBy-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", null, null, null, null, null, "user1").then(function (savedRequest) {
          console.log("test resolve");
          expect(savedRequest.request_id).to.equal("request_id-createWithIdAndCreatedBy-" + now);
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(200);
          expect(savedRequest.participants).to.contains(userid);
          expect(savedRequest.participantsAgents).to.contains(userid);
          expect(savedRequest.participantsBots).to.have.lengthOf(0);
          expect(savedRequest.hasBot).to.equal(false);
          expect(savedRequest.createdBy).to.equal("user1");

          // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
          // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

          expect(savedRequest.id_project).to.equal(savedProject._id.toString());

          // aiuto
          // expect(savedRequest.department).to.equal("requester_id1");
          done();
        })
          .catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
      });
    });
  });



  // mocha test/requestService.js  --grep 'createWithWrongDepartmentId'

  it('createWithWrongDepartmentId', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithWrongDepartmentId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
        requestService.createWithIdAndRequester("request_idcreateWithWrongDepartmentId-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", "5ebd890b3f2702001915c89e", null, null, null, null, "user1").then(function (savedRequest) {

        })
          .catch(function (err) {
            console.log("test reject", err);
            done();
          });
      });
    });
  });



  it('createWithIdWithPooledDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("createWithIdWithPooledDepartment", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        departmentService.create("PooledDepartment-for-createWithIdWith-createWithIdWithPooledDepartment", savedProject._id, 'pooled', userid).then(function (createdDepartment) {
          var now = Date.now();
          requestService.createWithIdAndRequester("request_id-createWithIdWithPooledDepartment-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", createdDepartment._id).then(function (savedRequest) {
            winston.debug("resolve savedRequest");
            expect(savedRequest.request_id).to.equal("request_id-createWithIdWithPooledDepartment-" + now);
            expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequest.first_text).to.equal("first_text");
            expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequest.status).to.equal(100);
            expect(savedRequest.participants).to.have.lengthOf(0);
            expect(savedRequest.participantsAgents).to.have.lengthOf(0);
            expect(savedRequest.participantsBots).to.have.lengthOf(0);
            expect(savedRequest.hasBot).to.equal(false);
            expect(savedRequest.id_project).to.equal(savedProject._id.toString());
            expect(savedRequest.department.toString()).to.equal(createdDepartment._id.toString());
            done();
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });

  // mocha test/requestService.js  --grep 'updateWaitingTimeRequest'

  it('updateWaitingTimeRequest', function (done) {
    this.timeout(1000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      var messageSender = "5badfe5d553d1844ad654072";
      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id-waitingTimeRequest-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          setTimeout(function () {
            Promise.all([
              messageService.create(messageSender, "test sender", savedRequest.request_id, "hello1",
                savedProject._id, messageSender),
              messageService.create(messageSender, "test sender", savedRequest.request_id, "hello2",
                savedProject._id, messageSender)]).then(function (all) {
                  requestService.updateWaitingTimeByRequestId(savedRequest.request_id, savedProject._id, true).then(function (upRequest) {
                    var maxWaitingTime = Date.now() - upRequest.createdAt;
                    console.log("resolve closedRequest", upRequest.toObject(), maxWaitingTime);

                    expect(upRequest.status).to.equal(200);
                    // console.log("1")
                    // expect(upRequest.status).to.equal(300);
                    expect(upRequest.waiting_time).to.not.equal(null);
                    // console.log("2")
                    expect(upRequest.waiting_time).to.gte(300);
                    // console.log("3")
                    expect(upRequest.waiting_time).to.lte(maxWaitingTime);
                    // console.log("4")
                    expect(upRequest.first_response_at).to.not.equal(null);
                    // console.log("5")
                    done();
                  }).catch(function (err) {
                    winston.error("test reject", err);
                    assert.isNotOk(err, 'Promise error');
                    done();
                  });
                });
          }, 300);
        });
      });
    });
  });






  // mocha test/requestService.js  --grep 'closeRequest'


  it('closeRequest', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id-closeRequest-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          Promise.all([
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello1",
              savedProject._id, "5badfe5d553d1844ad654072"),
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
              savedProject._id, "5badfe5d553d1844ad654072")]).then(function (all) {
                // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
                requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id, false, true, "user1").then(function (closedRequest) {
                  winston.debug("resolve closedRequest", closedRequest.toObject());
                  expect(closedRequest.status).to.equal(1000);
                  expect(closedRequest.closed_at).to.not.equal(null);
                  expect(closedRequest.transcript).to.contains("hello1");
                  expect(closedRequest.transcript).to.contains("hello2");
                  expect(closedRequest.snapshot.agents).to.equal(undefined);
                  expect(closedRequest.closed_by).to.equal("user1");

                  done();
                }).catch(function (err) {
                  winston.error("test reject", err);
                  assert.isNotOk(err, 'Promise error');
                  done();
                });
              });
        });
      });
    });
  });




  // mocha test/requestService.js  --grep 'closeRequestForce'


  it('closeRequestForce', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id-closeRequest-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          Promise.all([
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello1",
              savedProject._id, "5badfe5d553d1844ad654072"),
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
              savedProject._id, "5badfe5d553d1844ad654072")]).then(function (all) {
                // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by, force)
                requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id, false, true, "user1").then(function (closedRequest) {
                  winston.debug("resolve closedRequest", closedRequest.toObject());
                  expect(closedRequest.status).to.equal(1000);
                  expect(closedRequest.closed_at).to.not.equal(null);
                  expect(closedRequest.transcript).to.contains("hello1");
                  expect(closedRequest.transcript).to.contains("hello2");
                  expect(closedRequest.snapshot.agents).to.equal(undefined);
                  expect(closedRequest.closed_by).to.equal("user1");

                  requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id, false, true, "user1", true).then(function (closedRequest) {
                    expect(closedRequest.status).to.equal(1000);
                    done();
                  });

                }).catch(function (err) {
                  winston.error("test reject", err);
                  assert.isNotOk(err, 'Promise error');
                  done();
                });
              });
        });
      });
    });
  });





  it('closeRequestAndSendTranscript', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid, { email: { autoSendTranscriptToRequester: true } }).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "andrea.leo@frontiere21.it", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          requestService.createWithIdAndRequester("request_id-closeRequestAndSendTranscript-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {
            Promise.all([
              messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello1",
                savedProject._id, "5badfe5d553d1844ad654072"),
              messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
                savedProject._id, "5badfe5d553d1844ad654072")]).then(function (all) {
                  requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function (closedRequest) {
                    winston.debug("resolve closedRequest", closedRequest.toObject());
                    expect(closedRequest.status).to.equal(1000);
                    expect(closedRequest.closed_at).to.not.equal(null);
                    expect(closedRequest.transcript).to.contains("hello1");
                    expect(closedRequest.transcript).to.contains("hello2");
                    expect(closedRequest.snapshot.agents).to.equal(undefined);

                    done();
                  }).catch(function (err) {
                    winston.error("test reject", err);
                    assert.isNotOk(err, 'Promise error');
                    done();
                  });
                });
          });
        });
      });
    });
  });



  it('reopenRequest', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();

        requestService.createWithIdAndRequester("request_id-reopenRequest-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {

          requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function (closedRequest) {
            requestService.reopenRequestByRequestId(savedRequest.request_id, savedProject._id).then(function (reopenedRequest) {

              winston.info("resolve reopenedRequest", reopenedRequest.toObject());

              //check closedRequest
              expect(closedRequest.status).to.equal(1000);
              expect(closedRequest.closed_at).to.not.equal(null);
              expect(closedRequest.participants).to.have.lengthOf(1);

              //check reopenedRequest
              expect(reopenedRequest.status).to.equal(200);
              expect(reopenedRequest.closed_at).to.not.equal(null);
              expect(reopenedRequest.participants).to.have.lengthOf(1);
              expect(reopenedRequest.snapshot.agents).to.equal(undefined);


              done();
            }).catch(function (err) {
              winston.error("test reject", err);
              assert.isNotOk(err, 'Promise error');
              done();
            });
          });
        });
      });
    });
  });

  // mocha test/requestService.js  --grep 'addparticipant'

  it('addparticipant', function (done) {

    var email = "test-request-addparticipant-" + Date.now() + "@email.com";
    var email2 = "test-request-addparticipant2-" + Date.now() + "@email.com";

    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("addparticipant-project", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        userService.signup(email2, pwd, "Test Firstname2", "Test lastname2").then(function (savedUser2) {

          // console.log("savedUser2",savedUser2);

          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: savedProject._id.toString(),
            id_user: savedUser2._id.toString(),
            role: "agent",
            user_available: false,
            createdBy: userid,
            updatedBy: userid
          });

          return newProject_user.save(function (err, savedProject_user) {

            if (err) {
              console.log("err", err)
            }

            var now = Date.now();
            requestService.createWithIdAndRequester("request_id-addparticipant-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
              //  inserisci id valido
              //  var member = 'agent1';
              var member = savedUser2._id.toString();
              // console.log("member",member)
              //  addParticipantByRequestId(request_id, id_project, member) {
              requestService.addParticipantByRequestId(savedRequest.request_id, savedProject._id, member).then(function (savedRequestParticipant) {
                winston.info("resolve addParticipantByRequestId", savedRequestParticipant.toObject());
                expect(savedRequestParticipant.request_id).to.equal("request_id-addparticipant-" + now);

                winston.info("savedProjectAndPU.project_user._id.toString():" + savedProjectAndPU.project_user._id.toString());
                expect(savedRequestParticipant.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());

                expect(savedRequestParticipant.first_text).to.equal("first_text");
                // expect(savedRequestParticipant.snapshot.agents).to.have.lengthOf(2);
                expect(savedRequestParticipant.status).to.equal(200);

                expect(savedRequestParticipant.participants).to.have.lengthOf(2);
                expect(savedRequestParticipant.participants).to.contains(userid);
                expect(savedRequestParticipant.participants).to.contains(member);

                expect(savedRequestParticipant.participantsAgents).to.have.lengthOf(2);
                expect(savedRequestParticipant.participantsAgents).to.contains(userid);
                expect(savedRequestParticipant.participantsAgents).to.contains(member);

                expect(savedRequestParticipant.participatingAgents).to.have.lengthOf(2);
                expect(savedRequestParticipant.participatingBots).to.have.lengthOf(0);
                expect(savedRequestParticipant.hasBot).to.equal(false);
                expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());

                expect(savedRequestParticipant.snapshot.agents).to.equal(undefined);

                done();
              }).catch(function (err) {
                console.log("test reject", err);
                assert.isNotOk(err, 'Promise error');
                done();
              });
            });
          });
        });
      });
    });
  });






  it('setParticipantsByRequestId', function (done) {

    var email = "test-request-setParticipantsByRequestId-" + Date.now() + "@email.com";
    var email2 = "test-request-setParticipantsByRequestId2-" + Date.now() + "@email.com";

    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("setParticipantsByRequestId-project", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        userService.signup(email2, pwd, "Test Firstname2", "Test lastname2").then(function (savedUser2) {

          // console.log("savedUser2",savedUser2);

          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: savedProject._id.toString(),
            id_user: savedUser2._id.toString(),
            role: "agent",
            user_available: false,
            createdBy: userid,
            updatedBy: userid
          });

          return newProject_user.save(function (err, savedProject_user) {

            if (err) {
              console.log("err", err)
            }
            var now = Date.now();

            requestService.createWithIdAndRequester("request_id1-setParticipantsByRequestId-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
              expect(savedRequest.participants).to.contains(userid);
              expect(savedRequest.participantsAgents).to.contains(userid);

              //  inserisci id valido
              //  var member = 'agent1';
              var member = savedUser2._id.toString();
              // console.log("member",member)
              // setParticipantsByRequestId(request_id, id_project, newparticipants) {
              requestService.setParticipantsByRequestId(savedRequest.request_id, savedProject._id, [member]).then(function (savedRequestParticipant) {
                winston.info("resolve setParticipantsByRequestId", savedRequestParticipant.toObject());
                expect(savedRequestParticipant.request_id).to.equal("request_id1-setParticipantsByRequestId-" + now);

                winston.info("savedProjectAndPU.project_user._id.toString():" + savedProjectAndPU.project_user._id.toString());
                expect(savedRequestParticipant.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());

                expect(savedRequestParticipant.first_text).to.equal("first_text");
                // expect(savedRequestParticipant.snapshot.agents).to.have.lengthOf(2);
                expect(savedRequestParticipant.status).to.equal(200);

                expect(savedRequestParticipant.participants).to.have.lengthOf(1);
                expect(savedRequestParticipant.participants).to.contains(member);

                expect(savedRequestParticipant.participantsAgents).to.have.lengthOf(1);
                expect(savedRequestParticipant.participantsAgents).to.contains(member);

                expect(savedRequestParticipant.participatingAgents).to.have.lengthOf(1);
                expect(savedRequestParticipant.participatingAgents[0]._id.toString()).to.equal(member);
                expect(savedRequestParticipant.participatingBots).to.have.lengthOf(0);
                expect(savedRequestParticipant.hasBot).to.equal(false);
                expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());

                done();
              }).catch(function (err) {
                console.log("test reject", err);
                assert.isNotOk(err, 'Promise error');
                done();
              });
            });
          });
        });
      });
    });
  });


  // mocha test/requestService.js  --grep 'removeparticipant'

  it('removeparticipant', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("removeparticipant-project", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id-removeparticipant-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, userid).then(function (savedRequestParticipant) {
            winston.info("resolve", savedRequestParticipant.toObject());

            //savedRequest is assigned -> 200
            expect(savedRequest.status).to.equal(200);

            //savedRequestParticipant is UNASSIGNED -> 100
            expect(savedRequestParticipant.request_id).to.equal("request_id-removeparticipant-" + now);
            // expect(savedRequestParticipant.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequestParticipant.first_text).to.equal("first_text");
            // expect(savedRequestParticipant.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequestParticipant.status).to.equal(100);
            expect(savedRequestParticipant.participants).to.have.lengthOf(0);
            expect(savedRequestParticipant.participantsAgents).to.have.lengthOf(0);
            expect(savedRequestParticipant.participantsBots).to.have.lengthOf(0);

            expect(savedRequestParticipant.participatingAgents).to.have.lengthOf(0);
            expect(savedRequestParticipant.participatingBots).to.have.lengthOf(0);

            expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());
            expect(savedRequestParticipant.attributes.abandoned_by_project_users[savedProjectAndPU.project_user._id]).to.not.equal(undefined);

            done();
          }).catch(function (err) {
            console.log("test reject");
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });



  // mocha test/requestService.js  --grep 'routeDepartmentSameAgentSameDepartmentSkipUpdate'
  it('routeDepartmentSameAgentSameDepartmentSkipUpdate', function (done) {
    // this.timeout(10000);

    var email = "test-route-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("routeDepartmentSameAgentSameDepartmentSkipUpdate", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("routeDepartmentSameAgentSameDepartmentSkipUpdate-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          winston.debug("resolve savedRequest");
          expect(savedRequest.request_id).to.equal("routeDepartmentSameAgentSameDepartmentSkipUpdate-" + now);
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(200);
          expect(savedRequest.participants).to.have.lengthOf(1);
          expect(savedRequest.participantsAgents).to.have.lengthOf(1);
          expect(savedRequest.participantsBots).to.have.lengthOf(0);
          expect(savedRequest.hasBot).to.equal(false);
          expect(savedRequest.id_project).to.equal(savedProject._id.toString());

          console.log("savedRequest.department", savedRequest.department);
          // expect(savedRequest.department.name).to.equal("Default");

          // departmentService.create("AssignedDepartment-for-routeDepartmentSameAgentSameDepartmentSkipUpdate", savedProject._id, 'assigned', userid).then(function(createdDepartment) {
          let dep = savedRequest.department;

          // route(request_id, departmentid, id_project, nobot, no_populate) {
          requestService.route("routeDepartmentSameAgentSameDepartmentSkipUpdate-" + now, dep, savedProject._id, false).then(function (routedRequest) {

            expect(routedRequest.request_id).to.equal("routeDepartmentSameAgentSameDepartmentSkipUpdate-" + now);
            expect(routedRequest.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(routedRequest.first_text).to.equal("first_text");
            expect(routedRequest.snapshot.agents).to.have.lengthOf(1);
            expect(routedRequest.status).to.equal(200);
            expect(routedRequest.participants).to.have.lengthOf(1);
            expect(routedRequest.participantsAgents).to.have.lengthOf(1);
            expect(routedRequest.participantsBots).to.have.lengthOf(0);
            expect(routedRequest.hasBot).to.equal(false);
            expect(routedRequest.id_project).to.equal(savedProject._id.toString());

            console.log("routedRequest.department.name", routedRequest.department.name);
            expect(routedRequest.department._id.toString()).to.equal(dep.toString());
            expect(routedRequest.snapshot.department._id.toString()).to.equal(dep.toString());

            done();

          });

        }).catch(function (err) {
          console.log("test reject", err);
          assert.isNotOk(err, 'Promise error');
          done();
        });
      });
    });
  });



  // mocha test/requestService.js  --grep 'routeDepartmentSameAgentDifferentDepartment'
  it('routeDepartmentSameAgentDifferentDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-route-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("routeDepartmentSameAgentDifferentDepartment", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();

        requestService.createWithIdAndRequester("routeDepartmentSameAgentDifferentDepartment-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          winston.debug("resolve savedRequest");
          expect(savedRequest.request_id).to.equal("routeDepartmentSameAgentDifferentDepartment-" + now);
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.snapshot.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(200);
          expect(savedRequest.participants).to.have.lengthOf(1);
          expect(savedRequest.participantsAgents).to.have.lengthOf(1);
          expect(savedRequest.participantsBots).to.have.lengthOf(0);
          expect(savedRequest.hasBot).to.equal(false);
          expect(savedRequest.id_project).to.equal(savedProject._id.toString());

          console.log("savedRequest.department", savedRequest.department);
          // expect(savedRequest.department.name).to.equal("Default");

          departmentService.create("AssignedDepartment-for-routeDepartmentSameAgentDifferentDepartment", savedProject._id, 'assigned', userid).then(function (createdDepartment) {

            // route(request_id, departmentid, id_project, nobot, no_populate) {
            requestService.route("routeDepartmentSameAgentDifferentDepartment-" + now, createdDepartment._id, savedProject._id, false).then(function (routedRequest) {

              expect(routedRequest.request_id).to.equal("routeDepartmentSameAgentDifferentDepartment-" + now);
              expect(routedRequest.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
              expect(routedRequest.first_text).to.equal("first_text");
              expect(routedRequest.snapshot.agents).to.have.lengthOf(1);
              expect(routedRequest.status).to.equal(200);
              expect(routedRequest.participants).to.have.lengthOf(1);
              expect(routedRequest.participantsAgents).to.have.lengthOf(1);
              expect(routedRequest.participantsBots).to.have.lengthOf(0);
              expect(routedRequest.hasBot).to.equal(false);
              expect(routedRequest.id_project).to.equal(savedProject._id.toString());

              console.log("routedRequest.department.name", routedRequest.department.name);
              expect(routedRequest.department._id.toString()).to.equal(createdDepartment._id.toString());
              expect(routedRequest.snapshot.department._id.toString()).to.equal(createdDepartment._id.toString());

              done();

            });

          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });




  // mocha test/requestService.js  --grep 'routeDepartmentDifferentAgentDifferentDepartment'
  it('routeDepartmentDifferentAgentDifferentDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-route-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("routeDepartmentDifferentAgentDifferentDepartment", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;




        var email2 = "test-route-create-" + Date.now() + "@email.com";
        var pwd2 = "pwd";

        userService.signup(email2, pwd2, "Test Firstname", "Test lastname").then(function (savedUser2) {
          var userid2 = savedUser2.id;


          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: savedProject._id.toString(),
            id_user: savedUser2._id.toString(),
            role: "agent",
            user_available: true,
            createdBy: userid,
            updatedBy: userid
          });

          newProject_user.save(function (err, savedProject_user) {

            if (err) {
              console.log("err", err)
            }
            var now = Date.now();

            requestService.createWithIdAndRequester("routeDepartmentDifferentAgentDifferentDepartment-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
              winston.debug("resolve savedRequest");
              expect(savedRequest.request_id).to.equal("routeDepartmentDifferentAgentDifferentDepartment-" + now);
              expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
              expect(savedRequest.first_text).to.equal("first_text");
              expect(savedRequest.snapshot.agents).to.have.lengthOf(2);
              expect(savedRequest.status).to.equal(200);
              expect(savedRequest.participants).to.have.lengthOf(1);
              // expect(savedRequest.participants[0]).to.equal(userid);
              expect(savedRequest.participantsAgents).to.have.lengthOf(1);
              expect(savedRequest.participantsBots).to.have.lengthOf(0);
              expect(savedRequest.hasBot).to.equal(false);
              expect(savedRequest.id_project).to.equal(savedProject._id.toString());

              console.log("savedRequest.department", savedRequest.department);
              // expect(savedRequest.department.name).to.equal("Default");


              var newGroup = new Group({
                name: "group1",
                members: [userid2],
                trashed: false,
                id_project: savedProject._id,
                createdBy: userid,
                updatedBy: userid
              });
              newGroup.save(function (err, savedGroup) {
                console.log("savedGroup", savedGroup)



                departmentService.create("AssignedDepartment-for-routeDepartmentDifferentAgentDifferentDepartment", savedProject._id, 'assigned', userid).then(function (createdDepartment) {


                  createdDepartment.id_group = newGroup._id;
                  createdDepartment.save(function (err, savedGroupDepartment) {
                    console.log("savedGroupDepartment", savedGroupDepartment)


                    // route(request_id, departmentid, id_project, nobot, no_populate) {
                    requestService.route("routeDepartmentDifferentAgentDifferentDepartment-" + now, createdDepartment._id, savedProject._id, false).then(function (routedRequest) {

                      expect(routedRequest.request_id).to.equal("routeDepartmentDifferentAgentDifferentDepartment-" + now);
                      expect(routedRequest.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
                      expect(routedRequest.first_text).to.equal("first_text");
                      expect(routedRequest.snapshot.agents).to.have.lengthOf(1);
                      expect(routedRequest.status).to.equal(200);
                      expect(routedRequest.participants).to.have.lengthOf(1);
                      expect(routedRequest.participants[0]).to.equal(userid2);
                      expect(routedRequest.participantsAgents).to.have.lengthOf(1);
                      expect(routedRequest.participantsBots).to.have.lengthOf(0);
                      expect(routedRequest.hasBot).to.equal(false);
                      expect(routedRequest.id_project).to.equal(savedProject._id.toString());

                      console.log("routedRequest.department.name", routedRequest.department.name);
                      expect(routedRequest.department._id.toString()).to.equal(createdDepartment._id.toString());
                      expect(routedRequest.snapshot.department._id.toString()).to.equal(createdDepartment._id.toString());

                      done();

                    });

                  });
                });
              });
            });
          });
        });
      });
    });
  });









  it('reroute', function (done) {

    var email = "test-request-reroute-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("reroute-project", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id1-reroute-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {

          // reroute(request_id, id_project, nobot) {
          requestService.reroute(savedRequest.request_id, savedProject._id, true).then(function (savedRequestParticipant) {
            winston.info("resolve", savedRequestParticipant.toObject());

            //savedRequest is assigned -> 200
            expect(savedRequest.status).to.equal(200);

            //savedRequestParticipant is UNASSIGNED -> 100
            expect(savedRequestParticipant.request_id).to.equal("request_id1-reroute-" + now);
            // expect(savedRequestParticipant.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
            expect(savedRequestParticipant.first_text).to.equal("first_text");
            expect(savedRequestParticipant.snapshot.agents).to.have.lengthOf(1);
            expect(savedRequestParticipant.status).to.equal(200);
            expect(savedRequestParticipant.participants).to.have.lengthOf(1);
            expect(savedRequestParticipant.participantsAgents).to.have.lengthOf(1);
            expect(savedRequestParticipant.participantsAgents).to.contains(userid);
            expect(savedRequestParticipant.participantsBots).to.have.lengthOf(0);

            expect(savedRequestParticipant.participatingAgents).to.have.lengthOf(1);
            expect(savedRequestParticipant.participatingBots).to.have.lengthOf(0);

            expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());

            done();
          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });







  it('closeRequestAndRemoveParticipant', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();
        requestService.createWithIdAndRequester("request_id-closeRequestAndRemoveParticipant-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          Promise.all([
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello1",
              savedProject._id, "5badfe5d553d1844ad654072"),
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
              savedProject._id, "5badfe5d553d1844ad654072")]).then(function (all) {
                requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function (closedRequest) {
                  expect(closedRequest.closed_at).to.not.equal(null);
                  expect(closedRequest.transcript).to.contains("hello1");
                  expect(closedRequest.transcript).to.contains("hello2");

                  requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, userid).then(function (savedRequestParticipant) {
                    winston.debug("resolve closeRequestAndRemoveParticipant", closedRequest.toObject());
                    expect(savedRequestParticipant.status).to.equal(1000);

                    done();
                  });
                }).catch(function (err) {
                  winston.error("test reject", err);
                  assert.isNotOk(err, 'Promise error');
                  done();
                });
              });
        });
      });
    });
  });




  it('addTag', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          requestService.createWithIdAndRequester("request_id1-addTag-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {
            winston.debug("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id1-addTag-" + now);
            expect(savedRequest.tags.length).to.equal(0);

            var tag = { tag: "tag1" };
            requestService.addTagByRequestId("request_id1-addTag-" + now, savedProject._id, tag).then(function (savedReqTag) {
              expect(savedReqTag.request_id).to.equal("request_id1-addTag-" + now);
              expect(savedReqTag.tags.length).to.equal(1);
              expect(savedReqTag.tags[0].tag).to.equal("tag1");
              done();
            });


          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });



  it('removeTag', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;
      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          requestService.createWithIdAndRequester("request_id1-addTag-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {
            winston.debug("resolve", savedRequest.toObject());
            expect(savedRequest.request_id).to.equal("request_id1-addTag-" + now);
            expect(savedRequest.tags.length).to.equal(0);

            var tag = { tag: "tag1" };
            requestService.addTagByRequestId("request_id1-addTag-" + now, savedProject._id, tag).then(function (savedReqTag) {
              expect(savedReqTag.request_id).to.equal("request_id1-addTag-" + now);
              expect(savedReqTag.tags.length).to.equal(1);
              expect(savedReqTag.tags[0].tag).to.equal("tag1");

              requestService.removeTagByRequestId("request_id1-addTag-" + now, savedProject._id, "tag1").then(function (savedReqTagRem) {
                expect(savedReqTagRem.request_id).to.equal("request_id1-addTag-" + now);
                expect(savedReqTagRem.tags.length).to.equal(0);
                done();
              });

            });


          }).catch(function (err) {
            console.log("test reject", err);
            assert.isNotOk(err, 'Promise error');
            done();
          });
        });
      });
    });
  });








  // mocha test/requestService.js  --grep 'createMessageMicroLanguageAttributes'

  it('createMessageMicroLanguageAttributes', function (done) {
    // this.timeout(10000);


    var microLanguageTransformerInterceptor = require('../pubmodules/messageTransformer/microLanguageAttributesTransformerInterceptor');
    // var microLanguageTransformerInterceptor = require('../pubmodules/messageTransformer/microLanguageTransformerInterceptor');
    console.log("microLanguageTransformerInterceptor", microLanguageTransformerInterceptor);
    microLanguageTransformerInterceptor.listen();



    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          var now = Date.now();
          var request = {
            request_id: "request_idcreateMessageMicroLanguageAttributes-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            participants: [userid],
            lead: createdLead, requester: savedProjectAndPU.project_user
          };

          requestService.create(request).then(function (savedRequest) {
            winston.info("resolve", savedRequest.toObject());

            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
            messageService.create(userid, "test sender", "testrecipient-createMessageMicroLanguageFromBot", "ciao\n* Button1",
              savedProject._id, userid, undefined, { microlanguage: true }).then(function (savedMessage) {
                winston.debug("resolve savedMessage", savedMessage.toObject());

                expect(savedMessage.text).to.equal("ciao");
                expect(savedMessage.type).to.equal("text");
                expect(savedMessage.attributes._raw_message).to.equal("ciao\n* Button1", "attachment");
                expect(savedMessage.attributes.attachment.type).to.equal("template");
                expect(savedMessage.attributes.attachment.buttons[0].value).to.equal("Button1");
                expect(savedMessage.sender).to.equal(userid);
                expect(savedMessage.senderFullname).to.equal("test sender");
                expect(savedMessage.recipient).to.equal("testrecipient-createMessageMicroLanguageFromBot");
                done();

              })
          });
        });
      });

    });
  });











  // mocha test/requestService.js  --grep 'createMessageMicroLanguageFromBot'

  it('createMessageMicroLanguageFromBot', function (done) {
    // this.timeout(10000);


    // var microLanguageTransformerInterceptor = require('../pubmodules/messageTransformer/microLanguageAttributesTransformerInterceptor');
    var microLanguageTransformerInterceptor = require('../pubmodules/messageTransformer/microLanguageTransformerInterceptor');
    console.log("microLanguageTransformerInterceptor", microLanguageTransformerInterceptor);
    microLanguageTransformerInterceptor.listen();



    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {

          var now = Date.now();


          var request = {
            request_id: "request_idcreateMessageMicroLanguageFromBot-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            participants: ["bot_" + userid],
            lead: createdLead, requester: savedProjectAndPU.project_user
          };


          requestService.create(request).then(function (savedRequest) {
            winston.info("resolve", savedRequest.toObject());

            // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
            messageService.create(userid, "test sender", "testrecipient-createMessageMicroLanguageFromBot", "ciao\n* Button1",
              savedProject._id, userid, undefined, { microlanguage: true }).then(function (savedMessage) {
                winston.debug("resolve savedMessage", savedMessage.toObject());

                expect(savedMessage.text).to.equal("ciao");
                expect(savedMessage.type).to.equal("text");
                expect(savedMessage.attributes._raw_message).to.equal("ciao\n* Button1", "attachment");
                expect(savedMessage.attributes.attachment.type).to.equal("template");
                expect(savedMessage.attributes.attachment.buttons[0].value).to.equal("Button1");
                expect(savedMessage.sender).to.equal(userid);
                expect(savedMessage.senderFullname).to.equal("test sender");
                expect(savedMessage.recipient).to.equal("testrecipient-createMessageMicroLanguageFromBot");
                done();

              })
          });
        });
      });

    });
  });



  // mocha test/requestService.js  --grep 'selectSnapshot'

  it('selectSnapshot', function (done) {
    // this.timeout(10000);
    // return new Promise(function (resolve) {
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;

        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {

          var now = Date.now();

          var request = {
            request_id: "request_idselectSnapshot-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            participants: ["bot_" + userid],
            lead: createdLead, requester: savedProjectAndPU.project_user
          };

          requestService.create(request).then(async function (savedRequest) {
            winston.info("resolve", savedRequest.toObject());

            var snapshotAgents = await Request.findById(savedRequest.id).select({ "snapshot": 1 }).exec();

            console.log("snapshotAgents", snapshotAgents);

            expect(snapshotAgents.snapshot.agents.length).to.equal(1);
            // return;
            done();

          });
        });
      });
    });
    // });
  });

});



