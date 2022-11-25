//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var Faq = require('../models/faq');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
var faqService = require('../services/faqService');



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

describe('FaqKBRoute', () => {

    describe('/create', () => {


        it('create', (done) => {


            //   this.timeout();

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "external", language: 'fr' })
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");

                            done();
                        });


                });
            });

        }).timeout(20000);


        it('create with template example', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
    
            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {
    
                    chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "internal", template: "example" })
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");                                                                              
                            var id_faq_kb = res.body._id;
    
                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    console.log("faq_list: ", res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;
    
                                    done();
    
                                })
    
                            
    
                        });
                })
            })
        })

        it('import json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr' })
                        .end((err, res) => {
                            console.log("res.body: ", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile',  fs.readFileSync(path.resolve(__dirname, './example-json.txt')), 'example-json.txt') 
                                .end((err, res) => {
                                    console.log("import json res: ", res.body);
                                    res.should.have.status(200);
                                    res.should.be.a('object');
                                    expect(res.body.name).to.equal("examplebot");
                                    expect(res.body.language).to.equal("en");

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            console.log("faq_list: ", res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;
            
                                            done();
            
                                        })
                                })
                        })
                })
            })
        })

        it('import json (intents only)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr' })
                        .end((err, res) => {
                            console.log("res.body: ", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile',  fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt') 
                                .end((err, res) => {
                                    console.log("import (intents only) json res: ", res.body);
                                    res.should.have.status(200);
                                    //res.should.be.a('object');
                                    //expect(res.body.success).to.equal(true);

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            console.log("faq_list: ", res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;
            
                                            done();
            
                                        })
                                })
                        })
                })
            })
        })


        it('export json', (done) => {


            //   this.timeout();

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: 'fr' })
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;
                            console.log("res.body._id: ", res.body._id)

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    console.log("faq_list: ", res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            console.log("export json res: ", res.body);
                                            res.should.have.status(200);
                                            //res.body.should.be.a('string');

                                            done();
                                        })
                                })
                        });
                });
            });

        }).timeout(20000);

        it('export json (intents only)', (done) => {


            //   this.timeout();

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: 'fr' })
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;
                            console.log("res.body._id: ", res.body._id)

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    console.log("faq_list: ", res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb + "?intentsOnly=true")
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            console.log("export json res: ", res.body);
                                            res.should.have.status(200);
                                            //res.body.should.be.a('string');

                                            done();
                                        })
                                })
                        });
                });
            });

        }).timeout(20000);


        // mocha test/faqkbRoute.js  --grep 'train'
        it('train', (done) => {


            //   this.timeout();

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-train", savedUser._id).then(function (savedProject) {
                    faqService.create("testbot", "http://54.228.177.1644", savedProject._id, savedUser._id).then(function (savedBot) {

                        var newFaq = new Faq({
                            id_faq_kb: savedBot._id,
                            question: "question1\nquestion2",
                            answer: "answer",
                            id_project: savedProject._id,
                            topic: "default",
                            createdBy: savedUser._id,
                            updatedBy: savedUser._id
                        });

                        newFaq.save(function (err, savedFaq) {
                            console.log("err", err);
                            console.log("savedFaq", savedFaq);
                            expect(savedBot.name).to.equal("testbot");
                            expect(savedBot.secret).to.not.equal(null);

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/train')
                                .auth(email, pwd)
                                .send({ "id_faq_kb": savedBot._id })
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body", res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.train.nlu.intent).to.equal(savedBot.intent_display_name);
                                    // expect(res.body.text).to.equal("addestramento avviato");         


                                    done();
                                });


                        });
                    });
                });
            });
        }).timeout(20000);





    });

});


