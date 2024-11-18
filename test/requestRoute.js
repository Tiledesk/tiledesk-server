//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');

var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');
var leadService = require('../services/leadService');


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var winston = require('../config/winston');

var Department = require('../models/department');
var faqService = require('../services/faqService');
// require('../services/mongoose-cache-fn')(mongoose);

// chai.config.includeStack = true;

let log = false;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('RequestRoute', () => {



  // mocha test/requestRoute.js  --grep 'createSimple'

  it('createSimple', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {


        chai.request(server)
          .post('/' + savedProject._id + '/requests/')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (err) { console.error("err: ",  err); }
            if (log) { console.log("res.body",  res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.snapshot.agents.length).to.equal(1);
            // res.body.should.have.property('request_id').eql('request_id');
            // res.body.should.have.property('requester_id').eql('requester_id');
            res.body.should.have.property('first_text').eql('first_text');
            res.body.should.have.property('id_project').eql(savedProject._id.toString());
            res.body.should.have.property('createdBy').eql(savedUser._id.toString());

            // res.body.should.have.property('messages_count').gt(0);

            res.body.should.have.property('status').eql(200);

            // res.body.should.have.property('agents').eql(savedUser._id);
            expect(res.body.snapshot.agents.length).to.equal(1);
            expect(res.body.participants.length).to.equal(1);

            expect(res.body.participantsAgents.length).to.equal(1);
            expect(res.body.participantsBots).to.have.lengthOf(0);
            expect(res.body.hasBot).to.equal(false);

            res.body.should.have.property('department').not.eql(null);
            // res.body.should.have.property('lead').eql(undefined);


            done();
          });
      });
    });
  });

  it('create-simple-new-note', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {


        chai.request(server)
          .post('/' + savedProject._id + '/requests/')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body",  res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            let request_id = res.body.request_id;
            chai.request(server)
                .post('/' + savedProject._id + '/requests/' + request_id + "/notes")
                .auth(email, pwd)
                .send({ text: "test note 1"})
                .end((err, res) => {

                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("res.body",  res.body); }

                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.notes.length).to.equal(1);
                  expect(res.body.notes[0].text).to.equal("test note 1");
                  expect(res.body.notes[0].createdBy).to.equal(savedUser._id.toString());
                  
                  done();
                  // Project_user.findOneAndUpdate({id_project: savedProject._id, id_user: savedUser._id }, { role: RoleConstants.AGENT }, function(err, savedProject_user){
                  //   done();
                  // })
                })

          });
      });
    });
  });


  it('createSimpleAndCloseForDuration', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {

        chai.request(server)
          .post('/' + savedProject._id + '/requests/')
          .auth(email, pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {
            
            if (err) { console.error("err: ",  err); }
            if (log) { console.log("res.body",  res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            setTimeout(() => {

              chai.request(server)
                  .put('/' + savedProject._id + '/requests/' + res.body.request_id + '/close')
                  .auth(email, pwd)
                  .send()
                  .end((err, res) => {
  
                    if (err) { console.error("err: ",  err); }
                    if (log) { 
                      console.log("res.body",  res.body); 
                      console.log("request duration: ", res.body.duration)
                    }

                    res.body.should.have.property('duration');
                    res.body.duration.should.be.above(2000);
  
                    done();
                  })

            }, 2000)

          });
      });
    });
  }).timeout(5000);




  it('createUpperCaseEmail', function (done) {
    // this.timeout(10000);

    var now = Date.now();
    var email = "test-REQUEST-create-" + now + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("request-create", savedUser._id).then(function (savedProject) {


        chai.request(server)
          .post('/' + savedProject._id + '/requests/')
          .auth("test-request-create-" + now + "@email.com", pwd)
          .set('content-type', 'application/json')
          .send({ "first_text": "first_text" })
          .end(function (err, res) {
            
            if (err) { console.error("err: ",  err); }
            if (log) { console.log("res.body",  res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            expect(res.body.snapshot.agents.length).to.equal(1);
            // res.body.should.have.property('request_id').eql('request_id');
            // res.body.should.have.property('requester_id').eql('requester_id');
            res.body.should.have.property('first_text').eql('first_text');
            res.body.should.have.property('id_project').eql(savedProject._id.toString());
            res.body.should.have.property('createdBy').eql(savedUser._id.toString());

            // res.body.should.have.property('messages_count').gt(0);

            res.body.should.have.property('status').eql(200);

            // res.body.should.have.property('agents').eql(savedUser._id);
            expect(res.body.snapshot.agents.length).to.equal(1);
            expect(res.body.participants.length).to.equal(1);

            expect(res.body.participantsAgents.length).to.equal(1);
            expect(res.body.participantsBots).to.have.lengthOf(0);
            expect(res.body.hasBot).to.equal(false);

            res.body.should.have.property('department').not.eql(null);
            // res.body.should.have.property('lead').eql(undefined);


            done();
          });
      });
    });
  });




  // mocha test/requestRoute.js  --grep 'getbyid'
  it('getbyid', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;
        var now = Date.now();

        // leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
        // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
        //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
        requestService.createWithIdAndRequester("request_requestroute-getbyid-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
          winston.debug("resolve", savedRequest.toObject());


          chai.request(server)
            .get('/' + savedProject._id + '/requests/' + savedRequest.request_id)
            .auth(email, pwd)
            .end(function (err, res) {
              
              if (err) { console.error("err: ",  err); }
              if (log) { console.log("res.body",  res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');

              res.body.should.have.property('department').not.eql(null);
              // res.body.should.have.property('lead').eql(null);
              res.body.should.have.property('request_id').eql("request_requestroute-getbyid-" + now);
              res.body.should.have.property('requester').not.eql(null);

              expect(res.body.participantsAgents.length).to.equal(1);
              expect(res.body.participantsBots).to.have.lengthOf(0);
              expect(res.body.hasBot).to.equal(false);

              expect(res.body.participatingAgents.length).to.equal(1);
              expect(res.body.participatingBots.length).to.equal(0);

              expect(res.body.participatingAgents.length).to.equal(1);
              expect(res.body.participatingBots).to.have.lengthOf(0);

              expect(res.body.requester._id).to.not.equal(savedProjectAndPU.project_user._id);
              expect(res.body.requester.isAuthenticated).to.equal(true);

              expect(res.body.snapshot.agents).to.equal(undefined);

              done();
            });
          // .catch(function(err) {
          //     console.log("test reject", err);
          //     assert.isNotOk(err,'Promise error');
          //     done();
          // });
          // });
        });
      });
    });
  });
  // mocha test/requestRoute.js  --grep 'getbyidWithPartecipatingBots'

  it('getbyidWithPartecipatingBots', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;


        faqService.create("testbot", null, savedProject._id, savedUser._id, "internal").then(function (savedBot) {



          Department.findOneAndUpdate({ id_project: savedProject._id, default: true }, { id_bot: savedBot._id }, { new: true, upsert: false }, function (err, updatedDepartment) {

            winston.error("err", err);
            winston.info("updatedDepartment", updatedDepartment.toObject());
            var now = Date.now();


            // leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
            //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            requestService.createWithIdAndRequester("request_requestroute-getbyidWithPartecipatingBots-" + now, savedProjectAndPU.project_user._id, null, savedProject._id, "first_text").then(function (savedRequest) {
              winston.debug("resolve", savedRequest.toObject());


              chai.request(server)
                .get('/' + savedProject._id + '/requests/' + savedRequest.request_id)
                .auth(email, pwd)
                .end(function (err, res) {
                  
                  if (err) { console.error("err: ",  err); }
                  if (log) { console.log("res.body",  res.body); }

                  res.should.have.status(200);
                  res.body.should.be.a('object');

                  res.body.should.have.property('department').not.eql(null);

                  // res.body.should.have.property('lead').eql(null);
                  res.body.should.have.property('request_id').eql("request_requestroute-getbyidWithPartecipatingBots-" + now);
                  res.body.should.have.property('requester').not.eql(null);
                  expect(res.body.requester._id).to.not.equal(savedProjectAndPU.project_user._id);

                  expect(res.body.participatingAgents.length).to.equal(0);
                  expect(res.body.participatingBots.length).to.equal(1);

                  expect(res.body.participantsAgents.length).to.equal(0);
                  expect(res.body.participantsBots).to.have.lengthOf(1);
                  expect(res.body.hasBot).to.equal(true);

                  expect(res.body.snapshot.agents).to.equal(undefined);
                  expect(res.body.department.hasBot).to.equal(true);

                  done();
                });
              // .catch(function(err) {
              //     console.log("test reject", err);
              //     assert.isNotOk(err,'Promise error');
              //     done();
              // });
              // });
            });
          });
        });
      });
    });
  });


  // mocha test/requestRoute.js  --grep 'getallSimple'

  it('getallSimple', function (done) {
    // this.timeout(10000);

    var email = "test-getallsimple-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      if (log) { console.log("savedUser", savedUser); }

      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        if (log) { console.log("savedProjectAndPU", savedProjectAndPU); }

        leadService.createIfNotExists("leadfullname", "email-getallSimple@email.com", savedProject._id).then(function (createdLead) {

          if (log) { console.log("createdLead", createdLead); }

          var now = Date.now();

          var new_request = {
            request_id: "request_id-getallSimple-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };



          requestService.create(new_request).then(function (savedRequest) {

            if (log) { console.log("savedRequest", savedRequest); }

            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
            //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            // requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].requester).to.not.equal(null);
                if (log) { console.log("res.body.requests[0].requester", res.body.requests[0].requester); }

                expect(res.body.requests[0].requester.id_user.firstname).to.equal("Test Firstname");

                expect(res.body.requests[0].participantsAgents.length).to.equal(1);
                expect(res.body.requests[0].participantsBots).to.have.lengthOf(0);
                expect(res.body.requests[0].hasBot).to.equal(false);
                expect(res.body.requests[0].snapshot).to.not.equal(undefined);
                expect(res.body.requests[0].snapshot.department.name).to.not.equal(null);
                // expect(res.body.requests[0].snapshot.agents.length).to.equal(1);
                expect(res.body.requests[0].snapshot.availableAgentsCount).to.equal(1);
                expect(res.body.requests[0].snapshot.lead.fullname).to.equal("leadfullname");
                expect(res.body.requests[0].snapshot.requester.role).to.equal("owner");
                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);

                // expect(res.body.requests[0].participatingAgents.length).to.equal(1);        
                // expect(res.body.requests[0].participatingBots.length).to.equal(0);
                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });



  // mocha test/requestRoute.js  --grep 'getallNoPopulate'

  it('getallNoPopulate', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("createWithId-getallNoPopulate", savedUser._id).then(function (savedProjectAndPU) {
        var savedProject = savedProjectAndPU.project;


        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
          // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
          //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          var now = Date.now();

          var request = {
            request_id: "request_getallNoPopulate-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };



          requestService.create(request).then(function (savedRequest) {

            // requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/?no_populate=true')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                // assert.isString(res.body.requests[0].department, 'order placed');

                expect(res.body.requests[0].department).to.be.a('string');
                expect(res.body.requests[0].requester).to.be.a('string');
                // console.log("res.body.requests[0].requester",  res.body.requests[0].requester);
                // expect(res.body.requests[0].requester.id_user.firstname).to.equal("Test Firstname");

                if (log) { console.log("res.body.requests[0].participantsAgents", res.body.requests[0].participantsAgents); }
                expect(res.body.requests[0].participantsAgents).to.have.lengthOf(1);
                expect(res.body.requests[0].participantsAgents[0]).to.equal(savedUser._id.toString());
                expect(res.body.requests[0].participantsBots).to.have.lengthOf(0);
                expect(res.body.requests[0].hasBot).to.equal(false);

                expect(res.body.requests[0].snapshot).to.not.equal(undefined);
                expect(res.body.requests[0].snapshot.department.name).to.not.equal(null);
                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);
                // expect(res.body.requests[0].snapshot.agents.length).to.equal(1);
                // expect(res.body.requests[0].test).to.not.equal(undefined);
                // expect(res.body.requests[0].participatingAgents.length).to.equal(1);        
                // expect(res.body.requests[0].participatingBots.length).to.equal(0);
                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
            // });
          });
        });
      });
    });
  });





  // mocha test/requestRoute.js  --grep 'getallSimple'

  it('getallFilter-snap_department_routing', function (done) {
    // this.timeout(10000);

    var email = "test-getallfilter-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      if (log) { console.log("savedUser", savedUser); }

      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        if (log) { console.log("savedProjectAndPU", savedProjectAndPU); }

        leadService.createIfNotExists("leadfullname", "email-getallfilter@email.com", savedProject._id).then(function (createdLead) {

          if (log) { console.log("createdLead", createdLead); }
          var now = Date.now();


          var new_request = {
            request_id: "request_id-getallFilter-snap_department_routing-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };



          requestService.create(new_request).then(function (savedRequest) {

            if (log) { console.log("savedRequest", savedRequest); }

            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
            //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            // requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/?snap_department_routing=assigned')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].requester).to.not.equal(null);
                if (log) { console.log("res.body.requests[0].requester", res.body.requests[0].requester); }

                expect(res.body.requests[0].requester.id_user.firstname).to.equal("Test Firstname");

                expect(res.body.requests[0].participantsAgents.length).to.equal(1);
                expect(res.body.requests[0].participantsBots).to.have.lengthOf(0);
                expect(res.body.requests[0].hasBot).to.equal(false);
                expect(res.body.requests[0].snapshot).to.not.equal(undefined);
                expect(res.body.requests[0].snapshot.department.name).to.not.equal(null);
                // expect(res.body.requests[0].snapshot.agents.length).to.equal(1);
                expect(res.body.requests[0].snapshot.availableAgentsCount).to.equal(1);
                expect(res.body.requests[0].snapshot.lead.fullname).to.equal("leadfullname");
                expect(res.body.requests[0].snapshot.requester.role).to.equal("owner");
                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);
                // expect(res.body.requests[0].participatingAgents.length).to.equal(1);        
                // expect(res.body.requests[0].participatingBots.length).to.equal(0);
                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });




  // mocha test/requestRoute.js  --grep 'getallFilter-snap_department_default'

  it('getallFilter-snap_department_default', function (done) {
    // this.timeout(10000);

    var email = "test-getallfilter-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      if (log) { console.log("savedUser", savedUser); }

      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        if (log) { console.log("savedProjectAndPU", savedProjectAndPU); }

        leadService.createIfNotExists("leadfullname", "email-getallfilter@email.com", savedProject._id).then(function (createdLead) {

          if (log) { console.log("createdLead", createdLead); }

          var now = Date.now();

          var new_request = {
            request_id: "request_id-getallFilter-snap_department_routing-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };



          requestService.create(new_request).then(function (savedRequest) {

            if (log) { console.log("savedRequest", savedRequest); }

            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
            //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            // requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/?snap_department_default=true')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].requester).to.not.equal(null);
                if (log) { console.log("res.body.requests[0].requester", res.body.requests[0].requester); }

                expect(res.body.requests[0].requester.id_user.firstname).to.equal("Test Firstname");

                expect(res.body.requests[0].participantsAgents.length).to.equal(1);
                expect(res.body.requests[0].participantsBots).to.have.lengthOf(0);
                expect(res.body.requests[0].hasBot).to.equal(false);
                expect(res.body.requests[0].snapshot).to.not.equal(undefined);
                expect(res.body.requests[0].snapshot.department.name).to.not.equal(null);
                // expect(res.body.requests[0].snapshot.agents.length).to.equal(1);
                expect(res.body.requests[0].snapshot.availableAgentsCount).to.equal(1);
                expect(res.body.requests[0].snapshot.lead.fullname).to.equal("leadfullname");
                expect(res.body.requests[0].snapshot.requester.role).to.equal("owner");
                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);
                // expect(res.body.requests[0].participatingAgents.length).to.equal(1);        
                // expect(res.body.requests[0].participatingBots.length).to.equal(0);
                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });




  // mocha test/requestRoute.js  --grep 'snap_department_id_bot_exists'

  it('getallFilter-snap_department_id_bot_exists', function (done) {
    // this.timeout(10000);

    var email = "test-getallfilter-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      if (log) { console.log("savedUser", savedUser); }

      projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;

        if (log) { console.log("savedProjectAndPU", savedProjectAndPU); }

        leadService.createIfNotExists("leadfullname", "email-getallfilter@email.com", savedProject._id).then(function (createdLead) {

          if (log) { console.log("createdLead", createdLead); }

          var now = Date.now();

          var new_request = {
            request_id: "request_id-getallFilter-snap_department_id_bot_exists-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
            id_project: savedProject._id, first_text: "first_text",
            lead: createdLead, requester: savedProjectAndPU.project_user
          };



          requestService.create(new_request).then(function (savedRequest) {

            if (log) { console.log("savedRequest", savedRequest); }

            // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
            //  requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
            // requestService.createWithIdAndRequester("request_id1", savedProjectAndPU.project_user._id, null,savedProject._id, "first_text").then(function(savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/?snap_department_id_bot_exists=false')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].requester).to.not.equal(null);
                if (log) { console.log("res.body.requests[0].requester", res.body.requests[0].requester); }

                expect(res.body.requests[0].requester.id_user.firstname).to.equal("Test Firstname");

                expect(res.body.requests[0].participantsAgents.length).to.equal(1);
                expect(res.body.requests[0].participantsBots).to.have.lengthOf(0);
                expect(res.body.requests[0].hasBot).to.equal(false);
                expect(res.body.requests[0].snapshot).to.not.equal(undefined);
                expect(res.body.requests[0].snapshot.department.name).to.not.equal(null);
                // expect(res.body.requests[0].snapshot.agents.length).to.equal(1);
                expect(res.body.requests[0].snapshot.availableAgentsCount).to.equal(1);
                expect(res.body.requests[0].snapshot.lead.fullname).to.equal("leadfullname");
                expect(res.body.requests[0].snapshot.requester.role).to.equal("owner");

                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);
                // expect(res.body.requests[0].participatingAgents.length).to.equal(1);        
                // expect(res.body.requests[0].participatingBots.length).to.equal(0);
                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });


  // mocha test/requestRoute.js  --grep 'getallcsv'
  it('getallcsv', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.createAndReturnProjectAndProjectUser("getallcsv", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;
        leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {

          winston.info("createdLead", createdLead.toObject());
          // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {
          var now = Date.now();

          requestService.create({
            request_id: "request_id-getallcsv-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id, id_project: savedProject._id,
            first_text: "first_text", tags: [{ tag: "tag1" }, { tag: "tag2" }]
          }).then(function (savedRequest) {
            winston.info("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/csv/')
              .auth(email, pwd)
              .end(function (err, res) {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.text", res.text); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });





  it('getallWithLoLead', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

      projectService.createAndReturnProjectAndProjectUser("getallcsv", savedUser._id).then(function (savedProjectAndPU) {

        var savedProject = savedProjectAndPU.project;
        leadService.createIfNotExists("request_id1-getallWithLoLead", "email@getallWithLoLead.com", savedProject._id).then(function (createdLead) {

          winston.info("createdLead", createdLead.toObject());
          // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel, location) {
          var now = Date.now();

          requestService.createWithIdAndRequester("request_id-getallWithLoLead-" + now, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {

            winston.debug("resolve", savedRequest.toObject());


            chai.request(server)
              .get('/' + savedProject._id + '/requests/')
              .auth(email, pwd)
              .end(function (err, res) {
                
                if (err) { console.error("err: ",  err); }
                if (log) { console.log("res.body",  res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].lead).to.not.equal(null);

                expect(res.body.requests[0].snapshot.agents).to.equal(undefined);

                done();
              });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
          });
        });
      });
    });
  });


  describe('/assign', () => {




    // mocha test/requestRoute.js  --grep 'createAndReassign'

    it('createAndReassign', function (done) {
      // this.timeout(10000);

      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("request-create", savedUser._id).then(function (savedProject) {


          chai.request(server)
            .post('/' + savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "first_text": "first_text" })
            .end(function (err, res) {
              
              if (err) { console.error("err: ",  err); }
              if (log) { console.log("res.body",  res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');

              expect(res.body.snapshot.agents.length).to.equal(1);
              // res.body.should.have.property('request_id').eql('request_id');
              // res.body.should.have.property('requester_id').eql('requester_id');
              res.body.should.have.property('first_text').eql('first_text');
              res.body.should.have.property('id_project').eql(savedProject._id.toString());
              res.body.should.have.property('createdBy').eql(savedUser._id.toString());

              // res.body.should.have.property('messages_count').gt(0);

              res.body.should.have.property('status').eql(200);

              // res.body.should.have.property('agents').eql(savedUser._id);
              expect(res.body.snapshot.agents.length).to.equal(1);
              expect(res.body.participants.length).to.equal(1);

              expect(res.body.participantsAgents.length).to.equal(1);
              expect(res.body.participantsBots).to.have.lengthOf(0);
              expect(res.body.hasBot).to.equal(false);

              res.body.should.have.property('department').not.eql(null);
              // res.body.should.have.property('lead').eql(undefined);

              if (log) { console.log("res.body.request_id: " + res.body.request_id); }

              chai.request(server)
                .put('/' + savedProject._id + '/requests/' + res.body.request_id + "/departments")
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({})
                .end(function (err, res2) {
                  
                  if (err) { console.error("err: ",  err); }
                  if (log) { console.log("res.body",  res.body); }

                  res2.should.have.status(200);
                  res2.body.should.be.a('object');
                  expect(res.body.participants.length).to.equal(1);
                  expect(res.body.participantsAgents.length).to.equal(1);
                  expect(res.body.participantsBots.length).to.equal(0);


                  // expect(res.body.snapshot.agents).to.equal(undefined);    

                  res2.body.requester.should.be.a('object');
                  res2.body.lead.should.be.a('object');
                  // expect(res.body.requester).to.equal(undefined);                
                  // expect(res.body.lead).to.equal(undefined);                

                  done();
                });

            });
        });
      });
    });



    // mocha test/requestRoute.js  --grep 'createAndReassignAndNoPopulate'

    it('createAndReassignAndNoPopulate', function (done) {
      // this.timeout(10000);

      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("request-create", savedUser._id).then(function (savedProject) {


          chai.request(server)
            .post('/' + savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "first_text": "first_text" })
            .end(function (err, res) {
              
              if (err) { console.error("err: ",  err); }
              if (log) { console.log("res.body",  res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');

              expect(res.body.snapshot.agents.length).to.equal(1);
              // res.body.should.have.property('request_id').eql('request_id');
              // res.body.should.have.property('requester_id').eql('requester_id');
              res.body.should.have.property('first_text').eql('first_text');
              res.body.should.have.property('id_project').eql(savedProject._id.toString());
              res.body.should.have.property('createdBy').eql(savedUser._id.toString());

              // res.body.should.have.property('messages_count').gt(0);

              res.body.should.have.property('status').eql(200);

              // res.body.should.have.property('agents').eql(savedUser._id);
              expect(res.body.snapshot.agents.length).to.equal(1);
              expect(res.body.participants.length).to.equal(1);

              expect(res.body.participantsAgents.length).to.equal(1);
              expect(res.body.participantsBots).to.have.lengthOf(0);
              expect(res.body.hasBot).to.equal(false);

              res.body.should.have.property('department').not.eql(null);
              // res.body.should.have.property('lead').eql(undefined);

              if (log) { console.log("res.body.request_id: " + res.body.request_id); }

              chai.request(server)
                .put('/' + savedProject._id + '/requests/' + res.body.request_id + "/departments")
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({ "no_populate": "true" })
                .end(function (err, res2) {
                  
                  if (err) { console.error("err: ",  err); }
                  if (log) { console.log("res.body",  res.body); }

                  res2.should.have.status(200);
                  res2.body.should.be.a('object');
                  expect(res.body.participants.length).to.equal(1);
                  expect(res.body.participantsAgents.length).to.equal(1);
                  expect(res.body.participantsBots.length).to.equal(0);

                  // expect(res.body.snapshot.agents).to.equal(undefined);    

                  res2.body.requester.should.be.a('string');
                  res2.body.lead.should.be.a('string');
                  // expect(res.body.requester).to.equal(undefined);                
                  // expect(res.body.lead).to.equal(undefined);                

                  done();
                });

            });
        });
      });
    });



    // mocha test/requestRoute.js  --grep 'createAndAssign2'

    it('createAndAssign2', function (done) {
      // this.timeout(10000);

      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("request-create", savedUser._id).then(function (savedProject) {


          chai.request(server)
            .post('/' + savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "first_text": "first_text" })
            .end(function (err, res) {
              
              if (err) { console.error("err: ",  err); }
              if (log) { console.log("res.body",  res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');

              expect(res.body.snapshot.agents.length).to.equal(1);
              // res.body.should.have.property('request_id').eql('request_id');
              // res.body.should.have.property('requester_id').eql('requester_id');
              res.body.should.have.property('first_text').eql('first_text');
              res.body.should.have.property('id_project').eql(savedProject._id.toString());
              res.body.should.have.property('createdBy').eql(savedUser._id.toString());

              // res.body.should.have.property('messages_count').gt(0);

              res.body.should.have.property('status').eql(200);

              // res.body.should.have.property('agents').eql(savedUser._id);
              expect(res.body.snapshot.agents.length).to.equal(1);
              expect(res.body.participants.length).to.equal(1);

              expect(res.body.participantsAgents.length).to.equal(1);
              expect(res.body.participantsBots).to.have.lengthOf(0);
              expect(res.body.hasBot).to.equal(false);

              res.body.should.have.property('department').not.eql(null);
              // res.body.should.have.property('lead').eql(undefined);

              if (log) { console.log("res.body.request_id: " + res.body.request_id); }

              chai.request(server)
                .put('/' + savedProject._id + '/requests/' + res.body.request_id + "/assign")
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({})
                .end(function (err, res2) {
                  
                  if (err) { console.error("err: ",  err); }
                  if (log) { console.log("res.body",  res.body); }

                  res2.should.have.status(200);
                  res2.body.should.be.a('object');
                  expect(res.body.participants.length).to.equal(1);
                  expect(res.body.participantsAgents.length).to.equal(1);
                  expect(res.body.participantsBots.length).to.equal(0);

                  // expect(res.body.snapshot.agents).to.equal(undefined);    

                  res2.body.requester.should.be.a('string');
                  res2.body.lead.should.be.a('string');
                  // expect(res.body.requester).to.equal(undefined);                
                  // expect(res.body.lead).to.equal(undefined);                

                  done();
                });

            });
        });
      });
    });



    // mocha test/requestRoute.js  --grep 'removeParticipant'
    it('removeParticipant', function (done) {
      // this.timeout(10000);

      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.createAndReturnProjectAndProjectUser("request-removeParticipant", savedUser._id).then(function (savedProjectAndPU) {
          var savedProject = savedProjectAndPU.project;

          leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
            winston.info("savedProjectAndPU.project_user._id:" + savedProjectAndPU.project_user._id);

            var now = Date.now();

            //  projectService.create("request-removeParticipant", savedUser._id).then(function(savedProject) {
            // requestService.removeParticipantByRequestId(savedRequest.request_id, savedProject._id, userid).then(function(savedRequestParticipant) {
            var request = {
              request_id: "request_id1-removeParticipant-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
              id_project: savedProject._id, first_text: "first_text",
              lead: createdLead, requester: savedProjectAndPU.project_user
            };

            requestService.create(request).then(function (savedRequest) {
              winston.info("savedRequest", savedRequest.toObject());
              expect(savedRequest.request_id).to.equal("request_id1-removeParticipant-" + now);

              chai.request(server)
                .delete('/' + savedProject._id + '/requests/' + 'request_id1-removeParticipant-' + now + "/participants/" + savedUser._id)
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({ "text": "first_text" })
                .end(function (err, res) {
                  
                  if (err) { console.error("err: ",  err); }
                  if (log) { console.log("res.body",  res.body); }

                  res.should.have.status(200);
                  res.body.should.be.a('object');

                  // expect(res.body.snapshot.agents.length).to.equal(1);
                  // res.body.should.have.property('request_id').eql('request_id');
                  // res.body.should.have.property('requester_id').eql('requester_id');
                  res.body.should.have.property('first_text').eql('first_text');
                  res.body.should.have.property('id_project').eql(savedProject._id.toString());
                  // res.body.should.have.property('createdBy').eql(savedUser._id.toString()); ?? expected '607ef36a2d060d79dc83ac9f' to deeply equal '607ef3692d060d79dc83ac9d'

                  // res.body.should.have.property('messages_count').gt(0);

                  res.body.should.have.property('status').eql(100);

                  // res.body.should.have.property('agents').eql(savedUser._id);
                  // expect(res.body.snapshot.agents.length).to.equal(1);
                  expect(res.body.participants.length).to.equal(0);

                  expect(res.body.participantsAgents.length).to.equal(0);
                  expect(res.body.participantsBots).to.have.lengthOf(0);
                  expect(res.body.hasBot).to.equal(false);
                  winston.info("res.body.attributes.abandoned_by_project_users", res.body.attributes.abandoned_by_project_users);
                  expect(res.body.attributes.abandoned_by_project_users[savedProjectAndPU.project_user._id]).to.not.equal(undefined);
                  expect(res.body.snapshot.agents).to.equal(undefined);

                  res.body.should.have.property('department').not.eql(null);
                  // res.body.should.have.property('lead').eql(undefined);


                  done();
                });
            });
          });
        });
      });
    });

    it('exludeDraftConversations', (done) => {

      var email = "test-signup-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        projectService.createAndReturnProjectAndProjectUser("test-draft-conversation", savedUser._id).then((savedProjectAndPU) => {
          let savedProject = savedProjectAndPU.project;
          let savedPU = savedProjectAndPU.project_user;
          leadService.createIfNotExists("Lead Fullname", "email@test.com", savedProject._id).then((createdLead) => {
            let now = Date.now();
            let request = {
              request_id: "request_id-exludeDraftConversations-" + now, 
              project_user_id: savedPU._id,
              lead_id: createdLead._id,
              id_project: savedProject._id,
              first_text: "first_text",
              lead: createdLead,
              requester: savedPU,
              attributes: { sourcePage: "https://widget-pre.tiledesk.com/v2/index.html?tiledesk_projectid=5ce3d1ceb25ad30017279999&td_draft=true" }
            }

            requestService.create(request).then(async (savedRequest) => {
              
              // Case 1 - request with source page that contains td_draft
              expect(savedRequest.draft).to.equal(true);

              // Case 2 - request without source page that contains td_draft
              //expect(savedRequest.draft).to.be.undefined;

              // get all requests -> should be 0

              chai.request(server)
                  .get('/' + savedProject._id + '/requests?draft=false')
                  .auth(email, pwd)
                  .end((err, res) => {

                    if (err) { console.error("err: ", err ) };
                    if (log) { console.log("res.body: ", res.body) }

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.requests.should.be.a('array');

                    // Case 1 - request with source page that contains td_draft
                    expect(res.body.requests.length).to.equal(0);

                    // Case 2 - request without source page that contains td_draft
                    //expect(res.body.requests.length).to.equal(1);

                    done();
                  })


            }).catch((err) => {
              console.error("error creating request: ", err)
            })
          })

        })
      })

    })

    it('countConversations', function (done) {
      // this.timeout(10000);
  
      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";
  
      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {
  
          chai.request(server)
            .post('/' + savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "first_text": "first_text" })
            .end(function (err, res) {

              if (err) { console.log("err: ", err) };
              if (log) { console.log("res.body: ", res.body) };

              res.should.have.status(200);
              res.body.should.be.a('object');
              
              chai.request(server)
                  .get('/' + savedProject._id + '/requests/count?conversation_quota=true')
                  .auth(email, pwd)
                  .end((err, res) => {

                    if (err) { console.log("err: ", err) };
                    if (log) { console.log("res.body: ", res.body) };

                    res.should.have.status(200);

                    done();
                  })
          
            });
        });
      });
    });

    // it('assign', (done) => {


    // //   this.timeout();

    //    var email = "test-signup-" + Date.now() + "@email.com";
    //    var pwd = "pwd";

    //     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //         projectService.create("test-join-member", savedUser._id).then(function(savedProject) {
    //             requestService.createWithId("join-member", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {

    //                 var webhookContent =     { "assignee": 'assignee-member'}


    //                 chai.request(server)
    //                     .post('/'+ savedProject._id + '/requests/' + savedRequest.request_id + '/assign')
    //                     .auth(email, pwd)
    //                     .send(webhookContent)
    //                     .end((err, res) => {
    //                         //console.log("res",  res);
    //                         console.log("res.body",  res.body);
    //                         res.should.have.status(200);
    //                         res.body.should.be.a('object');
    //                         // res.body.should.have.property('status').eql(200);


    //                         // res.body.should.have.property('participants').to.have.lengthOf(2);
    //                         // res.body.should.have.property('participants').contains("agentid1");
    //                         // res.body.should.have.property('participants').contains(savedUser._id);

    //                         done();
    //                     });


    //             });
    //             });
    //             });
    // }).timeout(20000);


    /*
    it('requestParameterFromChatbot', function (done) {
      // this.timeout(10000);
  
      var email = "test-request-create-" + Date.now() + "@email.com";
      var pwd = "pwd";
  
      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {
  
          chai.request(server)
            .post('/' + savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({ "first_text": "first_text" })
            .end(function (err, res) {
              //console.log("res",  res);
              //console.log("res.body",  res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
  
              console.log("body: ", res.body);
              let request_id = res.body.request_id;

              console.log("request_id: ", request_id);

              chai.request(server)
                  .get('/' + savedProject._id + '/requests/' + request_id + "/chatbot/parameters")
                  .auth(email, pwd)
                  .end((err, res) => {

                    console.log("err: ", err);
                    console.log("res.body: ", res.body);
                    done();
                  })
  
            });
        });
      });
    });

    */



  });

});


