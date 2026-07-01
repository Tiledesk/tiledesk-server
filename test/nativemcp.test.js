//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const projectService = require('../services/projectService');
const userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
const expect = chai.expect;

let log = false;

chai.use(chaiHttp);

function createProjectUser(done, callback) {
  const email = "test-signup-" + Date.now() + "@email.com";
  const pwd = "pwd";

  userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
    projectService.create("test-native-mcp", savedUser._id).then((savedProject) => {
      callback(savedProject, email, pwd, done);
    });
  });
}

describe('NativeMCP', () => {

  it('get-native-mcp-servers-list', (done) => {
    createProjectUser(done, (savedProject, email, pwd, done) => {
      chai.request(server)
        .get('/' + savedProject._id + '/mcp/native')
        .auth(email, pwd)
        .end((err, res) => {
          
          if (err) { console.error("err: ", err); }
          if (log) { console.log("res.body: ", res.body); }

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
        });
    });
  });

  it('connect-native-mcp-server-not-found', (done) => {
    createProjectUser(done, (savedProject, email, pwd, done) => {
      chai.request(server)
        .post('/' + savedProject._id + '/mcp/native/unknown-server/connect')
        .auth(email, pwd)
        .end((err, res) => {

          if (err) { console.error("err: ", err); }
          if (log) { console.log("connect res.body: ", res.body); }

          res.should.have.status(404);
          res.body.should.have.property('success', false);
          done();
        });
    });
  });

  it('connect-native-mcp-server', (done) => {
    createProjectUser(done, (savedProject, email, pwd, done) => {
      const serverId = 'tiledesk-communicator';

      chai.request(server)
        .post('/' + savedProject._id + '/mcp/native/' + serverId + '/connect')
        .auth(email, pwd)
        .end((err, connectRes) => {
          
          if (err) { console.error("err: ", err); }
          if (log) { console.log("connect res.body: ", connectRes.body); }

          connectRes.should.have.status(200);
          expect(connectRes.body).to.be.an('object');
          expect(connectRes.body.success).to.equal(true);
          expect(connectRes.body.message).to.equal('Native MCP server connected successfully');
          expect(connectRes.body.nativeId).to.equal(serverId);
          connectRes.body.tools.should.be.an('array');
          connectRes.body.tools.length.should.be.greaterThan(0);
          connectRes.body.tools[0].should.have.property('name');
          connectRes.body.tools.map((tool) => tool.name).should.include('reply_to_user');

          done();
        });
    });
  });

  it('save-native-mcp-server-to-integration', (done) => {
    createProjectUser(done, (savedProject, email, pwd, done) => {

      let serverId = 'tiledesk-communicator';
      chai.request(server)
        .post('/' + savedProject._id + '/mcp/native/' + serverId + '/tools')
        .auth(email, pwd)
        .end((err, toolsRes) => {
          
          if (err) { console.error("err: ", err); }
          if (log) { console.log("tools res.body: ", toolsRes.body); }

          toolsRes.should.have.status(200);
          expect(toolsRes.body).to.be.an('array');
          const totalTools = toolsRes.body.length;
          const tools = toolsRes.body.slice(0, totalTools - 2);
          
          chai.request(server)
            .post('/' + savedProject._id + '/mcp/servers')
            .auth(email, pwd)
            .send({
              type: 'native',
              nativeId: 'tiledesk-communicator',
              tools,
              selectedTools: [{ name: 'reply_to_user' }]
            })
            .end((err, res) => {
              
              if (err) { console.error("err: ", err); }
              if (log) { console.log("save res.body: ", res.body); }

              res.should.have.status(200);
              res.body.should.have.property('success', true);
              res.body.server.should.have.property('type', 'native');
              res.body.server.should.have.property('nativeId', 'tiledesk-communicator');
              res.body.server.should.have.property('name', 'Tiledesk Communicator');
              res.body.server.should.not.have.property('url');
              res.body.server.tools.should.have.length(totalTools - 2);
              res.body.server.selectedTools.should.deep.equal([{ name: 'reply_to_user' }]);

              chai.request(server)
                .get('/' + savedProject._id + '/integration/name/mcp')
                .auth(email, pwd)
                .end((err, integrationRes) => {
                  
                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("integration res.body: ", integrationRes.body); }

                  integrationRes.should.have.status(200);
                  integrationRes.body.should.have.property('name', 'mcp');
                  integrationRes.body.value.servers.should.be.an('array');
                  integrationRes.body.value.servers.should.have.length(1);
                  integrationRes.body.value.servers[0].should.have.property('nativeId', 'tiledesk-communicator');
                  integrationRes.body.value.servers[0].should.not.have.property('url');

                  done();
                });
            });
        });
    });
  });

});
