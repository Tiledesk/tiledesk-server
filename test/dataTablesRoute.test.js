process.env.NODE_ENV = 'test';
let chai = require('chai');
let expect = require('chai').expect;

let chaiHttp = require('chai-http');
let server = require('../app');
const projectService = require('../services/projectService');
const userService = require('../services/userService');
var RoleConstants = require("../models/roleConstants");
const Project_user = require('../models/project_user');
let should = chai.should();

let log = false;

chai.use(chaiHttp);


describe('Data Tables Route', () => {

  it('create-with-empty-schema', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-empty-table", savedUser._id).then(savedProject => {

        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users" })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.name).to.equal("users");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.schema).to.be.an('array').that.is.empty;

            done();
          })
      })
    })
  })

  it('create-table-with-schema', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.name).to.equal("users");
            expect(res.body.id_project).to.equal(savedProject._id.toString());
            expect(res.body.schema).to.be.an('array').that.is.lengthOf(2);
            expect(res.body.schema[0].name).to.equal("name");
            expect(res.body.schema[0].type).to.equal("string");
            expect(res.body.schema[1].name).to.equal("repo");
            expect(res.body.schema[1].type).to.equal("number");

            done();
          })
      })
    })
  })

  it('create-table-with-invalid-schema', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: { name: "string", repo: "number" } })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(400);
            res.body.should.be.a('object');
            expect(res.body.success).to.equal(false);
            expect(res.body.message).to.equal("schema must be an array");

            done();
          })
      })
    })
  })

  it('create-table-rejects-invalid-column-name', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-invalid-column-name", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "full name", type: "string" }] })
          .end((err, res) => {
            res.should.have.status(400);
            expect(res.body.message).to.include('letters, numbers and underscore');
            done();
          })
      })
    })
  })

  it('update-table-name', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + id_table)
              .auth(email, pwd)
              .send({ name: "users-renamed" })
              .end((err, res) => {
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.name).to.equal("users-renamed");

                done();
              })
          })
      })
    })
  })

  it('update-table-schema-adding-column', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + id_table + '/insert')
              .auth(email, pwd)
              .send({ data: { name: "John Doe", repo: 100 } })
              .end(() => {
                let updateSchema = [
                  ...res.body.schema,
                  { name: "country", type: "string" }
                ];

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + id_table)
                  .auth(email, pwd)
                  .send({ schema: updateSchema })
                  .end((err, res) => {
                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    res.should.have.status(200);
                    expect(res.body.schema).to.be.an('array').that.is.lengthOf(3);

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + id_table + '/rows/list')
                      .auth(email, pwd)
                      .end((err2, listRes) => {
                        listRes.should.have.status(200);
                        expect(listRes.body[0].name).to.equal("John Doe");
                        expect(listRes.body[0].repo).to.equal(100);
                        expect(listRes.body[0].country).to.equal(null);
                        done();
                      });
                  });
              });
          })
      })
    })
  })

  it('update-table-schema-removing-column', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }, { name: "country", type: "string" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            res.body.schema.pop();
            let updateSchema = res.body.schema;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + id_table)
              .auth(email, pwd)
              .send({ schema: updateSchema })
              .end((err, res) => {
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.schema).to.be.an('array').that.is.lengthOf(2);
                expect(res.body.schema[0].name).to.equal("name");
                expect(res.body.schema[0].type).to.equal("string");
                expect(res.body.schema[1].name).to.equal("repo");
                expect(res.body.schema[1].type).to.equal("number");


                done();
              })
          })
      })
    })
  })

  it('update-table-schema-renaming-column', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            let updateSchema = res.body.schema;
            updateSchema[1].name = "repo_renamed";

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + id_table)
              .auth(email, pwd)
              .send({ schema: updateSchema })
              .end((err, res) => {
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.schema).to.be.an('array').that.is.lengthOf(2);
                expect(res.body.schema[0].name).to.equal("name");
                expect(res.body.schema[0].type).to.equal("string");
                expect(res.body.schema[1].name).to.equal("repo_renamed");
                expect(res.body.schema[1].type).to.equal("number");


                done();
              })
          })
      })
    })
  })

  it('insert-row-into-table', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            let row = {
              name: "John Doe",
              repo: 100
            }
            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: row })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('object');
                expect(res.body.data.name).to.equal("John Doe");
                expect(res.body.data.repo).to.equal(100);

                done();
              })
          })
      })
    })
  })

  it('insert-row-into-table-and-rename-column', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;
            const table_schema = res.body.schema;

            let row = {
              name: "John Doe",
              repo: 100
            }
            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: row })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('object');
                expect(res.body.data.name).to.equal("John Doe");
                expect(res.body.data.repo).to.equal(100);

                table_schema[1].name = "repo_renamed";

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + id_table)
                  .auth(email, pwd)
                  .send({ schema: table_schema })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    res.should.have.status(200);
                    res.body.should.be.a('object');

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + id_table)
                      .auth(email, pwd)
                      .end((err, res) => {
                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body: ", res.body); }

                        res.should.have.status(200);

                        done();
                      })
                  })
              })
          })
      })
    })
  }).timeout(5000);

  it('list-rows', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-create-table-with-schema", savedUser._id).then(savedProject => {
        
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            let row = {
              name: "John Doe",
              repo: 100
            }
            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: row })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('object');
                expect(res.body.data.name).to.equal("John Doe");
                expect(res.body.data.repo).to.equal(100);

                let row = {
                  name: "Jane Baker",
                  repo: 43
                }

                chai.request(server)
                  .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
                  .auth(email, pwd)
                  .send({ data: row })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.data.should.be.a('object');
                    expect(res.body.data.name).to.equal("Jane Baker");
                    expect(res.body.data.repo).to.equal(43);

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + id_table)
                      .auth(email, pwd)
                      .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body: ", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.rows.should.be.an('array').that.is.lengthOf(2);
                        expect(res.body.rows[0].name).to.equal("John Doe");
                        expect(res.body.rows[0].repo).to.equal(100);
                        expect(res.body.rows[1].name).to.equal("Jane Baker");
                        expect(res.body.rows[1].repo).to.equal(43);

                        done();
                      })
                  })

              })
          })
      })
    })
  }).timeout(5000);

  it('update-row-by-id-row', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-update-id-row", savedUser._id).then(savedProject => {
        
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;
            
            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: { name: "John Doe", repo: 100 } })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log(" 111 res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                const id_row = res.body._id;

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + id_table + '/row/update')
                  .auth(email, pwd)
                  .send({ id_row: id_row, data: { repo: 200 } })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("*** res.body: ", res.body); }

                    res.should.have.status(200);
                    expect(res.body.data.name).to.equal("John Doe");
                    expect(res.body.data.repo).to.equal(200);

                    done();
                  });
              });
          });
      });
    });
  }).timeout(5000);

  it('update-row-by-conditions', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-update-conditions", savedUser._id).then(savedProject => {
        
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }, { name: "repo", type: "number" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;

            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: { name: "Jane Baker", repo: 43 } })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + id_table + '/row/update')
                  .auth(email, pwd)
                  .send({
                    must_match: 'all',
                    conditions: [{ column: 'name', operator: 'equal', value: 'Jane Baker' }],
                    data: { repo: 99 },
                  })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    res.should.have.status(200);
                    expect(res.body.data.repo).to.equal(99);
                    done();
                  });
              });
          });
      });
    });
  }).timeout(5000);

  it('delete-row-by-conditions', (done) => {

    let email = "test-signup-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(savedUser => {
      projectService.create("test-delete-conditions", savedUser._id).then(savedProject => {
        
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: "users", schema: [{ name: "name", type: "string" }] })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            res.should.have.status(200);
            res.body.should.be.a('object');

            const id_table = res.body._id;
            
            chai.request(server)
              .post('/' + savedProject._id + '/tables/' + id_table + '/row/insert')
              .auth(email, pwd)
              .send({ data: { name: "To Delete" } })
              .end((err, res) => {

                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                res.should.have.status(200);
                res.body.should.be.a('object');

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + id_table + '/row/delete')
                  .auth(email, pwd)
                  .send({
                    must_match: 'all',
                    conditions: [{ column: 'name', operator: 'equal', value: 'To Delete' }],
                  })
                  .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    res.should.have.status(200);
                    expect(res.body.data.name).to.equal("To Delete");

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + id_table + '/rows/list')
                      .auth(email, pwd)
                      .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body: ", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        expect(res.body.length).to.equal(0);

                        done();
                      });
                  });
              });
          });
      });
    });
  }).timeout(5000);

})