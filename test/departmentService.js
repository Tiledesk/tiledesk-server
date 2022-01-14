//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');
var roleConstants = require('../models/roleConstants');
var Project_user = require("../models/project_user");
var userService = require('../services/userService');
var departmentService = require('../services/departmentService');
var requestService = require('../services/requestService');
var routingConstants = require('../models/routingConstants');
var leadService = require('../services/leadService');

mongoose.connect(config.databasetest);
require('../services/mongoose-cache-fn')(mongoose);

var projectService = require('../services/projectService');





// var appRules = require('../rules/appRules');
// appRules.start();



describe('DepartmentService()', function () {

  it('createFirstWithAssignedDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-department-create" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    userService.signup( email+'2' ,pwd, "Test Firstname2", "Test lastname2").then(function(savedUser2) {
    userService.signup( email+'3' ,pwd, "Test Firstname3", "Test lastname3").then(function(savedUser3) {
    projectService.create("createWithAssignedDepartment", savedUser._id).then(function(savedProject) {



     var pu1 = new Project_user({
        // _id: new mongoose.Types.ObjectId(),
        id_project: savedProject._id,
        id_user: savedUser2._id,
        role: roleConstants.AGENT,
        user_available: true,
        createdBy: savedUser2._id,
        updatedBy: savedUser2._id,
      });
      pu1.save(function (err, savedProject_user2) {
        winston.debug("err",err);
        winston.debug("savedProject_user2", savedProject_user2.toObject());


        var pu2 =  new Project_user({
          // _id: new mongoose.Types.ObjectId(),
          id_project: savedProject._id,
          id_user: savedUser3._id,
          role: roleConstants.AGENT,
          user_available: true,
          createdBy: savedUser3._id,
          updatedBy: savedUser3._id,
        });

        pu2.save(function (err, savedProject_user3) {
          winston.debug("savedProject_user3", savedProject_user3.toObject());

          departmentService.create("PooledDepartment-for-createWithIdWith-createFirstWithAssignedDepartment", savedProject._id, routingConstants.ASSIGNED, savedUser._id).then(function(createdDepartment) {

            expect(createdDepartment.hasBot).to.equal(false);
            

          // requestService.createWithId("request_id1", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {

            // getOperators(departmentid, projectid, nobot) {
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult0) {
              winston.debug("resolve operatorsResult0", operatorsResult0); //time invariant?
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult) {
              winston.info("resolve operatorsResult", operatorsResult);

              expect(operatorsResult.department._id.toString()).to.equal(createdDepartment._id.toString());
              expect(operatorsResult.available_agents.length).to.equal(3);

              //time invariant?
              expect(operatorsResult0.available_agents[0]._id.toString()).to.equal(operatorsResult.available_agents[0]._id.toString());
              expect(operatorsResult0.available_agents[1]._id.toString()).to.equal(operatorsResult.available_agents[1]._id.toString());
              expect(operatorsResult0.available_agents[2]._id.toString()).to.equal(operatorsResult.available_agents[2]._id.toString());
              
              expect(operatorsResult.operators.length).to.equal(1);
              expect(operatorsResult.agents.length).to.equal(3);
              expect(operatorsResult.group).to.equal(undefined);
             
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



  it('createRoundRobinWithAssignedDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-department-create" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    userService.signup( email+'2' ,pwd, "Test Firstname2", "Test lastname2").then(function(savedUser2) {
    userService.signup( email+'3' ,pwd, "Test Firstname3", "Test lastname3").then(function(savedUser3) {
    // projectService.create("createWithAssignedDepartment", savedUser._id).then(function(savedProject) {
    projectService.createAndReturnProjectAndProjectUser("createWithAssignedDepartment", savedUser._id).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;



     var pu1 = new Project_user({
        // _id: new mongoose.Types.ObjectId(),
        id_project: savedProject._id,
        id_user: savedUser2._id,
        role: roleConstants.AGENT,
        user_available: true,
        createdBy: savedUser2._id,
        updatedBy: savedUser2._id,
      });
      pu1.save(function (err, savedProject_user2) {
        winston.debug("err",err);
        winston.debug("savedProject_user2", savedProject_user2.toObject());


        // var pu2 =  new Project_user({
        //   // _id: new mongoose.Types.ObjectId(),
        //   id_project: savedProject._id,
        //   id_user: savedUser3._id,
        //   role: roleConstants.AGENT,
        //   user_available: true,
        //   createdBy: savedUser3._id,
        //   updatedBy: savedUser3._id,
        // });

        // pu2.save(function (err, savedProject_user3) {
          // winston.debug("savedProject_user3", savedProject_user3.toObject());

          departmentService.create("PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedDepartment", savedProject._id, routingConstants.ASSIGNED, savedUser._id).then(function(createdDepartment) {



              leadService.createIfNotExists("request_id1-PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedDepartment", "email@getallWithLoLead.com", savedProject._id).then(function(createdLead) {      
          
              // winston.info("createdLead", createdLead.toObject());
                // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {
                  var now = Date.now();

          requestService.createWithIdAndRequester("request_id1-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest) {
            
          // requestService.createWithId("request_id1", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {

            // getOperators(departmentid, projectid, nobot) {
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult0) {
              winston.debug("resolve operatorsResult0", operatorsResult0); //time invariant?

              // requestService.createWithId("request_id2", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest2) {
              requestService.createWithIdAndRequester("request_id2-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest2) {

            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult) {
              winston.info("resolve operatorsResult", operatorsResult);

              expect(operatorsResult.department._id.toString()).to.equal(createdDepartment._id.toString());
              expect(operatorsResult.available_agents.length).to.equal(2);

              //time invariant?
              expect(operatorsResult0.available_agents[0]._id.toString()).to.equal(operatorsResult.available_agents[0]._id.toString());
              expect(operatorsResult0.available_agents[1]._id.toString()).to.equal(operatorsResult.available_agents[1]._id.toString());
              // expect(operatorsResult0.available_agents[2]._id.toString()).to.equal(operatorsResult.available_agents[2]._id.toString());                          

              expect(operatorsResult.agents.length).to.equal(2);
              expect(operatorsResult.group).to.equal(undefined);

              expect(operatorsResult0.operators[0].id_user.toString()).to.not.equal(savedRequest.participants[0].toString());
              expect(operatorsResult.operators[0].id_user.toString()).to.not.equal(savedRequest2.participants[0].toString());
              // expect(operatorsResult.operators[0].id_user.toString()).to.equal(savedRequest.participants[0].toString());
              
             
              done();
            });
        });
      });
      });
    });
      });
  // });
});
  });

});

    });
  });


  }).timeout(20000);



 // mocha test/departmentService.js  --grep 'createRoundRobinWithAssignedDepartmentNoBeforeRequestOneAgent'

  it('createRoundRobinWithAssignedDepartmentNoBeforeRequestOneAgent', function (done) {
    // this.timeout(10000);

    var email = "test-department-create" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    userService.signup( email+'2' ,pwd, "Test Firstname2", "Test lastname2").then(function(savedUser2) {
    userService.signup( email+'3' ,pwd, "Test Firstname3", "Test lastname3").then(function(savedUser3) {
    projectService.create("createWithAssignedDepartment", savedUser._id).then(function(savedProject) {

          departmentService.create("PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedDepartmentNoBeforeRequestOneAgent", savedProject._id, routingConstants.ASSIGNED, savedUser._id).then(function(createdDepartment) {

            // getOperators(departmentid, projectid, nobot) {
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult0) {
              winston.debug("resolve operatorsResult0", operatorsResult0); //time invariant?
                expect(operatorsResult0.operators[0].id_user.toString()).to.equal(savedUser._id.toString());
                done();
            });
          });
      
        });

});

    });
  });


  }).timeout(20000);







  it('createRoundRobinWithAssignedALLOFFLINEDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-department-create" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    userService.signup( email+'2' ,pwd, "Test Firstname2", "Test lastname2").then(function(savedUser2) {
    // projectService.create("createWithAssignedDepartment", savedUser._id).then(function(savedProject) {
    projectService.createAndReturnProjectAndProjectUser("createWithId-createWithAssignedDepartment", savedUser._id).then(function(savedProjectAndPU) {
      var savedProject = savedProjectAndPU.project;
      Project_user.findOneAndUpdate({id_project: savedProject._id,  id_user: savedUser._id,}, {user_available: false}, {new: true, upsert:false}, function(err, updatedProject_user) {
        winston.debug("updatedProject_user",updatedProject_user);

     var pu1 = new Project_user({
        id_project: savedProject._id,
        id_user: savedUser2._id,
        role: roleConstants.AGENT,
        user_available: false,
        createdBy: savedUser2._id,
        updatedBy: savedUser2._id,
      });
      pu1.save(function (err, savedProject_user2) {
        winston.debug("err",err);
        winston.debug("savedProject_user2", savedProject_user2.toObject());


        departmentService.create("PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedALLOFFLINEDepartment", savedProject._id, routingConstants.ASSIGNED, savedUser._id).then(function(createdDepartment) {
          // requestService.createWithIdAndRequester("request_id1-createRoundRobinWithAssignedALLOFFLINEDepartment", savedProjectAndPU.project_user._id, null, savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {
          // requestService.createWithId("request_id1", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {

          leadService.createIfNotExists("request_id1-PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedALLOFFLINEDepartment", "email@getallWithLoLead.com", savedProject._id).then(function(createdLead) {      
          
              // winston.info("createdLead", createdLead.toObject());
                // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {
                  var now = Date.now();
          requestService.createWithIdAndRequester("request_id1-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest) {
            

            // getOperators(departmentid, projectid, nobot) {
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult0) {
              winston.debug("resolve operatorsResult0", operatorsResult0); //time invariant?

              // requestService.createWithId("request_id2", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest2) {
                requestService.createWithIdAndRequester("request_id2-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest2) {

                departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult) {
                  winston.info("resolve operatorsResult", operatorsResult);

                  expect(operatorsResult.department._id.toString()).to.equal(createdDepartment._id.toString());
                  expect(operatorsResult.available_agents.length).to.equal(0);

          

                  expect(operatorsResult.agents.length).to.equal(2);
                  expect(operatorsResult.group).to.equal(undefined);

              
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

    });
  // });


  }).timeout(20000);







//   (node:74274) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'id_user' of undefined
//   at /Users/andrealeo/dev/chat21/tiledesk-server/services/requestService.js:55:56
//   at processTicksAndRejections (internal/process/next_tick.js:81:5)
// (node:74274) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)

  it('createRoundRobinWithAssignedLastOperatorNotAvailableAndOtherNotAvailableDepartment', function (done) {
    // this.timeout(10000);

    var email = "test-department-create" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    userService.signup( email+'2' ,pwd, "Test Firstname2", "Test lastname2").then(function(savedUser2) {
    projectService.createAndReturnProjectAndProjectUser("createWithAssignedDepartment", savedUser._id).then(function(savedProjectAndPU) {

      var savedProject = savedProjectAndPU.project;
      
  
      

     var pu1 = new Project_user({
        id_project: savedProject._id,
        id_user: savedUser2._id,
        role: roleConstants.AGENT,
        user_available: false,
        createdBy: savedUser2._id,
        updatedBy: savedUser2._id,
      });
      pu1.save(function (err, savedProject_user2) {
        winston.debug("err",err);
        winston.debug("savedProject_user2", savedProject_user2.toObject());


          departmentService.create("PooledDepartment-for-createWithIdWith-createRoundRobinWithAssignedLastOperatorNotAvailableAndOtherNotAvailableDepartment", savedProject._id, routingConstants.ASSIGNED, savedUser._id).then(function(createdDepartment) {
            var now = Date.now();
            leadService.createIfNotExists("request_id1-getallWithLoLead", "email@getallWithLoLead.com", savedProject._id).then(function(createdLead) {            
              requestService.createWithIdAndRequester("request_id1-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest) {

          // requestService.createWithId("request_id1", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest) {

            // getOperators(departmentid, projectid, nobot) {
            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult0) {
              winston.debug("resolve operatorsResult0", operatorsResult0); //time invariant?


              Project_user.findOneAndUpdate({id_project: savedProject._id,  id_user: savedUser._id,}, {user_available: false}, {new: true, upsert:false}, function(err, updatedProject_user) {
                winston.debug("updatedProject_user",updatedProject_user);


              // requestService.createWithId("request_id2", "requester_id1", savedProject._id, "first_text", createdDepartment._id).then(function(savedRequest2) {
                requestService.createWithIdAndRequester("request_id2-"+now, savedProjectAndPU.project_user._id,createdLead._id, savedProject._id, "first_text",createdDepartment._id).then(function(savedRequest2) {

            departmentService.getOperators(createdDepartment._id, savedProject._id, false).then(function(operatorsResult) {
              winston.info("resolve operatorsResult", operatorsResult);

              expect(operatorsResult.department._id.toString()).to.equal(createdDepartment._id.toString());
              expect(operatorsResult.available_agents.length).to.equal(0);

       

              expect(operatorsResult.agents.length).to.equal(2);
              expect(operatorsResult.group).to.equal(undefined);

          
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

    });
  // });


  }).timeout(20000);





});
