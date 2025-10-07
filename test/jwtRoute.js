//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let User = require('../models/user');
let projectService = require('../services/projectService');
let userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let jwt = require('jsonwebtoken');

let log = false;

// chai.config.includeStack = true;

let expect = chai.expect;
let assert = chai.assert;

chai.use(chaiHttp);

describe('JWTRoute', () => {

  describe('/decode', () => {

    it('decodeWithIatExp', (done) => {

      let email = "test-signup-" + Date.now() + "@email.com";
      let pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("test-join-member", savedUser._id).then(function (savedProject) {
          chai.request(server)
            .post('/' + savedProject._id + '/keys/generate')
            .auth(email, pwd)
            .send()
            .end((err, res) => {

              if (err) { console.error("err: ", err); }
              if (log) { console.log("res.body", res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.jwtSecret).to.not.equal(null);

              chai.request(server)
                .post('/' + savedProject._id + '/jwt/generatetestjwt')
                .auth(email, pwd)
                .send({ "name": "andrea", "surname": "leo" })
                .end((err, res) => {

                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("res.body", res.body); }

                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.token).to.not.equal(null);

                  let jwtToken = res.body.token;
                  if (log) { console.log("jwtToken", jwtToken); }
                  
                  chai.request(server)
                    .post('/' + savedProject._id + '/jwt/decode')
                    .set('Authorization', jwtToken)
                    .send()
                    .end((err, res) => {

                      res.should.have.status(200);
                      res.body.should.be.a('object');
                      
                      expect(res.body.name).to.not.equal("andrea");
                      expect(res.body.surname).to.not.equal("leo");
                      expect(res.body.iat).to.not.equal(null);
                      expect(res.body.exp).to.not.equal(null);

                      done();
                    });
                });
            });
        });
      });
    }).timeout(20000);


    it('decodeWithIatNoExp', (done) => {

      let email = "test-signup-" + Date.now() + "@email.com";
      let pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("test-join-member", savedUser._id).then(function (savedProject) {
          chai.request(server)
            .post('/' + savedProject._id + '/keys/generate')
            .auth(email, pwd)
            .send()
            .end((err, res) => {

              if (err) { console.error("err: ", err); }
              if (log) { console.log("res.body", res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.jwtSecret).to.not.equal(null);

              let jwtToken = jwt.sign({ "name": "andrea", "surname": "leo" }, res.body.jwtSecret);
              if (log) { console.log("jwtToken", jwtToken); }

              chai.request(server)
                .post('/' + savedProject._id + '/jwt/decode')
                .set('Authorization', 'JWT ' + jwtToken)
                .send()
                .end((err, res) => {

                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("res.body", res.body); }

                  res.should.have.status(401);

                  done();
                });
            });
        });
      });
    }).timeout(20000);


    it('decodeWithIatTooHightExp', (done) => {

      let email = "test-signup-" + Date.now() + "@email.com";
      let pwd = "pwd";

      userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        projectService.create("test-join-member", savedUser._id).then(function (savedProject) {
          chai.request(server)
            .post('/' + savedProject._id + '/keys/generate')
            .auth(email, pwd)
            .send()
            .end((err, res) => {

              if (err) { console.error("err: ", err); }
              if (log) { console.log("res.body", res.body); }

              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.jwtSecret).to.not.equal(null);

              let jwtToken = jwt.sign({ "name": "andrea", "surname": "leo" }, res.body.jwtSecret, { expiresIn: 800 });
              if (log) { console.log("jwtToken", jwtToken); }

              chai.request(server)
                .post('/' + savedProject._id + '/jwt/decode')
                .set('Authorization', 'JWT ' + jwtToken)
                .send()
                .end((err, res) => {

                  if (err) { console.error("err: ", err); }
                  if (log) { console.log("res.body", res.body); }

                  res.should.have.status(401);

                  done();
                });
            });
        });
      });
    }).timeout(20000);

  });

});


