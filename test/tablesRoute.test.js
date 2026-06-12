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

const USERS_SCHEMA = [
  { name: 'fullname', type: 'string', index: 0 },
  { name: 'email', type: 'string', index: 1 },
  { name: 'code', type: 'string', index: 2 },
];

const EMAIL_ONLY_SCHEMA = [
  { name: 'email', type: 'string', index: 0 },
];

const EMAIL_CODE_SCHEMA = [
  { name: 'email', type: 'string', index: 0 },
  { name: 'code', type: 'string', index: 1 },
];

const COMPANIES_SCHEMA = [
  { name: 'name', type: 'string', index: 0 },
  { name: 'country', type: 'string', index: 1 },
  { name: 'city', type: 'string', index: 2 },
];

describe('TablesRoute', () => {

  it('create-new-table', (done) => {

    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-create", savedUser._id).then(savedProject => {

        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: USERS_SCHEMA })
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

  it('create-table-with-schema-array-without-client-ids', (done) => {
    let email = "test-signup-tablesroute-schema-array" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-schema-array", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({
            name: 'users',
            schema: [
              { name: 'email', type: 'string', index: 0 },
              { name: 'code', type: 'string', index: 1 },
            ],
          })
          .end((err, res) => {
            if (err) { console.error("err: ", err); }
            expect(res.status).to.be.equal(200);
            expect(res.body.schema).to.be.an('array');
            expect(res.body.schema.length).to.be.equal(2);
            res.body.schema.forEach(col => {
              expect(col.id).to.be.a('string').and.match(/^col_[0-9a-f]{16}$/);
            });
            expect(res.body.schema.find(c => c.name === 'email').type).to.be.equal('string');
            done();
          });
      });
    });
  });

  it('create-table-rejects-legacy-schema-map', (done) => {
    let email = "test-signup-tablesroute-reject-legacy" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-reject-legacy", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: { email: 'string', code: 'string' } })
          .end((err, res) => {
            expect(res.status).to.be.equal(400);
            expect(res.body.error).to.include('column metadata array');
            done();
          });
      });
    });
  });

  it('create-table-rejects-client-provided-column-ids', (done) => {
    let email = "test-signup-tablesroute-reject-id" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-reject-id", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({
            name: 'users',
            schema: [
              { id: 'col_client_provided', name: 'email', type: 'string' },
            ],
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(400);
            expect(res.body.error).to.include('Column id must not be provided');
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
          .send({ name: 'users', schema: USERS_SCHEMA })
          .end((err, res) => {
            if (err) { console.error("err: ", err); }
            if (log) { console.log("res.body: ", res.body); }

            expect(res.status).to.be.equal(200);

            chai.request(server)
              .post('/' + savedProject._id + '/tables')
              .auth(email, pwd)
              .send({ name: 'companies', schema: COMPANIES_SCHEMA })
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

  it('update-table-name-only', (done) => {
    let email = "test-signup-tablesroute-update-table" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-table", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId)
              .auth(email, pwd)
              .send({ name: 'customers' })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);
                expect(res.body.name).to.be.equal('customers');
                expect(res.body.schema).to.be.an('array');
                expect(res.body.schema.find(c => c.name === 'email')).to.exist;
                expect(res.body.columns).to.be.undefined;

                chai.request(server)
                  .get('/' + savedProject._id + '/tables/' + tableId)
                  .auth(email, pwd)
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.name).to.be.equal('customers');
                    done();
                  });
              });
          });
      });
    });
  });

  it('update-table-schema-array-preserves-column-ids', (done) => {
    let email = "test-signup-tablesroute-update-schema" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_CODE_SCHEMA })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            const tableId = res.body._id;
            const emailCol = res.body.schema.find(c => c.name === 'email');
            const codeCol = res.body.schema.find(c => c.name === 'code');

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
              .auth(email, pwd)
              .send({ data: { [emailCol.id]: 'user@test.it', [codeCol.id]: '111' } })
              .end((err, res) => {
                expect(res.status).to.be.equal(200);
                const rowId = res.body._id;

                chai.request(server)
                  .put('/' + savedProject._id + '/tables/' + tableId)
                  .auth(email, pwd)
                  .send({
                    schema: [
                      { id: emailCol.id, name: 'email', type: 'string', index: 0 },
                      { id: codeCol.id, name: 'code', type: 'string', index: 1 },
                      { name: 'phone', type: 'string', index: 2 },
                    ],
                  })
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.schema.length).to.be.equal(3);

                    const emailAfter = res.body.schema.find(c => c.id === emailCol.id);
                    const codeAfter = res.body.schema.find(c => c.id === codeCol.id);
                    const phoneCol = res.body.schema.find(c => c.name === 'phone');

                    expect(emailAfter.name).to.be.equal('email');
                    expect(codeAfter.name).to.be.equal('code');
                    expect(phoneCol.id).to.match(/^col_[0-9a-f]{16}$/);
                    expect(phoneCol.id).to.not.equal(emailCol.id);
                    expect(phoneCol.type).to.be.equal('string');

                    chai.request(server)
                      .get('/' + savedProject._id + '/tables/' + tableId)
                      .auth(email, pwd)
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        const row = res.body.rows.find(r => r._id === rowId);
                        expect(row.email).to.be.equal('user@test.it');
                        expect(row.code).to.be.equal('111');
                        done();
                      });
                  });
              });
          });
      });
    });
  });

  it('update-table-rejects-legacy-schema-map', (done) => {
    let email = "test-signup-tablesroute-update-reject-legacy" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-reject-legacy", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId)
              .auth(email, pwd)
              .send({ schema: { email: 'string', phone: 'string' } })
              .end((err, res) => {
                expect(res.status).to.be.equal(400);
                expect(res.body.error).to.include('column metadata array');
                done();
              });
          });
      });
    });
  });

  it('update-table-rejects-invalid-schema', (done) => {
    let email = "test-signup-tablesroute-update-invalid-schema" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-invalid-schema", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId)
              .auth(email, pwd)
              .send({ schema: [] })
              .end((err, res) => {
                expect(res.status).to.be.equal(400);
                done();
              });
          });
      });
    });
  });

  it('update-table-not-found', (done) => {
    let email = "test-signup-tablesroute-update-notfound" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-update-notfound", savedUser._id).then(savedProject => {
        chai.request(server)
          .put('/' + savedProject._id + '/tables/000000000000000000000001')
          .auth(email, pwd)
          .send({ name: 'ghost' })
          .end((err, res) => {
            expect(res.status).to.be.equal(404);
            expect(res.body.error).to.include('Table not found');
            done();
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
                        expect(res.body.rows[0]._id).to.exist;
                        expect(res.body.rows[1]._id).to.exist;
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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
          .send({ name: 'users', schema: USERS_SCHEMA })
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

  it('rename-column-rejects-missing-name', (done) => {
    let email = "test-signup-tablesroute-rename-missing" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-rename-missing", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;
            const emailColId = res.body.schema.find(c => c.name === 'email').id;

            chai.request(server)
              .patch('/' + savedProject._id + '/tables/' + tableId + '/columns/' + emailColId)
              .auth(email, pwd)
              .send({})
              .end((err, res) => {
                expect(res.status).to.be.equal(400);
                expect(res.body.error).to.include('name is required');
                done();
              });
          });
      });
    });
  });

  it('rename-column-rejects-duplicate-name', (done) => {
    let email = "test-signup-tablesroute-rename-dup" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-rename-dup", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_CODE_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;
            const codeColId = res.body.schema.find(c => c.name === 'code').id;

            chai.request(server)
              .patch('/' + savedProject._id + '/tables/' + tableId + '/columns/' + codeColId)
              .auth(email, pwd)
              .send({ name: 'email' })
              .end((err, res) => {
                expect(res.status).to.be.equal(409);
                expect(res.body.error).to.include('Column name already exists');
                done();
              });
          });
      });
    });
  });

  it('rename-column-not-found', (done) => {
    let email = "test-signup-tablesroute-rename-col-notfound" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-rename-col-notfound", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .patch('/' + savedProject._id + '/tables/' + tableId + '/columns/col_nonexistent0000')
              .auth(email, pwd)
              .send({ name: 'new_label' })
              .end((err, res) => {
                expect(res.status).to.be.equal(404);
                expect(res.body.error).to.include('Column not found');
                done();
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
          .send({ name: 'users', schema: EMAIL_CODE_SCHEMA })
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

  it('delete-row-by-id', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-delete", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: USERS_SCHEMA })
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
                  .put('/' + savedProject._id + '/tables/' + tableId + '/insert')
                  .auth(email, pwd)
                  .send({ data: { fullname: 'Jane Baker', email: 'jane.baker@example.com', code: '654321' } })
                  .end((err, res) => {
                    expect(res.status).to.be.equal(200);

                    chai.request(server)
                      .put('/' + savedProject._id + '/tables/' + tableId + '/delete')
                      .auth(email, pwd)
                      .send({ id_row: rowId })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body._id).to.be.equal(rowId);
                        expect(res.body.data.fullname).to.be.equal('John Doe');

                        chai.request(server)
                          .get('/' + savedProject._id + '/tables/' + tableId)
                          .auth(email, pwd)
                          .end((err, res) => {
                            expect(res.status).to.be.equal(200);
                            expect(res.body.rows.length).to.be.equal(1);
                            expect(res.body.rows[0].fullname).to.be.equal('Jane Baker');
                            done();
                          });
                      });
                  });
              });
          });
      });
    });
  });

  it('delete-row-by-conditions-must-match-all', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-delete-cond", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: USERS_SCHEMA })
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
                      .put('/' + savedProject._id + '/tables/' + tableId + '/delete')
                      .auth(email, pwd)
                      .send({
                        must_match: 'all',
                        conditions: [
                          { column: 'email', condition: 'Equal', value: 'mario@test.it' },
                          { column: 'code', condition: 'Equal', value: '111' },
                        ],
                      })
                      .end((err, res) => {
                        expect(res.status).to.be.equal(200);
                        expect(res.body.data.fullname).to.be.equal('Mario Rossi');

                        chai.request(server)
                          .get('/' + savedProject._id + '/tables/' + tableId)
                          .auth(email, pwd)
                          .end((err, res) => {
                            expect(res.status).to.be.equal(200);
                            expect(res.body.rows.length).to.be.equal(1);
                            expect(res.body.rows[0].fullname).to.be.equal('Luigi Verdi');
                            done();
                          });
                      });
                  });
              });
          });
      });
    });
  });

  it('delete-row-rejects-missing-id-row-and-conditions', (done) => {
    let email = "test-signup-tablesroute" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
      projectService.create("test-tablesroute-delete-missing", savedUser._id).then(savedProject => {
        chai.request(server)
          .post('/' + savedProject._id + '/tables')
          .auth(email, pwd)
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
          .end((err, res) => {
            const tableId = res.body._id;

            chai.request(server)
              .put('/' + savedProject._id + '/tables/' + tableId + '/delete')
              .auth(email, pwd)
              .send({})
              .end((err, res) => {
                expect(res.status).to.be.equal(400);
                expect(res.body.error).to.include('id_row or conditions is required');
                done();
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
          .send({ name: 'users', schema: EMAIL_ONLY_SCHEMA })
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


