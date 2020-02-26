//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var chai = require("chai");
chai.config.includeStack = true;

var expect = chai.expect;
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

var requestService = require('../services/requestService');
var messageService = require('../services/messageService');
var projectService = require('../services/projectService');
var departmentService = require('../services/departmentService');
var leadService = require('../services/leadService');
var userService = require('../services/userService');

var Request = require("../models/request");
var requestEvent = require('../event/requestEvent');

describe('RequestService', function () {

  // var userid = "5badfe5d553d1844ad654072";

  it('createWithIdAndCreateNewLead', function (done) {
    // this.timeout(10000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;
     projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;

      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
       requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
          expect(savedRequest.request_id).to.equal("request_id1");
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(200);
          expect(savedRequest.participants).to.have.lengthOf(1);
          expect(savedRequest.participants).to.contains(userid);
          console.log("savedRequest.participants[0]", savedRequest.participants[0]);
          expect(savedRequest.participants[0].toString()).to.equal(userid);
          
          expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

          // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
          // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

          expect(savedRequest.id_project).to.equal(savedProject._id.toString());

          // aiuto
          // expect(savedRequest.department).to.equal("requester_id1");
          done();
        }).catch(function(err) {
            console.log("test reject",err);
            assert.isNotOk(err,'Promise error');
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

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

     projectService.createAndReturnProjectAndProjectUser("createWithId", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;

      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {

        requestEvent.on('request.create', function(savedRequest) {

          if (savedRequest.request_id === "createWithIdAndCreateNewLeadAndCheckRequestEvent" ) {

        
              console.log("savedRequest",savedRequest.toJSON());

              winston.debug("resolve", savedRequest.toObject());
              expect(savedRequest.request_id).to.equal("createWithIdAndCreateNewLeadAndCheckRequestEvent");
              expect(savedRequest.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
              expect(savedRequest.first_text).to.equal("first_text");
              expect(savedRequest.agents).to.have.lengthOf(1);
              expect(savedRequest.status).to.equal(200);
              expect(savedRequest.participants).to.have.lengthOf(1);
              expect(savedRequest.participants).to.contains(userid);
              console.log("savedRequest.participants[0]", savedRequest.participants[0]);
              expect(savedRequest.participants[0].toString()).to.equal(userid);
              
              expect(savedRequest.createdBy).to.equal(savedProjectAndPU.project_user._id.toString());

              expect(savedRequest.participatingAgents.length).to.equal(1);        
              expect(savedRequest.participatingBots.length).to.equal(0);
              expect(savedRequest.availableAgents.length).to.equal(1);
              
              // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
              // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

              expect(savedRequest.id_project).to.equal(savedProject._id.toString());

              // aiuto
              // expect(savedRequest.department).to.equal("requester_id1");
              done();
        }

        });
       requestService.createWithIdAndRequester("createWithIdAndCreateNewLeadAndCheckRequestEvent", savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
         
        }).catch(function(err) {
            console.log("test reject",err);
            assert.isNotOk(err,'Promise error');
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

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;
     projectService.createAndReturnProjectAndProjectUser("createWithIdAndCreatedBy", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;
      // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
       requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", null, null, null,null,null, "user1").then(function(savedRequest) {
          console.log("test resolve");
          expect(savedRequest.request_id).to.equal("request_id1");
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(200);
          expect(savedRequest.participants).to.contains(userid);
          expect(savedRequest.createdBy).to.equal("user1");
          
          // console.log("savedProject._id", savedProject._id, typeof savedProject._id);
          // console.log("savedRequest.id_project", savedRequest.id_project, typeof savedRequest.id_project);

          expect(savedRequest.id_project).to.equal(savedProject._id.toString());

          // aiuto
          // expect(savedRequest.department).to.equal("requester_id1");
          done();
        })
        .catch(function(err) {
            console.log("test reject",err);
            assert.isNotOk(err,'Promise error');
            done();
        });
    });
  });
  });




  it('createWithIdWithPooledDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

     projectService.createAndReturnProjectAndProjectUser("createWithIdWithPooledDepartment", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;
      departmentService.create("PooledDepartment-for-createWithIdWith", savedProject._id, 'pooled', userid).then(function(createdDepartment) {
       requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {
          winston.debug("resolve savedRequest");
          expect(savedRequest.request_id).to.equal("request_id1");
          expect(savedRequest.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
          expect(savedRequest.first_text).to.equal("first_text");
          expect(savedRequest.agents).to.have.lengthOf(1);
          expect(savedRequest.status).to.equal(100);
          expect(savedRequest.participants).to.have.lengthOf(0);          
          expect(savedRequest.id_project).to.equal(savedProject._id.toString());
          expect(savedRequest.department.toString()).to.equal(createdDepartment._id.toString());
          done();
        }).catch(function(err) {
          console.log("test reject",err);
            assert.isNotOk(err,'Promise error');
            done();
        });
    });
  });
  });
  });

 
  it('updageWaitingTimeRequest', function (done) {
    this.timeout(1000);
    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

    var messageSender = "5badfe5d553d1844ad654072";
    projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;
      requestService.createWithIdAndRequester("request_id-waitingTimeRequest", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function(savedRequest) {
          setTimeout(function () {
              Promise.all([
                messageService.create(messageSender, "test sender", savedRequest.request_id,  "hello1",
                savedProject._id, messageSender),
                messageService.create(messageSender, "test sender", savedRequest.request_id, "hello2",
                savedProject._id, messageSender)]).then(function(all) {
                  requestService.updateWaitingTimeByRequestId(savedRequest.request_id, savedProject._id).then(function(upRequest) {
                        winston.debug("resolve closedRequest", upRequest.toObject());
                        var maxWaitingTime  = Date.now() - upRequest.createdAt;
                        expect(upRequest.status).to.equal(200);
                        expect(upRequest.waiting_time).to.not.equal(null);
                        expect(upRequest.waiting_time).to.gte(500);
                        expect(upRequest.waiting_time).to.lte(maxWaitingTime);
                      
                        done();                         
                      }).catch(function(err){
                        winston.error("test reject", err);
                        assert.isNotOk(err,'Promise error');
                        done();
                      });
                  });
            }, 500);
        });
      });
  });
});







  it('closeRequest', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

      projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function(savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        requestService.createWithIdAndRequester("request_id-closeRequest",savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function(savedRequest) {
          Promise.all([
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id,  "hello1",
            savedProject._id, "5badfe5d553d1844ad654072"),
            messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
            savedProject._id, "5badfe5d553d1844ad654072")]).then(function(all) {
              requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {
                    winston.debug("resolve closedRequest", closedRequest.toObject());
                    expect(closedRequest.status).to.equal(1000);
                    expect(closedRequest.closed_at).to.not.equal(null);
                    expect(closedRequest.transcript).to.contains("hello1");
                    expect(closedRequest.transcript).to.contains("hello2");
                    done();                         
                  }).catch(function(err){
                    winston.error("test reject", err);
                    assert.isNotOk(err,'Promise error');
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

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

    projectService.createAndReturnProjectAndProjectUser("test1", userid, {email: {autoSendTranscriptToRequester:true}}).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;

     leadService.createIfNotExists("leadfullname", "andrea.leo@frontiere21.it", savedProject._id).then(function(createdLead) {
      requestService.createWithIdAndRequester("request_id-closeRequest", savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
        Promise.all([
          messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id,  "hello1",
          savedProject._id, "5badfe5d553d1844ad654072"),
          messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
          savedProject._id, "5badfe5d553d1844ad654072")]).then(function(all) {
            requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {
                  winston.debug("resolve closedRequest", closedRequest.toObject());
                  expect(closedRequest.status).to.equal(1000);
                  expect(closedRequest.closed_at).to.not.equal(null);
                  expect(closedRequest.transcript).to.contains("hello1");
                  expect(closedRequest.transcript).to.contains("hello2");
                  done();                         
                }).catch(function(err){
                  winston.error("test reject", err);
                  assert.isNotOk(err,'Promise error');
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

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

    projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;

      requestService.createWithIdAndRequester("request_id-reopenRequest", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {
        
            requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {
              requestService.reopenRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(reopenedRequest) {
                
                  winston.info("resolve reopenedRequest", reopenedRequest.toObject());

                  //check closedRequest
                  expect(closedRequest.status).to.equal(1000);
                  expect(closedRequest.closed_at).to.not.equal(null);      
                  expect(closedRequest.participants).to.have.lengthOf(1);          

                  //check reopenedRequest
                  expect(reopenedRequest.status).to.equal(200);
                  expect(reopenedRequest.closed_at).to.not.equal(null);      
                  expect(reopenedRequest.participants).to.have.lengthOf(1);          
                  
          
                  done();                         
                }).catch(function(err){
                  winston.error("test reject", err);
                  assert.isNotOk(err,'Promise error');
                  done();
                });
            });
          });
          });   
  });
});



  it('addparticipant', function (done) {

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
      var userid = savedUser.id;

  projectService.createAndReturnProjectAndProjectUser("addparticipant-project", userid).then(function(savedProjectAndPU) {
    var savedProject = savedProjectAndPU.project;
     requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function(savedRequest) {
       var member = 'agent1';
       requestService.addParticipantByRequestId(savedRequest.request_id, savedProject._id, member).then(function(savedRequestParticipant) {
        winston.info("resolve", savedRequestParticipant.toObject());
        expect(savedRequestParticipant.request_id).to.equal("request_id1");

        winston.info("savedProjectAndPU.project_user._id.toString():"+savedProjectAndPU.project_user._id.toString());
        expect(savedRequestParticipant.requester._id.toString()).to.equal(savedProjectAndPU.project_user._id.toString());

        expect(savedRequestParticipant.first_text).to.equal("first_text");
        expect(savedRequestParticipant.agents).to.have.lengthOf(1);
        expect(savedRequestParticipant.status).to.equal(200);
        expect(savedRequestParticipant.participants).to.have.lengthOf(2);
        expect(savedRequestParticipant.participants).to.contains(userid);
        expect(savedRequestParticipant.participants).to.contains(member);
        expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());

        done();
      }).catch(function(err) {
          console.log("test reject");
          assert.isNotOk(err,'Promise error');
          done();
      });
    });

    });
  });
});





it('removeparticipant', function (done) {

  var email = "test-request-create-" + Date.now() + "@email.com";
  var pwd = "pwd";

  userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    var userid = savedUser.id;

  projectService.createAndReturnProjectAndProjectUser("removeparticipant-project", userid).then(function(savedProjectAndPU) {
    var savedProject = savedProjectAndPU.project;
  
     requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function(savedRequest) {
       requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, userid).then(function(savedRequestParticipant) {
        winston.info("resolve", savedRequestParticipant.toObject());
        
        //savedRequest is assigned -> 200
        expect(savedRequest.status).to.equal(200);

        //savedRequestParticipant is unserved -> 100
        expect(savedRequestParticipant.request_id).to.equal("request_id1");
        // expect(savedRequestParticipant.requester.toString()).to.equal(savedProjectAndPU.project_user._id.toString());
        expect(savedRequestParticipant.first_text).to.equal("first_text");
        expect(savedRequestParticipant.agents).to.have.lengthOf(1);
        expect(savedRequestParticipant.status).to.equal(100);
        expect(savedRequestParticipant.participants).to.have.lengthOf(0);
        expect(savedRequestParticipant.id_project).to.equal(savedProject._id.toString());
        
        done();
      }).catch(function(err) {
          console.log("test reject");
          assert.isNotOk(err,'Promise error');
          done();
      });
    });
  });
});
});





it('closeRequestAndRemoveParticipant', function (done) {

  var email = "test-request-create-" + Date.now() + "@email.com";
  var pwd = "pwd";

  userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    var userid = savedUser.id;

  projectService.createAndReturnProjectAndProjectUser("test1", userid).then(function(savedProjectAndPU) {
    var savedProject = savedProjectAndPU.project;

    requestService.createWithIdAndRequester("request_id-closeRequestAndRemoveParticipant", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function(savedRequest) {
      Promise.all([
        messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id,  "hello1",
        savedProject._id, "5badfe5d553d1844ad654072"),
        messageService.create("5badfe5d553d1844ad654072", "test sender", savedRequest.request_id, "hello2",
        savedProject._id, "5badfe5d553d1844ad654072")]).then(function(all) {
          requestService.closeRequestByRequestId(savedRequest.request_id, savedProject._id).then(function(closedRequest) {
            expect(closedRequest.closed_at).to.not.equal(null);
            expect(closedRequest.transcript).to.contains("hello1");
            expect(closedRequest.transcript).to.contains("hello2");
            
            requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, userid).then(function(savedRequestParticipant) {
                winston.debug("resolve closeRequestAndRemoveParticipant", closedRequest.toObject());
                expect(savedRequestParticipant.status).to.equal(1000);
                
                done();                         
            });
          }).catch(function(err){
                winston.error("test reject", err);
                assert.isNotOk(err,'Promise error');
                done();
              });
          });
      });
    });
});
});


});