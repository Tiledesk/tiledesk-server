//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

var Faq = require('../models/faq');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
var faqService = require('../services/faqService');

let chatbot_mock = require('./mock/chatbotMock');
let log = false;


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');
const Project_user = require('../models/project_user');
const roleConstants = require('../models/roleConstants');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FaqKBRoute', () => {

    describe('Get', () => {

        it('get-all-chatbot-with-role-admin-or-owner', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "external", language: 'fr' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq_kb')
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);

                                    done();
                                });
                        });


                });
            });

        }).timeout(20000);

        it('get-all-chatbot-with-role-agent', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "external", language: 'fr' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");

                            Project_user.findOneAndUpdate({ id_project: savedProject._id, id_user: savedUser._id }, { role: roleConstants.AGENT }, (err, savedProject_user) => {
                                chai.request(server)
                                    .get('/' + savedProject._id + '/faq_kb')
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);

                                        done();
                                    });
                            })

                        });


                });
            });

        }).timeout(20000);

    })

    describe('Create', () => {

        it('create-new-chatbot', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "external", language: 'en' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq_kb/' + res.body._id)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);

                                    done();

                                });
                        });
                });
            });

        })

        it('create-new-chatbot-auto-slug', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("My Awesome Bot");
                            expect(res.body.slug).to.equal("my-awesome-bot")
                            expect(res.body.language).to.equal("en");

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb')
                                .auth(email, pwd)
                                .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.name).to.equal("My Awesome Bot");
                                    expect(res.body.slug).to.equal("my-awesome-bot-1")
                                    expect(res.body.language).to.equal("en");

                                    chai.request(server)
                                        .post('/' + savedProject._id + '/faq_kb')
                                        .auth(email, pwd)
                                        .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                                        .end((err, res) => {
                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.name).to.equal("My Awesome Bot");
                                            expect(res.body.slug).to.equal("my-awesome-bot-2")
                                            expect(res.body.language).to.equal("en");

                                            chai.request(server)
                                                .post('/' + savedProject._id + '/faq_kb')
                                                .auth(email, pwd)
                                                .send({ "name": "My Awesome Bot 1", type: "internal", language: 'en', template: "blank" })
                                                .end((err, res) => {

                                                    if (err) { console.error("err: ", err); }
                                                    if (log) { console.log("res.body", res.body); }

                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.name).to.equal("My Awesome Bot 1");
                                                    expect(res.body.slug).to.equal("my-awesome-bot-1-1")
                                                    expect(res.body.language).to.equal("en");

                                                    chai.request(server)
                                                        .get('/' + savedProject._id + '/faq_kb/')
                                                        .auth(email, pwd)
                                                        .end((err, res) => {

                                                            if (err) { console.error("err: ", err); }
                                                            if (log) { console.log("res.body", res.body); }

                                                            res.should.have.status(200);

                                                            done();

                                                        });
                                                })
                                        })
                                })
                        });
                });
            });
        })

        it('create-new-chatbot-agent-role', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                    Project_user.findOneAndUpdate({ id_project: savedProject._id, id_user: savedUser._id }, { role: roleConstants.AGENT }, (err, savedProject_user) => {

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq_kb')
                            .auth(email, pwd)
                            .send({ "name": "testbot", type: "external", language: 'fr' })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(403);
                                expect(res.body.success).to.equal(false);
                                expect(res.body.msg).to.equal("you dont have the required role.");

                                done();

                            });
                    })
                });
            });

        })

        it('create-with-template-example', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            setTimeout(() => {

                                chai.request(server)
                                    .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                    .auth(email, pwd)
                                    .end((err, res) => {
    
                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }
    
                                        res.should.have.status(200);
                                        res.body.should.be.an('array').that.is.not.empty;
    
                                        done();
    
                                    })
                            }, 1000)



                        });
                })
            })
        })

        it('create-with-template-blank', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "blank" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("faq_list: ", JSON.stringify(res.body, null, 2)); }

                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    done();

                                })



                        });
                })
            })
        })

        it('create-new-webhook', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ name: "testflow", type: "tilebot", subtype: "webhook", language: 'en' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testflow");
                            expect(res.body.language).to.equal("en");
                            expect(res.body.type).to.equal("tilebot");
                            expect(res.body.subtype).to.equal("webhook")


                            chai.request(server)
                                .get('/' + savedProject._id + '/faq/?id_faq_kb=' + res.body._id)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);

                                    done();

                                });
                        });
                });
            });

        })

    });

    describe('Update', () => {

        it('update-chatbot-no-slug', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("My Awesome Bot");
                            expect(res.body.slug).to.equal("my-awesome-bot")
                            expect(res.body.language).to.equal("en");

                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .put('/' + savedProject._id + '/faq_kb/' + id_faq_kb)
                                .auth(email, pwd)
                                .send({ "name": "My Magician Bot" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.name).to.equal("My Magician Bot");
                                    expect(res.body.slug).to.equal("my-awesome-bot");

                                    done()
                                })

                        });
                });
            });
        })

        it('update-chatbot-slug-with-existing-one', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("My Awesome Bot");
                            expect(res.body.slug).to.equal("my-awesome-bot")
                            expect(res.body.language).to.equal("en");

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb')
                                .auth(email, pwd)
                                .send({ "name": "My Awesome Bot", type: "internal", language: 'en', template: "blank" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.name).to.equal("My Awesome Bot");
                                    expect(res.body.slug).to.equal("my-awesome-bot-1")
                                    expect(res.body.language).to.equal("en");

                                    let id_faq_kb = res.body._id;

                                    chai.request(server)
                                        .put('/' + savedProject._id + '/faq_kb/' + id_faq_kb)
                                        .auth(email, pwd)
                                        .send({ "slug": "my-awesome-bot" })
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(500);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(false);
                                            expect(res.body.error).to.equal("Slug already exists: my-awesome-bot");
                                            expect(res.body.error_code).to.equal(12001);

                                            done()

                                        })

                                });

                        });
                });
            });
        })

        it('update-chatbot-and-intents-language', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: "en" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;


                                    chai.request(server)
                                        .put('/' + savedProject._id + '/faq_kb/' + id_faq_kb + '/language/it')
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.name).to.equal("testbot");
                                            expect(res.body.language).to.equal("it");

                                            chai.request(server)
                                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                                .auth(email, pwd)
                                                .end((err, res) => {

                                                    if (err) { console.error("err: ", err); }
                                                    if (log) { console.log("res.body", res.body); }

                                                    res.should.have.status(200);
                                                    res.body.should.be.an('array').that.is.not.empty;

                                                    done();
                                                })

                                        })

                                })



                        });
                })
            })
        })

    })

    describe('Import/Export and Fork', () => {

        it('fork-chatbot-private', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("current-project", savedUser._id).then(function (currentProject) {
                    projectService.create("landing-project", savedUser._id).then(function (landingProject) {

                        class chatbot_service {
                            async getBotById(id, published, api_url, chatbot_templates_api_url, token, project_id) {
                                return chatbot_mock.existing_chatbot_mock;
                            }

                            async createBot(api_url, token, chatbot, project_id) {
                                return chatbot_mock.empty_chatbot_mock
                            }

                            async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
                                return chatbot_mock.import_faqs_res_mock
                            }
                        }

                        server.set('chatbot_service', new chatbot_service());


                        chai.request(server)
                            .post('/' + currentProject._id + '/faq_kb')
                            .auth(email, pwd)
                            .send({ "name": "privateBot", type: "internal", language: 'en', public: "false", template: "blank" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.name).to.equal("privateBot");
                                expect(res.body.language).to.equal("en");
                                let id_faq_kb = res.body._id;

                                chai.request(server)
                                    .post('/' + currentProject._id + '/faq_kb/fork/' + id_faq_kb + "?public=false&projectid=" + landingProject._id)
                                    .auth(email, pwd)
                                    .set('Content-Type', 'application/json')
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }
                                        res.should.have.status(200);
                                        res.should.have.be.a('object');
                                        expect(res.body.bot_id).to.equal(chatbot_mock.empty_chatbot_mock._id)

                                        done();

                                    })
                            })
                    })
                })
            })


        })

        it('fork-chatbot-private-not-permitted', (done) => {
            var email_user1 = "user1-signup-" + Date.now() + "@email.com";
            var email_user2 = "user2-signup-" + (Date.now() + 1) + "@email.com";
            var pwd = "pwd";

            userService.signup(email_user1, pwd, "User1 Firstname", "User1 lastname").then(function (user1) {
                userService.signup(email_user2, pwd, "User2 Firstname", "User2 lastname").then(function (user2) {
                    projectService.create("project1", user1._id).then(function (currentProject) {
                        projectService.create("project2", user2._id).then(function (landingProject) {

                            class chatbot_service {
                                async getBotById(id, published, api_url, chatbot_templates_api_url, token, project_id) {
                                    return new Promise((resolve, reject) => {
                                        reject({ success: false, msg: "Chatbot not found" })
                                    })
                                }
    
                                async createBot(api_url, token, chatbot, project_id) {
                                    return chatbot_mock.empty_chatbot_mock
                                }
    
                                async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
                                    return chatbot_mock.import_faqs_res_mock
                                }
                            }

                            server.set('chatbot_service', new chatbot_service());

                            chai.request(server)
                                .post('/' + currentProject._id + '/faq_kb')
                                .auth(email_user1, pwd)
                                .send({ "name": "chatbot1", type: "tilebot", language: 'en', public: "false", template: "blank" })
                                .end((err, res) => {
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.name).to.equal("chatbot1");
                                    expect(res.body.language).to.equal("en");
                                    expect(res.body.public).to.equal(false);

                                    const chatbot_id = res.body._id;

                                    chai.request(server)
                                        .post('/' + landingProject._id + '/faq_kb/fork/' + chatbot_id + "?public=false&projectid=" + landingProject._id)
                                        .auth(email_user2, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body: ", res.body); }
                                            
                                            res.should.have.status(500);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(false);
                                            expect(res.body.error).to.equal("Unable to get chatbot to be forked");
                                            done();
                                        })

                                });
                        });
                    });
                });
            });
        });

        it('fork-chatbot-public', (done) => {
            var email_user1 = "user1-signup-" + Date.now() + "@email.com";
            var email_user2 = "user2-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email_user1, pwd, "User1 Firstname", "User1 lastname").then(function (user1) {
                userService.signup(email_user2, pwd, "User2 Firstname", "User2 lastname").then(function (user2) {
                    projectService.create("current-project", user1._id).then(function (currentProject) {
                        projectService.create("landing-project", user2._id).then(function (landingProject) {

                            if (log) { console.log("mock: ", chatbot_mock.existing_chatbot_mock); }

                            class chatbot_service {
                                async getBotById(id, published, api_url, chatbot_templates_api_url, token, project_id) {
                                    return chatbot_mock.existing_chatbot_mock;
                                }

                                async createBot(api_url, token, chatbot, project_id) {
                                    return chatbot_mock.empty_chatbot_mock
                                }

                                async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
                                    return chatbot_mock.import_faqs_res_mock
                                }
                            }

                            server.set('chatbot_service', new chatbot_service());

                            chai.request(server)
                                .post('/' + currentProject._id + '/faq_kb')
                                .auth(email_user1, pwd)
                                .send({ "name": "publicBot", type: "internal", language: 'en', public: "true", template: "blank" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.name).to.equal("publicBot");
                                    expect(res.body.language).to.equal("en");
                                    let id_faq_kb = res.body._id;

                                    chai.request(server)
                                        .post('/' + landingProject._id + '/faq_kb/fork/' + id_faq_kb + '?public=true&projectid=' + landingProject._id)
                                        .auth(email_user2, pwd)
                                        .set('Content-Type', 'application/json')
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(200);

                                            done();
                                        })
                                })
                        })
                    })
                })
            })
        })

        it('create-bot-and-import-json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb/importjson/' + null + "?create=true")
                        .auth(email, pwd)
                        .set('Content-Type', 'text/plain')
                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-json-rules.txt')), 'example-json-rules')
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.should.be.a('object');
                            expect(res.body.name).to.equal("example bot");
                            expect(res.body.slug).to.equal("my-example-bot");
                            expect(res.body.language).to.equal("en");

                            let id_faq_kb = res.body._id;

                            chai.request(server)
                            .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                            .auth(email, pwd)
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                //res.body.should.be.an('array').that.is.not.empty;

                                done();

                            })
                        })

                })
            })

        })

        it('import-json-in-an-existing-bot', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(((savedUser) => {
                projectService.create('test-faqkb-create', savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank " })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-json-rules.txt')), 'example-json-rules')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("import json res: ", JSON.stringify(res.body, null, 2)); }

                                    res.should.have.status(200);
                                    //res.should.be.a('object');
                                    //expect(res.body.name).to.equal("examplebot");
                                    //expect(res.body.language).to.equal("en");

                                    done();
                                })
                        })
                })
            }))
        })

        it('import-json-in-an-existing-bot-and-replace-all-intents', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(((savedUser) => {
                projectService.create('test-faqkb-create', savedUser._id).then((savedProject) => {

                    chai.request(server)
                        //.post('/' + savedProject._id + '/faq_kb?replace=true')
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "tilebot", language: "en", template: "empty" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq/?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200)
                                    res.body.should.be.a('array');
                                    expect(res.body.length).to.equal(0);

                                    chai.request(server)
                                        .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                        .auth(email, pwd)
                                        .set('Content-Type', 'text/plain')
                                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-json-rules.txt')), 'example-json-rules')
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("import json res: ", JSON.stringify(res.body, null, 2)); }
                                            
                                            res.should.have.status(200);
                                            res.should.be.a('object');
                                            expect(res.body.name).to.equal("example bot");
                                            expect(res.body.language).to.equal("en");

                                            done();
                                        })
                                })

                        })
                })
            }))
        })

        it('import-json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr', template: "blank" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-json.txt')), 'example-json.txt')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.should.be.a('object');
                                    expect(res.body.name).to.equal("examplebot");
                                    expect(res.body.language).to.equal("en");

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err) };
                                            if (log) { console.log("res.body: ", res.body) };

                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })

        it('export-json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: 'fr' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            if (log) { console.log("id_faq_kb: ", id_faq_kb); }

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err) };
                                            if (log) { console.log("res.body: ", res.body) };
                                            
                                            res.should.have.status(200);
                                            //res.body.should.be.a('string');

                                            done();
                                        })
                                })

                            // chai.request(server)
                            //     .patch('/' + savedProject._id + '/faq_kb/' + id_faq_kb + '/attributes')
                            //     .auth(email, pwd)
                            //     .send({ variables: { var1: "var1", var2: "var2" },  globals: [{ key: 'test', value: 'test]'}] })
                            //     .end((err, res) => {
                            //         console.log("res.body: ", res.body)


                            //     })

                        });
                });
            });

        }).timeout(20000);

        it('export-json-intents-only)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: 'fr' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;
                            if (log) { console.log("id_faq_kb: ", id_faq_kb); }

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb + "?intentsOnly=true")
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err) };
                                            if (log) { console.log("res.body: ", res.body) };

                                            res.should.have.status(200);
                                            //res.body.should.be.a('string');

                                            done();
                                        })
                                })
                        });
                });
            });

        }).timeout(20000);

        it('import-webhook-json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb/importjson/null?create=true')
                        .auth(email, pwd)
                        .set('Content-Type', 'text/plain')
                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-webhook-json.txt')), 'example-webhook-json.txt')
                        .end((err, res) => {

                            if (err) { console.error("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.should.be.a('object');
                            expect(res.body.name).to.equal("Flow 1");
                            expect(res.body.language).to.equal("en");

                            let id_faq_kb = res.body._id

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;
                                    expect(res.body.length).to.equal(3);

                                    done();

                                })
                        })
                })
            })
        })
        

    })

    describe('Delete', () => {

        it('logical-delete-with-ttl', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ name: "testbot", type: "tilebot", subtype: "chatbot", template: "blank", language: 'en' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");

                            let chatbot_id = res.body._id;

                            chai.request(server)
                                .put('/' + savedProject._id + '/faq_kb/' + chatbot_id)
                                .auth(email, pwd)
                                .send({ trashed: true })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.trashed).to.equal(true);
                                    expect(res.body.trashedAt).to.exist;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq/?id_faq_kb=' + chatbot_id)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            
                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('array');
                                            expect(res.body.length).to.equal(3);
                                            expect(res.body[0].trashed).to.equal(true);
                                            expect(res.body[0].trashedAt).to.exist;

                                            done();
                                        })

                                })
                        });
                });
            });
        })

        it('logical-webhook-delete-with-ttl', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ name: "test-webhook", type: "tilebot", subtype: "webhook", template: "blank_webhook", language: 'en' })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("test-webhook");
                            expect(res.body.language).to.equal("en");

                            let chatbot_id = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/webhooks')
                                .auth(email, pwd)
                                .send({ chatbot_id: chatbot_id, block_id: "example-block-id", async: false })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');

                                    chai.request(server)
                                        .put('/' + savedProject._id + '/faq_kb/' + chatbot_id)
                                        .auth(email, pwd)
                                        .send({ trashed: true })
                                        .end((err, res) => {
        
                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }
        
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.trashed).to.equal(true);
                                            expect(res.body.trashedAt).to.exist;
        
                                            chai.request(server)
                                                .get('/' + savedProject._id + '/faq/?id_faq_kb=' + chatbot_id)
                                                .auth(email, pwd)
                                                .end((err, res) => {
                                                    
                                                    if (err) { console.error("err: ", err); }
                                                    if (log) { console.log("res.body", res.body); }
        
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('array');
                                                    expect(res.body.length).to.equal(2);
                                                    expect(res.body[0].trashed).to.equal(true);
                                                    expect(res.body[0].trashedAt).to.exist;
        
                                                    done();
                                                })
        
                                        })
                                })

                        });
                });
            });
        })
    })

    // describe('Train', () => {

    //     it('train', (done) => {

    //         var email = "test-signup-" + Date.now() + "@email.com";
    //         var pwd = "pwd";

    //         userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
    //             projectService.create("test-faqkb-train", savedUser._id).then(function (savedProject) {
    //                 faqService.create("testbot", "http://54.228.177.1644", savedProject._id, savedUser._id).then(function (savedBot) {

    //                     var newFaq = new Faq({
    //                         id_faq_kb: savedBot._id,
    //                         question: "question1\nquestion2",
    //                         answer: "answer",
    //                         id_project: savedProject._id,
    //                         topic: "default",
    //                         createdBy: savedUser._id,
    //                         updatedBy: savedUser._id
    //                     });

    //                     newFaq.save(function (err, savedFaq) {
    //                         expect(savedBot.name).to.equal("testbot");
    //                         expect(savedBot.secret).to.not.equal(null);

    //                         chai.request(server)
    //                             .post('/' + savedProject._id + '/faq_kb/train')
    //                             .auth(email, pwd)
    //                             .send({ "id_faq_kb": savedBot._id })
    //                             .end((err, res) => {

    //                                 if (err) { console.error("err: ", err) };
    //                                 if (log) { console.log("res.body: ", res.body) };

    //                                 res.should.have.status(200);
    //                                 res.body.should.be.a('object');
    //                                 expect(res.body.train.nlu.intent).to.equal(savedBot.intent_display_name);
    //                                 // expect(res.body.text).to.equal("addestramento avviato");         


    //                                 done();
    //                             });


    //                     });
    //                 });
    //             });
    //         });
    //     }).timeout(20000);

    // })

});


/**
* This test will be no longer available after merge with master because
* the profile section can no longer be modified via api.
*/
// it('createMaximumNumberExceeded', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
//         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

//             chai.request(server)
//                 .put('/projects/' + savedProject._id)
//                 .auth(email, pwd)
//                 .send({ profile: { quotes: { chatbots: 2 } } })
//                 .end((err, res) => {

//                     if (log) { console.log("res.body", res.body); }

//                     chai.request(server)
//                         .post('/' + savedProject._id + '/faq_kb')
//                         .auth(email, pwd)
//                         .send({ "name": "testbot1", type: "external", language: 'en' })
//                         .end((err, res) => {
//                             if (log) { console.log("res.body", res.body); }
//                             res.should.have.status(200);
//                             res.body.should.be.a('object');
//                             expect(res.body.name).to.equal("testbot1");
//                             expect(res.body.language).to.equal("en");

//                             chai.request(server)
//                                 .post('/' + savedProject._id + '/faq_kb')
//                                 .auth(email, pwd)
//                                 .send({ "name": "testbot2", type: "external", language: 'en' })
//                                 .end((err, res) => {
//                                     if (log) { console.log("res.body", res.body); }
//                                     res.should.have.status(200);
//                                     res.body.should.be.a('object');
//                                     expect(res.body.name).to.equal("testbot2");
//                                     expect(res.body.language).to.equal("en");

//                                     chai.request(server)
//                                         .post('/' + savedProject._id + '/faq_kb')
//                                         .auth(email, pwd)
//                                         .send({ "name": "testbot3", type: "external", language: 'en' })
//                                         .end((err, res) => {

//                                             if (log) { console.log("res.body", res.body); }

//                                             res.should.have.status(403);
//                                             res.body.should.be.a('object');
//                                             expect(res.body.success).to.equal(false);
//                                             expect(res.body.error).to.equal("Maximum number of chatbots reached for the current plan");
//                                             expect(res.body.plan_limit).to.equal(2);

//                                             done()

//                                         });
//                                 });
//                         });
//                 })
//         });
//     });

// }).timeout(20000);


// it('train with tiledesk-ai', (done) => {
//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
//         projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

//             chai.request(server)
//                 .post('/' + savedProject._id + '/faq_kb')
//                 .auth(email, pwd)
//                 .send({ "name": "testbot", type: "internal", template: "example", intentsEngine: "tiledesk-ai" })
//                 .end((err, res) => {
//                     if (log) {
//                         console.log("res.body", res.body);
//                     }
//                     res.should.have.status(200);
//                     res.body.should.be.a('object');
//                     expect(res.body.name).to.equal("testbot");
//                     var id_faq_kb = res.body._id;

//                     chai.request(server)
//                         .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
//                         .auth(email, pwd)
//                         .end((err, res) => {
//                             if (log) { console.log("faq_list: ", res.body); }
//                             res.should.have.status(200);
//                             res.body.should.be.an('array').that.is.not.empty;

//                             chai.request(server)
//                                 .post('/' + savedProject._id + '/faq_kb/aitrain')
//                                 .auth(email, pwd)
//                                 .send({ id_faq_kb: id_faq_kb, webhook_enabled: false })
//                                 .end((err, res) => {
//                                     if (log) { console.log("train res.body: ", res.body); }

//                                     done();
//                                 })

//                         })



//                 });
//         })
//     })
// })


// DEPRECATED
// it('import json (simple)', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
//         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

//             chai.request(server)
//                 .post('/' + savedProject._id + '/faq_kb')
//                 .auth(email, pwd)
//                 .send({ "name": "testbot", type: "internal", language: 'fr' })
//                 .end((err, res) => {
//                     if (log) {
//                         console.log("res.body: ", res.body);
//                     }
//                     res.should.have.status(200);
//                     res.body.should.be.a('object');
//                     expect(res.body.name).to.equal("testbot");
//                     expect(res.body.language).to.equal("fr");
//                     let id_faq_kb = res.body._id;

//                     chai.request(server)
//                         .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true&overwrite=true')
//                         .auth(email, pwd)
//                         .set('Content-Type', 'text/plain')
//                         .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
//                         .end((err, res) => {
//                             if (log) {
//                                 console.log("import (intents only) json res: ", res.body);
//                             }
//                             res.should.have.status(200);
//                             //res.should.be.a('object');
//                             //expect(res.body.success).to.equal(true);

//                             chai.request(server)
//                                 .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
//                                 .auth(email, pwd)
//                                 .end((err, res) => {
//                                     if (log) {
//                                         console.log("faq_list: ", res.body);
//                                     }
//                                     res.should.have.status(200);
//                                     res.body.should.be.an('array').that.is.not.empty;

//                                     done();

//                                 })
//                         })
//                 })
//         })
//     })
// })


// DEPRECATED
// it('import json (intents only) (overwrite true)', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
//         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

//             chai.request(server)
//                 .post('/' + savedProject._id + '/faq_kb')
//                 .auth(email, pwd)
//                 .send({ "name": "testbot", type: "internal", language: 'fr', template: 'blank' })
//                 .end((err, res) => {
//                     if (log) {
//                         console.log("res.body: ", res.body);
//                     }
//                     res.should.have.status(200);
//                     res.body.should.be.a('object');
//                     expect(res.body.name).to.equal("testbot");
//                     expect(res.body.language).to.equal("fr");
//                     let id_faq_kb = res.body._id;

//                     chai.request(server)
//                         .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true&overwrite=true')
//                         .auth(email, pwd)
//                         .set('Content-Type', 'text/plain')
//                         .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
//                         .end((err, res) => {
//                             if (log) {
//                                 console.log("import (intents only) json res: ", res.body);
//                             }
//                             res.should.have.status(200);
//                             //res.should.be.a('object');
//                             //expect(res.body.success).to.equal(true);

//                             chai.request(server)
//                                 .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
//                                 .auth(email, pwd)
//                                 .end((err, res) => {
//                                     if (log) {
//                                         console.log("faq_list: ", res.body);
//                                     }
//                                     res.should.have.status(200);
//                                     res.body.should.be.an('array').that.is.not.empty;

//                                     done();

//                                 })
//                         })
//                 })
//         })
//     })
// })


// DEPRECATED
// it('import json (intents only) (overwrite false)', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
//         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

//             chai.request(server)
//                 .post('/' + savedProject._id + '/faq_kb')
//                 .auth(email, pwd)
//                 .send({ "name": "testbot", type: "internal", language: 'fr', template: 'blank' })
//                 .end((err, res) => {
//                     if (log) {
//                         console.log("res.body: ", res.body);
//                     }
//                     res.should.have.status(200);
//                     res.body.should.be.a('object');
//                     expect(res.body.name).to.equal("testbot");
//                     expect(res.body.language).to.equal("fr");
//                     let id_faq_kb = res.body._id;

//                     chai.request(server)
//                         .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true')
//                         .auth(email, pwd)
//                         .set('Content-Type', 'text/plain')
//                         .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
//                         .end((err, res) => {
//                             if (log) {
//                                 console.log("import (intents only) json res: ", res.body);
//                             }
//                             res.should.have.status(200);
//                             //res.should.be.a('object');
//                             //expect(res.body.success).to.equal(true);

//                             chai.request(server)
//                                 .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
//                                 .auth(email, pwd)
//                                 .end((err, res) => {
//                                     if (log) {
//                                         console.log("faq_list: ", res.body);
//                                     }
//                                     res.should.have.status(200);
//                                     res.body.should.be.an('array').that.is.not.empty;

//                                     done();

//                                 })
//                         })
//                 })
//         })
//     })
// })

// it('publishChatbot', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(function (savedUser) {
//         projectService.create("current-project", savedUser._id).then(function (currentProject) {

//             console.log("declare chatbot_service functions...")

//             class chatbot_service {
//                 async fork(id, api_url, token, project_id) {
//                     console.log("chatbot_service test fork called")
//                     return { message: "Chatbot forked successfully", bot_id: savedChatbot._id }
//                     //return chatbot_mock.existing_chatbot_mock;
//                 }

//                 async getBotById(id, published, api_url, chatbot_templates_api_url, token, project_id, globals) {
//                     return chatbot_mock.existing_chatbot_mock;
//                 }

//                 async createBot(api_url, token, chatbot, project_id) {
//                     return chatbot_mock.empty_chatbot_mock
//                 }

//                 async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
//                     return chatbot_mock.import_faqs_res_mock
//                 }
//             }

//             server.set('chatbot_service', new chatbot_service());
//             console.log("chatbot_service functions declared")

//             chai.request(server)
//                     .post('/' + currentProject._id + '/faq_kb')
//                     .auth(email, pwd)
//                     .send({ "name": "privateBot", type: "internal", language: 'en', public: "false", template: "blank" })
//                     .end((err, res) => {
//                         console.log("res.body: ", res.body);
//                         if (log) {
//                         }
//                         res.should.have.status(200);
//                         res.body.should.be.a('object');
//                         expect(res.body.name).to.equal("privateBot");
//                         expect(res.body.language).to.equal("en");
//                         let id_faq_kb = res.body._id;

//                         chai.request(server)
//                         .put('/' + currentProject._id + '/faq_kb/' +  id_faq_kb + '/publish')
//                         .auth(email, pwd)
//                         .set('Content-Type', 'application/json')
//                         .end((err, res) => {
//                             console.log("publish bot res.body: ", res.body);
//                             res.should.have.status(200);

//                             done();
//                         })
//                     })


//         })
//     })
// })

// DEPRECATED
// it('import-json-overwrite-true', (done) => {

//     var email = "test-signup-" + Date.now() + "@email.com";
//     var pwd = "pwd";

//     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
//         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {


//             chai.request(server)
//                 .post('/' + savedProject._id + '/faq_kb')
//                 .auth(email, pwd)
//                 .send({ "name": "testbot", type: "internal", language: 'fr', template: "blank" })
//                 .end((err, res) => {

//                     if (err) { console.error("err: ", err) };
//                     if (log) { console.log("res.body: ", res.body) };

//                     res.should.have.status(200);
//                     res.body.should.be.a('object');
//                     expect(res.body.name).to.equal("testbot");
//                     expect(res.body.language).to.equal("fr");
//                     let id_faq_kb = res.body._id;

//                     chai.request(server)
//                         .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + "?overwrite=true")
//                         .auth(email, pwd)
//                         .set('Content-Type', 'text/plain')
//                         .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example.json')), 'example.json')
//                         .end((err, res) => {

//                             if (err) { console.error("err: ", err) };
//                             if (log) { console.log("res.body: ", res.body) };

//                             res.should.have.status(200);
//                             res.should.be.a('object');
//                             expect(res.body.name).to.equal("examplebot");
//                             expect(res.body.language).to.equal("en");

//                             chai.request(server)
//                                 .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
//                                 .auth(email, pwd)
//                                 .end((err, res) => {

//                                     if (err) { console.error("err: ", err) };
//                                     if (log) { console.log("res.body: ", res.body) };

//                                     res.should.have.status(200);
//                                     res.body.should.be.an('array').that.is.not.empty;

//                                     done();

//                                 })
//                         })
//                 })
//         })
//     })
// })