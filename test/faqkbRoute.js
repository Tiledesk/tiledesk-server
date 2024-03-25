//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var Faq = require('../models/faq');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
var faqService = require('../services/faqService');

let chatbot_mock = require('./chatbot-mock');
let log = false;


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
                            if (log) {
                                console.log("res.body", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq_kb/' + res.body._id)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                        console.log("res.body", res.body);
                                    }
                                    res.should.have.status(200);

                                    done();
                                });
                        });


                });
            });

        }).timeout(20000);

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


        it('create with template example', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example" })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                        console.log("faq_list: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    done();

                                })



                        });
                })
            })
        })

        it('create with template blank', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "blank" })
                        .end((err, res) => {
                            if (log) {
                            }
                            console.log("res.body", res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                    }
                                    console.log("faq_list: ", JSON.stringify(res.body, null, 2));
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    done();

                                })



                        });
                })
            })
        })

        // mocha test/faqkbRoute.js  --grep 'language'
        it('update chatbot and intents language', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: "en" })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                        console.log("faq_list: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;


                                    chai.request(server)
                                        .put('/' + savedProject._id + '/faq_kb/' + id_faq_kb + '/language/it')
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("res.body: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.name).to.equal("testbot");
                                            expect(res.body.language).to.equal("it");

                                            chai.request(server)
                                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                                .auth(email, pwd)
                                                .end((err, res) => {
                                                    if (log) {
                                                        console.log("faq_list: ", res.body);
                                                    }
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


        it('fork chatbot (private)', (done) => {

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
                                if (log) {
                                    console.log("res.body: ", res.body);
                                }
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
                                        if (log) {
                                            console.log("fork private chatbot res.body: ", res.body)
                                        }
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


        it('fork chatbot (public)', (done) => {
            var email_user1 = "user1-signup-" + Date.now() + "@email.com";
            var email_user2 = "user2-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email_user1, pwd, "User1 Firstname", "User1 lastname").then(function (user1) {
                userService.signup(email_user2, pwd, "User2 Firstname", "User2 lastname").then(function (user2) {
                    projectService.create("current-project", user1._id).then(function (currentProject) {
                        projectService.create("landing-project", user2._id).then(function (landingProject) {

                            if (log) {
                                console.log("mock: ", chatbot_mock.existing_chatbot_mock);
                            }

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
                                    if (log) {
                                        console.log("res.body: ", res.body);
                                    }
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
                                            if (log) {
                                                console.log("fork public chatbot res.body: ", res.body)
                                            }
                                            res.should.have.status(200);

                                            done();
                                        })
                                })
                        })
                    })
                })
            })
        })

        it('create bot and import json', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb/importjson/' + null + "?create=true")
                        .auth(email, pwd)
                        .set('Content-Type', 'text/plain')
                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-rules.txt')), 'example-json-rules')
                        .end((err, res) => {
                            if (log) {
                                console.log("import json res: ", JSON.stringify(res.body, null, 2));
                            }
                            res.should.have.status(200);
                            res.should.be.a('object');
                            expect(res.body.name).to.equal("examplebot");
                            expect(res.body.language).to.equal("en");

                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                        console.log("faq_list: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    //res.body.should.be.an('array').that.is.not.empty;

                                    done();

                                })
                        })

                })
            })

        })

        it('import json in an existing bot', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(((savedUser) => {
                projectService.create('test-faqkb-create', savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank " })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("en");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-rules.txt')), 'example-json-rules')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import json res: ", JSON.stringify(res.body, null, 2));
                                    }
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


        it('import json (overwrite true)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr', template: "blank" })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + "?overwrite=true")
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example.json')), 'example.json')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import json res: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    res.should.be.a('object');
                                    expect(res.body.name).to.equal("examplebot");
                                    expect(res.body.language).to.equal("en");

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("faq_list: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })


        it('import json (overwrite false)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr', template: "blank" })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json.txt')), 'example-json.txt')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import json res: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    res.should.be.a('object');
                                    expect(res.body.name).to.equal("examplebot");
                                    expect(res.body.language).to.equal("en");

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("faq_list: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })

        it('import json (simple)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr' })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true&overwrite=true')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import (intents only) json res: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    //res.should.be.a('object');
                                    //expect(res.body.success).to.equal(true);

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("faq_list: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })


        it('import json (intents only) (overwrite true)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr', template: 'blank' })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true&overwrite=true')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import (intents only) json res: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    //res.should.be.a('object');
                                    //expect(res.body.success).to.equal(true);

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("faq_list: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })


        it('import json (intents only) (overwrite false)', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", language: 'fr', template: 'blank' })
                        .end((err, res) => {
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/importjson/' + id_faq_kb + '?intentsOnly=true')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-json-intents.txt')), 'example-json-intents.txt')
                                .end((err, res) => {
                                    if (log) {
                                        console.log("import (intents only) json res: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    //res.should.be.a('object');
                                    //expect(res.body.success).to.equal(true);

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("faq_list: ", res.body);
                                            }
                                            res.should.have.status(200);
                                            res.body.should.be.an('array').that.is.not.empty;

                                            done();

                                        })
                                })
                        })
                })
            })
        })


        it('exportjson', (done) => {


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
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;
                            if (log) {
                                console.log("res.body._id: ", res.body._id)
                            }

                            chai.request(server)
                                    .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                    .auth(email, pwd)
                                    .end((err, res) => {
                                        if (log) {
                                            console.log("faq_list: ", res.body);
                                        }
                                        res.should.have.status(200);
                                        res.body.should.be.an('array').that.is.not.empty;
    
                                        chai.request(server)
                                            .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb)
                                            .auth(email, pwd)
                                            .end((err, res) => {
                                                if (log) {
                                                    console.log("export json res: ", res.body);
                                                }
                                                console.log("export json res: ", res.body);
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
                            if (log) {
                                console.log("res.body: ", res.body);
                            }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("fr");
                            let id_faq_kb = res.body._id;
                            if (log) {
                                console.log("res.body._id: ", res.body._id)
                            }

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) {
                                        console.log("faq_list: ", res.body);
                                    }
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.not.empty;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/faq_kb/exportjson/' + id_faq_kb + "?intentsOnly=true")
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) {
                                                console.log("export json res: ", res.body);
                                            }
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
                            expect(savedBot.name).to.equal("testbot");
                            expect(savedBot.secret).to.not.equal(null);

                            chai.request(server)
                                .post('/' + savedProject._id + '/faq_kb/train')
                                .auth(email, pwd)
                                .send({ "id_faq_kb": savedBot._id })
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    if (log) {
                                        console.log("res.body", res.body);
                                    }
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


    });

});


