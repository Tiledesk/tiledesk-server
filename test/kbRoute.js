//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var userService = require('../services/userService');
var projectService = require('../services/projectService');

let log = true;

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

describe('KbRoute', () => {

    describe('/create', () => {

        it('createNewKb', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    let kb = {
                        name: "example_name5",
                        type: "url",
                        source: "https://www.exampleurl5.com",
                        content: ""
                    }

                    chai.request(server)
                        .post('/' + savedProject._id + '/kb')
                        .auth(email, pwd)
                        .send(kb) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kb res.body: ", res.body); }
                            res.should.have.status(200);
                            // res.body.should.be.a('object');
                            // expect(res.body.id_project).to.equal(savedProject._id.toString());

                            done();
                            // chai.request(server)
                            //     .get('/' + savedProject._id + "/kbsettings")
                            //     .auth(email, pwd)
                            //     .end((err, res) => {
                            //         if (log) { console.log("get kbsettings res.body: ", res.body); }
                            //         res.should.have.status(200);
                            //         res.body.should.be.a('object');
                            //         expect(res.body.id_project).to.equal(savedProject._id.toString())
                            //         expect(res.body.maxKbsNumber).to.equal(3);
                            //         expect(res.body.maxPagesNumber).to.equal(1000);
                            //         expect(res.body.kbs).is.an('array').that.is.empty;


                            //     })

                        })

                });
            });

        });

        it('scrapeSingle', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    let kb = {
                        name: "example_name6",
                        type: "url",
                        source: "https://www.exampleurl6.com",
                        content: ""
                    }

                    chai.request(server)
                        .post('/' + savedProject._id + '/kb')
                        .auth(email, pwd)
                        .send(kb) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kb res.body: ", res.body); }
                            res.should.have.status(200);

                            let kbid = res.body.value._id;
                            console.log("kbid: ", kbid)
                            chai.request(server)
                                .post('/' + savedProject._id + "/kb/scrape/single")
                                .auth(email, pwd)
                                .send({ id: kbid })
                                .end((err, res) => {
                                    if (log) { console.log("single scrape res.body: ", res.body); }
                                    //res.should.have.status(200);
                                    // res.body.should.be.a('object');
                                    // expect(res.body.id_project).to.equal(savedProject._id.toString())
                                    // expect(res.body.maxKbsNumber).to.equal(3);
                                    // expect(res.body.maxPagesNumber).to.equal(1000);
                                    // expect(res.body.kbs).is.an('array').that.is.empty;
                                    done();

                                })


                            // res.body.should.be.a('object');
                            // expect(res.body.id_project).to.equal(savedProject._id.toString());




                        })

                });
            });

        });

    })
});


