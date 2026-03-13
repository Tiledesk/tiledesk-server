//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.ADMIN_EMAIL = "admin@tiledesk.com";

let log = false;
var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('ProjectUserRoute', () => {

  describe('Delete', () => {

    it('delete-project-user-and-remove-from-group', (done) => {

      let email_owner = "owner-signup-" + Date.now() + "@email.com";
      let email_agent = "agent-signup-" + Date.now() + "@email.com";
      var pwd = "pwd";

      userService.signup(email_owner, pwd, "Owner Firstname", "Owner Lastname").then((owner) => {
        userService.signup(email_agent, pwd, "Agent Firstname", "Agent Lastname").then((agent) => {
          projectService.create("test-project", owner._id).then((project) => {

            // Invite agent on the project
            chai.request(server)
              .post('/' + project._id + "/project_users/invite")
              .auth(email_owner, pwd)
              .set('content-type', 'application/json')
              .send({ email: email_agent, role: "agent", userAvailable: false })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("Invite agent to project res.body: ", res.body) };

                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.id_user).to.equal(agent._id.toString());

                let pu_id = res.body._id;

                // Create group
                chai.request(server)
                  .post('/' + project._id + "/groups")
                  .auth(email_owner, pwd)
                  .set('content-type', 'application/json')
                  .send({ name: "test-group", members: [owner._id, agent._id] })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("Create group res.body: ", res.body) };

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    expect(res.body.name).to.equal("test-group");
                    expect(res.body.members.length).to.equal(2);
                    expect(res.body.members[0]).to.equal(owner._id.toString())
                    expect(res.body.members[1]).to.equal(agent._id.toString())

                    let group_id = res.body._id;

                    // Remove project user from project
                    chai.request(server)
                      .delete('/' + project._id + '/project_users/' + pu_id + '?soft=true')
                      .auth(email_owner, pwd)
                      .set('content-type', 'application/json')
                      .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("Delete project user res.body: ", res.body) };

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        // Check group
                        chai.request(server)
                          .get('/' + project._id + '/groups/' + group_id)
                          .auth(email_owner, pwd)
                          .set('content-type', 'application/json')
                          .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("Check group res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.members.length).to.equal(1);
                            expect(res.body.members[0]).to.equal(owner._id.toString())

                            done()
                          })

                      })
                  })
              })
          })
        })
      })
    }).timeout(5000);

  })

});