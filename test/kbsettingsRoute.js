//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var userService = require('../services/userService');
var projectService = require('../services/projectService');

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

describe('KbSettingsRoute', () => {

    describe('/create', () => {

        it('createKbSettings', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({}) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject._id.toString());

                            done();

                            /**
                             * For old version
                             */
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

                            //         done();
                            //     })

                        })

                });
            });

        });

        // no longer valid
        // it('createKbSettingsIfNotExists', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .get('/' + savedProject._id + "/kbsettings")
        //                 .auth(email, pwd)
        //                 .end((err, res) => {
        //                     if (log) { console.log("get kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString())
        //                     expect(res.body.maxKbsNumber).to.equal(3);
        //                     expect(res.body.maxPagesNumber).to.equal(1000);
        //                     expect(res.body.kbs).is.an('array').that.is.empty;

        //                     done();
        //                 })
        //         });
        //     });

        // });

        it('getEmptyKbSettings', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-kb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (log) { console.log("res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body).is.an('object').that.is.empty;

                            done();
                        })
                })
            })
        })

        it('deleteEmptyKbSettingsOnGet', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)    
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({})
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .get('/' + savedProject._id + "/kbsettings")
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) { console.log("get kbsettings res.body: ", res.body); }

                                    res.should.have.status(200);
                                    expect(res.body).is.an('object').that.is.empty;

                                    done();

                                })

                        })
                })
            })
        })

        it('dontDeleteKbSettingsOnGet', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then((savedUser) => {
                projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                    chai.request(server)    
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({})
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            let settings_id = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + "/kbsettings/" + settings_id)
                                .auth(email, pwd)
                                .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
                                .end((err, res) => {

                                    if (log) { console.log("add kb to kbsettings res.body: ", res.body); }
                                    res.should.have.status(200);

                                    chai.request(server)
                                        .get('/' + savedProject._id + "/kbsettings")
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (log) { console.log("get kbsettings res.body: ", res.body); }

                                            res.should.have.status(200);
                                            expect(res.body.kbs[0].name).to.equal("exampleurl.com/kb/")

                                            done();

                                        })


                                })

                            

                        })
                })
            })
        })


        it('addKbToKbSettings', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({}) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject._id.toString());

                            let settings_id = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + "/kbsettings/" + settings_id)
                                .auth(email, pwd)
                                .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
                                .end((err, res) => {
                                    if (log) { console.log("add kb to kb settings res.body: ", res.body); }
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    //expect(res.body.kbs).to.have.length(1)

                                    chai.request(server)
                                        .post('/' + savedProject._id + "/kbsettings/" + settings_id)
                                        .auth(email, pwd)
                                        .send({ name: "secondurl.com/support/", url: "https://secondurl.com/support/" })
                                        .end((err, res) => {
                                            if (log) { console.log("add kb to kb settings res.body: ", res.body); }
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            //expect(res.body.kbs).to.have.length(2)

                                            done();
                                        })

                                })
                        })

                });
            });

        });

        it('updateKbSettings', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({}) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .put('/' + savedProject._id + "/kbsettings/" + res.body._id)
                                .auth(email, pwd)
                                .send({ gptkey: "sk-12345678" })
                                .end((err, res) => {
                                    if (log) { console.log("add kb to kb settings res.body: ", res.body); }
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');

                                    done();

                                })
                        })

                });
            });

        });

        it('deleteKbFromList', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kbsettings')
                        .auth(email, pwd)
                        .send({}) // can be empty
                        .end((err, res) => {
                            if (log) { console.log("create kbsettings res.body: ", res.body); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject._id.toString());

                            let settings_id = res.body._id;

                            chai.request(server)
                                .post('/' + savedProject._id + "/kbsettings/" + settings_id)
                                .auth(email, pwd)
                                .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
                                .end((err, res) => {
                                    if (log) { console.log("add kb to kb settings res.body: ", res.body); }
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.kbs).to.have.length(1)

                                    let kb_to_delete_id = res.body.kbs[0]._id;

                                    chai.request(server)
                                        .post('/' + savedProject._id + "/kbsettings/" + settings_id)
                                        .auth(email, pwd)
                                        .send({ name: "secondurl.com/support/", url: "https://secondurl.com/support/" })
                                        .end((err, res) => {
                                            if (log) { console.log("add kb to kb settings res.body: ", res.body); }
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            //expect(res.body.kbs).to.have.length(2)

                                            chai.request(server)
                                                .delete('/' + savedProject._id + "/kbsettings/" + settings_id + "/" + kb_to_delete_id)
                                                .auth(email, pwd)
                                                .end((err, res) => {
                                                    if (log) { console.log("delete kb res.body: ", res.body); };
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('object');
                                                    expect(res.body.kbs).to.have.length(1)
                                                    expect(res.body.kbs[0].name).to.equal("secondurl.com/support/");
                                                    expect(res.body.kbs[0].url).to.equal("https://secondurl.com/support/");

                                                    done();
                                                })
                                        })

                                })
                        })
                });
            });

        });



        // THE FOLLOWING TEST REQUIRES REAL REQUESTS
        // it('start scrape', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString());

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.kbs).to.have.length(1)

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kbsettings/startscrape")
        //                                 .auth(email, pwd)
        //                                 .send({ full_url: "https://developer.tiledesk.com/", gptkey: "valid-key" })
        //                                 .end( async (err, res) => {
        //                                     if (err) {
        //                                         console.log(" test err: ", err);
        //                                     }
        //                                     if (log) { console.log("start scrape res.body: ", res.body); }

        //                                     res.should.have.status(200);
        //                                     res.body.should.be.a('object');
        //                                     expect(res.body.message).to.not.equal(null);

        //                                     done();
        //                                 })

        //                         })
        //                 })

        //         });
        //     });

        // }).timeout(20000)

        // it('start scrape error - invalid key', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString());

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.kbs).to.have.length(1)

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kbsettings/startscrape")
        //                                 .auth(email, pwd)
        //                                 .send({ full_url: "https://developer.tiledesk.com/", gptkey: "invalid-gptkey" })
        //                                 .end( async (err, res) => {
        //                                     if (err) {
        //                                         console.log(" test err: ", err);
        //                                     }
        //                                     if (log) { console.log("start scrape res.body: ", res.body); }

        //                                     res.should.have.status(200);
        //                                     res.body.should.be.a('object');
        //                                     expect(res.body.message).to.not.equal(null);

        //                                     done();
        //                                 })

        //                         })
        //                 })

        //         });
        //     });

        // }).timeout(20000)

        // it('start scrape error - missing parameter', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString());

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.kbs).to.have.length(1)

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kbsettings/startscrape")
        //                                 .auth(email, pwd)
        //                                 // .send({ full_url: "https://fakeurl.com/support", gptkey: null })
        //                                 // OR
        //                                 .send({ full_url: "https://fakeurl.com/support" })
        //                                 .end((err, res) => {
        //                                     res.should.have.status(422);
        //                                     res.body.should.be.a('object');
        //                                     expect(res.body.statusText).to.equal("Unprocessable Entity");
        //                                     expect(res.body.detail).to.not.equal(null);

        //                                     done();
        //                                 })

        //                         })
        //                 })

        //         });
        //     });

        // }).timeout(20000)

        // it('check status error - missing parameter', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString());

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ name: "exampleurl.com/kb/", url: "https://exampleurl.com/kb/" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.kbs).to.have.length(1)

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kbsettings/checkstatus")
        //                                 .auth(email, pwd)
        //                                 // .send()
        //                                 // OR
        //                                 .send({ full_url: null })
        //                                 .end((err, res) => {
        //                                     res.should.have.status(422);
        //                                     res.body.should.be.a('object');
        //                                     expect(res.body.statusText).to.equal("Unprocessable Entity");
        //                                     expect(res.body.detail).to.not.equal(null);

        //                                     done();
        //                                 })

        //                         })
        //                 })

        //         });
        //     });

        // }).timeout(20000)

        // it('checkstatuserror - no db created for', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.id_project).to.equal(savedProject._id.toString());

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ name: "gethelp.tiledesk.com/", url: "https://gethelp.tiledesk.com/" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.kbs).to.have.length(1)

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kbsettings/checkstatus")
        //                                 .auth(email, pwd)
        //                                 .send({ full_url: "https://gethelp.tiledesk.com/" })
        //                                 .end((err, res) => {
        //                                     res.should.have.status(200);
        //                                     res.body.should.be.a('object');
        //                                     // expect(res.body.status_message).to.equal("Database is not created yet for dbnevercreated.com/kb/, please wait a few minutes and try again");
        //                                     // expect(res.body.status_code).to.equal(0);

        //                                     done();
        //                                 })

        //                         })
        //                 })

        //         });
        //     });

        // }).timeout(20000)
        
        // it('qa error', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + "/kbsettings/qa")
        //                 .auth(email, pwd)
        //                 .send({ question: "How to connect Tiledesk with Telegram?", kbid: "https://gethelp.tiledesk.com/", gptkey: "valid-key" })
        //                 .end((err, res) => {
        //                     if (log) {}
        //                     console.log("qa res.body: ", res.body);
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');

        //                     done();
        //                 })

        //         });
        //     });

        // }).timeout(20000)

    });

});


