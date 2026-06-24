//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const projectService = require('../services/projectService');
const userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
const fs = require('fs');
const path = require('path');
const expect = chai.expect;
const assert = chai.assert;

let log = false;

chai.use(chaiHttp);

describe('NativeMCP', () => {

  it('get-native-mcp-servers-list', (done) => {

    const email = "test-signup-" + Date.now() + "@email.com";
    const pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
      projectService.create("test-openai-create", savedUser._id).then((savedProject) => {

        chai.request(server)
          .get('/' + savedProject._id + '/mcp/native')
          .auth(email, pwd)
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }
            console.log("res.body: ", res.body);
            res.should.have.status(200);
            res.body.should.be.an('array');
            res.body.should.have.length(2);

            expect(res.body[0].id).to.equal("tiledesk-communicator");
            expect(res.body[0].name).to.equal("Tiledesk Communicator");
            expect(res.body[0].native).to.equal(true);
            expect(res.body[0].transport).to.equal("streamable_http");
            expect(res.body[0].url).to.not.exist;
            expect(res.body[1].id).to.equal("tiledesk-data-table");
            expect(res.body[1].name).to.equal("Tiledesk Data Table");
            expect(res.body[1].native).to.equal(true);
            expect(res.body[1].transport).to.equal("streamable_http");
            expect(res.body[1].url).to.not.exist;

            done();
          })


      })
    })
  })

});


