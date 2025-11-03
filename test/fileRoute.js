//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';
process.env.ENABLE_ATTACHMENT_RETENTION = "true"


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(require('chai-string'));
let server = require('../app');
let should = chai.should();
var fs = require('fs');
var userService = require('../services/userService');
let projectService = require('../services/projectService');

let log = false;

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FileRoute', () => {

    describe('/post', () => {

        it('post-user', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .post('/files/users/')
                    .auth(email, pwd)
                    .set('Content-Type', 'application/pdf')
                    .attach('file', fs.readFileSync('./test/fixtures/sample.pdf'), 'sample.pdf')
                    // .field('delimiter', ';')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('File uploded successfully');
                        expect(res.body.filename).to.not.equal(null);
                        expect(res.body.thumbnail).to.not.equal(null);

                        done();
                    });
            });
        }).timeout(5000)



        it('post-public', (done) => {


            chai.request(server)
                .post('/files/public/')
                .set('Content-Type', 'application/pdf')
                .attach('file', fs.readFileSync('./test/fixtures/sample.pdf'), 'sample.pdf')
                .field('delimiter', ';')
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('File uploded successfully');
                    expect(res.body.filename).to.not.equal(null);
                    expect(res.body.thumbnail).to.not.equal(null);
                    done();
                });


        });

        it('post-chatbot-photo', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "tilebot", language: 'en' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");

                            let chatbot_id = res.body._id;



                            chai.request(server)
                                .post('/files/users/photo?bot_id=' + chatbot_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'images/png')
                                .attach('file', fs.readFileSync('./test/fixtures/test-image.png'), 'test-image.png')
                                // .field('delimiter', ';')            
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }
                                    console.log("res.body", res.body);

                                    // res.should.have.status(201);
                                    // res.body.should.be.a('object');
                                    // expect(res.body.message).to.equal('File uploded successfully');
                                    // expect(res.body.filename).to.not.equal(null);
                                    // expect(res.body.thumbnail).to.not.equal(null);

                                    done();
                                });
                        });


                });
            });

        }).timeout(5000)

    })
});


