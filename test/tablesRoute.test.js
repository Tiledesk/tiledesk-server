//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var expect = chai.expect;
var assert = chai.assert;

let log = false;

chai.use(chaiHttp);

describe('TablesRoute', () => {

  it('create-new-table', (done) => {

    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-create", savedUser._id).then(savedProject => {

        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            expect(res.status).to.be.equal(200);
            expect(res.body.name).to.be.equal('users');
            expect(res.body.schema).to.be.an('array');
            expect(res.body.schema.length).to.be.equal(3);
            expect(res.body.schema.find(c => c.name === 'email')).to.have.property('id');
            expect(res.body.schema.find(c => c.name === 'fullname').type).to.be.equal('string');

            done();
          });
      });
    });
  });

  it('get-all-tables', (done) => {

    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-create", savedUser._id).then(savedProject => {

        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            expect(res.status).to.be.equal(200);

            chai.request(server)
              .post('/' + savedProject._id + '/tables')
              .auth(email, pwd)
              .send({ name: 'companies', schema: { name: 'string', country: 'string', city: 'string' } })
              .end((err, res) => {
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                expect(res.status).to.be.equal(200);

                chai.request(server)
                  .get('/' + savedProject._id + '/tables')
                  .auth(email, pwd)
                  .end((err, res) => {
                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    expect(res.status).to.be.equal(200);
                    expect(res.body.length).to.be.equal(2);
                    expect(res.body[0].name).to.be.equal('users');
                    expect(res.body[1].name).to.be.equal('companies');

                    done();
                  });
              });
          });
      });
    });
  });

  it('insert-row-into-table', (done) => {

    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-create", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {

            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            expect(res.status).to.be.equal(200);

            let tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { fullname: 'John Doe', email: 'john.doe@example.com', code: '123456' } })
              .end((err, res) => {
                if (err) { console.error("err: ", err); }
                if (log) { console.log("res.body: ", res.body); }

                expect(res.status).to.be.equal(200);

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
                  .auth(email, pwd)
                  .send({ data: { fullname: 'Jane Baker', email: 'jane.baker@example.com', code: '654321' } })
                  .end((err, res) => {
                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body: ", res.body); }

                    expect(res.status).to.be.equal(200);

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + tableId)
                      .auth(email, pwd)
                      .end((err, res) => {
                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body: ", res.body); }

                        expect(res.status).to.be.equal(200);
                        expect(res.body.name).to.be.equal('users');
                        expect(res.body.rows.length).to.be.equal(2);
                        expect(res.body.rows[0].fullname).to.be.equal('John Doe');
                        expect(res.body.rows[0].email).to.be.equal('john.doe@example.com');
                        expect(res.body.rows[0].code).to.be.equal('123456');
                        expect(res.body.rows[1].fullname).to.be.equal('Jane Baker');
                        expect(res.body.rows[1].email).to.be.equal('jane.baker@example.com');
                        expect(res.body.rows[1].code).to.be.equal('654321');

                        done()
                      
                      });


                  });

              });
          });
      })

    });
  })

  it('update-row-by-id-partial-data', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { fullname: 'John Doe', email: 'john.doe@example.com', code: '123456' } })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);
                const rowId = res.body._id;

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/update')
                  .auth(email, pwd)
                  .send({ id_row: rowId, data: { code: '999999' } })
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.data.code).to.be.equal('999999');
                    expect(res.body.data.fullname).to.be.equal('John Doe');
                    expect(res.body.data.email).to.be.equal('john.doe@example.com');
                    done();
                  });
              });
          });
      });
    });
  });

  it('update-row-by-conditions-must-match-all', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-cond", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { fullname: 'Mario Rossi', email: 'mario@test.it', code: '111' } })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
                  .auth(email, pwd)
                  .send({ data: { fullname: 'Luigi Verdi', email: 'mario@test.it', code: '222' } })
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);

                    chai.request(server)
                      .put('/' + savedProject._id + '/tables/' + tableId + '/update')
                      .auth(email, pwd)
                      .send({
                        must_match: 'all',
                        conditions: [
                          { column: 'email', condition: 'Equal', value: 'mario@test.it' },
                          { column: 'code', condition: 'Equal', value: '111' },
                        ],
                        data: { code: 'updated' },
                      })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body.data.code).to.be.equal('updated');
                        expect(res.body.data.fullname).to.be.equal('Mario Rossi');

                        chai.request(server)
                          .get('/' + savedProject._id + '/tables/' + tableId)
                          .auth(email, pwd)
                          .end((err, res) => {
                            expect(res.status).to.be.equal(200);
                            const luigi = res.body.rows.find(r => r.fullname === 'Luigi Verdi');
                            expect(luigi.code).to.be.equal('222');
                            done();
                          });
                      });
                  });
              });
          });
      });
    });
  });

  it('upsert-row-by-id-creates-if-missing', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";
    const mongoose = require('mongoose');
    const newRowId = new mongoose.Types.ObjectId().toString();

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-upsert-id", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            if (err) { return done(err); }
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/upsert')
              .auth(email, pwd)
              .send({
                id_row: newRowId,
                data: { fullname: 'New User', email: 'new@example.com', code: '000' },
              })
              .end((err, res) => {
                if (err) { return done(err); }
                expect(res.status).to.be.equal(200);
                expect(String(res.body._id)).to.be.equal(newRowId);
                expect(res.body.data.email).to.be.equal('new@example.com');

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/upsert')
                  .auth(email, pwd)
                  .send({
                    id_row: newRowId,
                    data: { code: '111' },
                  })
                  .end((err, res) => {
                    if (err) { return done(err); }
                    expect(res.status).to.be.equal(200);
                    expect(res.body.data.code).to.be.equal('111');
                    expect(res.body.data.email).to.be.equal('new@example.com');
                    done();
                  });
              });
          });
      });
    });
  });

  it('upsert-row-by-conditions-inserts-when-no-match', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-upsert-insert", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/upsert')
              .auth(email, pwd)
              .send({
                must_match: 'all',
                conditions: [{ column: 'email', condition: 'Equal', value: 'nobody@example.com' }],
                data: { fullname: 'Nobody', email: 'nobody@example.com', code: '000' },
              })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);
                expect(res.body.data.email).to.be.equal('nobody@example.com');

                chai.request(server)
                  .get('/' + savedProject._id + '/tables/' + tableId)
                  .auth(email, pwd)
                  .end((err, res) => {
                    expect(res.body.rows.length).to.be.equal(1);
                    done();
                  });
              });
          });
      });
    });
  });

  it('upsert-row-rejects-multiple-matches-when-multi-false', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-upsert-conflict", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { fullname: 'A', email: 'dup@test.it', code: '1' } })
              .end(() => {
                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
                  .auth(email, pwd)
                  .send({ data: { fullname: 'B', email: 'dup@test.it', code: '2' } })
                  .end(() => {
                    chai.request(server)
                      .put('/' + savedProject._id + '/tables/' + tableId + '/upsert')
                      .auth(email, pwd)
                      .send({
                        multi: false,
                        must_match: 'all',
                        conditions: [{ column: 'email', condition: 'Equal', value: 'dup@test.it' }],
                        data: { code: 'updated' },
                      })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(409);
                        done();
                      });
                  });
              });
          });
      });
    });
  });

  it('upsert-row-updates-all-matches-when-multi-true', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-upsert-multi", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { fullname: 'string', email: 'string', code: 'string' } })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { fullname: 'A', email: 'multi@test.it', code: '1' } })
              .end(() => {
                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
                  .auth(email, pwd)
                  .send({ data: { fullname: 'B', email: 'multi@test.it', code: '2' } })
                  .end(() => {
                    chai.request(server)
                      .put('/' + savedProject._id + '/tables/' + tableId + '/upsert')
                      .auth(email, pwd)
                      .send({
                        multi: true,
                        must_match: 'all',
                        conditions: [{ column: 'email', condition: 'Equal', value: 'multi@test.it' }],
                        data: { code: 'bulk-updated' },
                      })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body).to.be.an('array');
                        expect(res.body.length).to.be.equal(2);
                        expect(res.body[0].data.code).to.be.equal('bulk-updated');
                        expect(res.body[1].data.code).to.be.equal('bulk-updated');
                        done();
                      });
                  });
              });
          });
      });
    });
  });

  it('rename-column-metadata-only', (done) => {
    let email = "test-signup-tablesroute-rename" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-rename", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { email: 'string', code: 'string' } })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            const tableId = res.body._id;
            const emailCol = res.body.schema.find(c => c.name === 'email');
            const emailColId = emailCol.id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { email: 'keep@test.it', code: '111' } })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);

                chai.request(server)
                  .patch('/' + savedProject._id + '/tables/' + tableId + '/columns/' + emailColId)
                  .auth(email, pwd)
                  .send({ name: 'email_address' })
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.schema.find(c => c.id === emailColId).name).to.be.equal('email_address');
                    expect(res.body.schema.find(c => c.name === 'email_address').type).to.be.equal('string');
                    expect(res.body.schema.find(c => c.name === 'email')).to.be.undefined;

                    chai.request(server)
                      .put('/' + savedProject._id + '/tables/' + tableId + '/update')
                      .auth(email, pwd)
                      .send({
                        must_match: 'all',
                        conditions: [{ columnId: emailColId, condition: 'Equal', value: 'keep@test.it' }],
                        data: { code: 'renamed-col' },
                      })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body.data.email).to.be.equal('keep@test.it');
                        expect(res.body.data.code).to.be.equal('renamed-col');

                        chai.request(server)
                          .get('/' + savedProject._id + '/tables/' + tableId)
                          .auth(email, pwd)
                          .end((err, res) => {
                            expect(res.status).to.be.equal(200);
                            expect(res.body.rows[0].email).to.be.equal('keep@test.it');
                            done();
                          });
                      });
                  });
              });
          });
      });
    });
  });

  it('update-row-rejects-invalid-column', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-invalid", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { email: 'string' } })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/update')
              .auth(email, pwd)
              .send({
                must_match: 'all',
                conditions: [{ column: '__proto__', condition: 'Equal', value: 'x' }],
                data: { email: 'hack@test.it' },
              })
              .end((err, res) => {
                expect(res.status).to.be.equal(400);
                done();
              });
          });
      });
    });
  });


});


