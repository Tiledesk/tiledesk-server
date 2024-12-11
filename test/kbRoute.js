//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.GPTKEY = "fakegptkey";
process.env.KB_WEBHOOK_TOKEN = "testtoken"
process.env.PINECONE_INDEX = "test_index"
process.env.PINECONE_TYPE = "pod"
process.env.LOG_LEVEL = 'critical'

var userService = require('../services/userService');
var projectService = require('../services/projectService');
var faqService = require('../services/faqService');

let log = false;

var config = require('../config/global');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const nock = require('nock');
const faq = require('../models/faq');


// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

mongoose.connect(config.databasetest);

chai.use(chaiHttp);

describe('KbRoute', () => {

    describe('/create', () => {


        // NEW TESTS
        it('create-new-kb', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);
                            expect(res.body[0].engine.index_name).to.equal('test_index')

                            let namespace_id = res.body[0].id;

                            let kb = {
                                name: "example_name5",
                                type: "url",
                                source: "https://www.exampleurl5.com",
                                content: "",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb')
                                .auth(email, pwd)
                                .send(kb) // can be empty
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.value.id_project).to.equal(res.body.value.namespace)
                                    expect(res.body.value.name).to.equal("example_name5")
                                    expect(res.body.value.type).to.equal("url")
                                    expect(res.body.value.source).to.equal("https://www.exampleurl5.com")
                                    expect(res.body.value.status).to.equal(-1)

                                    done();
                                })
                        })
                });
            });

        })

        it('create-new-text-kb', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;
                            if (log) { console.log("namespace_id: ", namespace_id); }

                            let kb = {
                                name: "example_text1",
                                type: "text",
                                source: "example_text1",
                                content: "Example text",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb')
                                .auth(email, pwd)
                                .send(kb) // can be empty
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.value.id_project).to.equal(res.body.value.namespace)
                                    expect(res.body.value.name).to.equal("example_text1")
                                    expect(res.body.value.type).to.equal("text")
                                    expect(res.body.value.source).to.equal("example_text1")
                                    expect(res.body.value.status).to.equal(-1)
                                    expect(typeof res.body.value.scrape_type === "undefined").to.be.true;
                                    expect(typeof res.body.value.scrape_options === "undefined").to.be.true;


                                    done();
                                })
                        })
                });
            });

        })

        it('get-kb-chunks', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            let kb = {
                                name: "example_text1",
                                type: "text",
                                source: "example_text1",
                                content: "Example text",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb')
                                .auth(email, pwd)
                                .send(kb) // can be empty
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');

                                    let content_id = res.body.value._id;

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/kb/namespace/' + namespace_id + '/chunks/' + content_id)
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err )};
                                            if (log) { console.log("res.body: ", res.body )};

                                            res.should.have.status(200);
                                             /**
                                             * Unable to verify the response due to an external request
                                             */
                                            expect(res.body.success).to.equal(true);
                                            expect(res.body.message).to.equal("Get chunks skipped in test environment");

                                            done();
                                        })
                                })
                        })
                });
            });
        })

        it('get-with-queries', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    /**
                     * Get all namespace. If no namespace exists, a default namespace is created and returned
                     */
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body[0].name === 'Default');
                            expect(res.body[0].id === savedProject._id);

                            let namespace_id = res.body[0].id;

                            let kb1 = {
                                name: "example_name1",
                                type: "url",
                                namespace: namespace_id,
                                source: "https://www.exampleurl1.com",
                                content: ""
                            }

                            let kb2 = {
                                name: "example_name2",
                                type: "text",
                                namespace: namespace_id,
                                source: "example_name2",
                                content: "example content"
                            }

                            let kb3 = {
                                name: "example_name3",
                                type: "url",
                                namespace: namespace_id,
                                source: "https://www.exampleurl3.com",
                                content: ""
                            }


                            /**
                             * Add contents to default namespace
                             */
                            chai.request(server)
                                .post('/' + savedProject._id + "/kb")
                                .auth(email, pwd)
                                .send(kb1)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb1 res.body: ", res.body); }
                                    res.should.have.status(200);

                                    setTimeout(() => {
                                        chai.request(server)
                                            .post('/' + savedProject._id + "/kb")
                                            .auth(email, pwd)
                                            .send(kb2)
                                            .end((err, res) => {

                                                if (err) { console.error("err: ", err); }
                                                if (log) { console.log("create kb2 res.body: ", res.body); }

                                                res.should.have.status(200);

                                                setTimeout(() => {
                                                    chai.request(server)
                                                        .post('/' + savedProject._id + "/kb")
                                                        .auth(email, pwd)
                                                        .send(kb3)
                                                        .end((err, res) => {

                                                            if (err) { console.error("err: ", err); }
                                                            if (log) { console.log("create kb3 res.body: ", res.body); }

                                                            res.should.have.status(200);

                                                            let query = "?status=-1&type=url&limit=5&page=0&direction=-1&sortField=updatedAt&search=example&namespace=" + namespace_id;
                                                            //let query = "?namespace=" + namespace_id;

                                                            chai.request(server)
                                                                .get('/' + savedProject._id + "/kb" + query)
                                                                .auth(email, pwd)
                                                                .end((err, res) => {

                                                                    if (err) { console.error("err: ", err)}
                                                                    if (log) { console.log("getall res.body: ", res.body); }

                                                                    res.should.have.status(200);
                                                                    res.body.should.be.a('object');
                                                                    res.body.kbs.should.be.a('array');
                                                                    expect(res.body.kbs.length).to.equal(2);
                                                                    expect(res.body.count).to.equal(2);
                                                                    res.body.query.should.be.a('object');
                                                                    expect(res.body.query.status).to.equal(-1);
                                                                    expect(res.body.query.limit).to.equal(5);
                                                                    expect(res.body.query.page).to.equal(0);
                                                                    expect(res.body.query.direction).to.equal(-1);
                                                                    expect(res.body.query.sortField).to.equal("updatedAt");
                                                                    expect(res.body.query.search).to.equal("example");

                                                                    done();

                                                                })

                                                        })
                                                }, 1000)
                                            })
                                    }, 1000)
                                })
                        })
                })
            })
        }).timeout(20000)

        it('get-with-queries-namespace-not-belong-project', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    /**
                     * Get all namespace. If no namespace exists, a default namespace is created and returned
                     */
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body[0].name === 'Default');
                            expect(res.body[0].id === savedProject._id);

                            let namespace_id = res.body[0].id;

                            let kb1 = {
                                name: "example_name1",
                                type: "url",
                                namespace: namespace_id,
                                source: "https://www.exampleurl1.com",
                                content: ""
                            }

                            /**
                             * Add contents to default namespace
                             */
                            chai.request(server)
                                .post('/' + savedProject._id + "/kb")
                                .auth(email, pwd)
                                .send(kb1)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb1 res.body: ", res.body); }

                                    res.should.have.status(200);

                                    let namespace_id = "fakenamespaceid";

                                    let query = "?status=100&type=url&limit=5&page=0&direction=-1&sortField=updatedAt&search=example&namespace=" + namespace_id;

                                    chai.request(server)
                                        .get('/' + savedProject._id + "/kb" + query)
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("getall res.body: ", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            res.body.kbs.should.be.a('array');
                                            expect(res.body.kbs.length).to.equal(0);
                                            expect(res.body.count).to.equal(0);

                                            done();

                                        })
                                })
                        })
                })
            })
        }).timeout(20000)

        it('add-multiple-faqs-with-csv', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/csv?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/csv')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-kb-faqs.csv')), 'example-kb-faqs.csv')
                                .field('delimiter', ';')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);

                                    done();

                                })
                        })
                });
            });

        }).timeout(10000)


        /**
         * If you try to add content to a project that has no namespace, it returns 403 forbidden.
         */
        it('add-multiple-urls-no-namespaces', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kb/multi?namespace=123456')
                        .auth(email, pwd)
                        .set('Content-Type', 'text/plain')
                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(403);
                            res.should.be.a('object')
                            expect(res.body.success).to.equal(false);
                            let error_response = "No namespace found for the selected project " + savedProject._id + ". Cannot add content to a non-existent namespace."
                            expect(res.body.error).to.equal(error_response);

                            done();

                        })
                });
            });

        }).timeout(10000)


        /**
         * If you try to add content to a namespace that does not belong to the selected project and 
         * the project has at least one namesapce, it returns 403 forbidden.
         */
        it('add-multiple-urls-namespace-not-belong-project', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/multi?namespace=fakenamespaceid')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(403);
                                    res.should.be.a('object');
                                    expect(res.body.success).to.equal(false);
                                    let error_response = "Not allowed. The namespace does not belong to the current project."
                                    expect(res.body.error).to.equal(error_response);

                                    done();

                                })
                        })
                });
            });

        }).timeout(10000)

        it('add-multiple-urls-success', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/multi?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);
                                    expect(res.body.length).to.equal(4)

                                    done();

                                })
                        })
                });
            });

        }).timeout(10000)

        it('add-multiple-urls-with-scrape-option-success-type-4', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/multi?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .send({ list:["https://gethelp.tiledesk.com/article"], scrape_type: 4,  scrape_options: { tags_to_extract: ["article","p"], unwanted_tags:["script","style"], unwanted_classnames:["header","related-articles"]}})
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);
                                    expect(res.body.length).to.equal(1)
                                    expect(res.body[0].scrape_type).to.equal(4)
                                    expect(typeof res.body[0].scrape_options === "undefined").to.be.false;
                                    expect(res.body[0].scrape_options.tags_to_extract.length).to.equal(2);
                                    expect(res.body[0].scrape_options.unwanted_tags.length).to.equal(2);
                                    expect(res.body[0].scrape_options.unwanted_classnames.length).to.equal(2);

                                    done();

                                })
                        })
                });
            });

        }).timeout(10000)

        it('add-multiple-urls-with-scrape-option-success-type-3', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/multi?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .send({ list:["https://gethelp.tiledesk.com/article"], scrape_type: 3 })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);
                                    expect(res.body.length).to.equal(1)
                                    expect(res.body[0].scrape_type).to.equal(3)
                                    expect(typeof res.body[0].scrape_options === null);

                                    done();

                                })
                        })
                });
            });

        }).timeout(10000)

        it('expand-sitemap', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/kb/sitemap')
                        .auth(email, pwd)
                        // .send({ sitemap: "https://www.wired.it/sitemap.xml" })
                        .send({ sitemap: "https://gethelp.tiledesk.com/sitemap.xml" })
                        .end((err, res) => {

                            if (err) { console.log("error: ", err) };
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.sites.should.be.a('array');

                            done();

                        })

                });
            });

        }).timeout(10000)

        it('scrape-single', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            let kb = {
                                name: "https://www.exampleurl6.com",
                                type: "url",
                                source: "https://www.exampleurl6.com",
                                content: "",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb')
                                .auth(email, pwd)
                                .send(kb) // can be empty
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);

                                    let kbid = res.body.value._id;

                                    chai.request(server)
                                        .post('/' + savedProject._id + "/kb/scrape/single")
                                        .auth(email, pwd)
                                        .send({ id: kbid })
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("single scrape res.body: ", res.body); }

                                            /**
                                             * Unable to verify the response due to an external request
                                             */

                                            //res.should.have.status(200);
                                            // res.body.should.be.a('object');
                                            // expect(res.body.id_project).to.equal(savedProject._id.toString())
                                            // expect(res.body.maxKbsNumber).to.equal(3);
                                            // expect(res.body.maxPagesNumber).to.equal(1000);
                                            // expect(res.body.kbs).is.an('array').that.is.empty;
                                            done();

                                        })
                                })
                        })
                });
            });
        });


        // OLD TESTS
        // it('createNewKb', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb = {
        //                 name: "example_name5",
        //                 type: "url",
        //                 source: "https://www.exampleurl5.com",
        //                 content: "",
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb')
        //                 .auth(email, pwd)
        //                 .send(kb) // can be empty
        //                 .end((err, res) => {

        //                     if (err) { console.error("err: ", err); }
        //                     if (log) { console.log("create kb res.body: ", res.body); }

        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');

        //                     done();


        //                 })

        //         });
        //     });

        // }).timeout(10000);

        // logic in standby
        // it('createNewKb-namespaceNotBelongsProject', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb = {
        //                 name: "example_name5",
        //                 type: "url",
        //                 source: "https://www.exampleurl5.com",
        //                 content: "",
        //                 namespace: "fakenamespace"
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb')
        //                 .auth(email, pwd)
        //                 .send(kb) // can be empty
        //                 .end((err, res) => {

        //                     if (err) { console.error("err: ", err); }
        //                     if (log) { console.log("create kb res.body: ", res.body); }

        //                     res.should.have.status(403);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.success).to.equal(false);
        //                     expect(res.body.error).to.equal("Not allowed. The namespace does not belong to the current project.");

        //                     done();


        //                 })

        //         });
        //     });

        //}).timeout(10000);

        // it('createNewKb-replaceNamespace', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb = {
        //                 name: "example_name5",
        //                 type: "url",
        //                 source: "https://www.exampleurl5.com",
        //                 content: "",
        //                 namespace: "fakenamespace"
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb')
        //                 .auth(email, pwd)
        //                 .send(kb) // can be empty
        //                 .end((err, res) => {

        //                     if (err) { console.error("err: ", err); }
        //                     if (log) { console.log("create kb res.body: ", res.body); }

        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     expect(res.body.value.namespace).not.equal("fakenamespace");
        //                     expect(res.body.value.namespace).to.equal(savedProject._id.toString());

        //                     done();


        //                 })

        //         });
        //     });

        // }).timeout(10000);

        // it('getWithQueries', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb1 = {
        //                 name: "example_name1",
        //                 type: "url",
        //                 source: "https://www.exampleurl1.com",
        //                 content: ""
        //             }

        //             let kb2 = {
        //                 name: "example_name2",
        //                 type: "text",
        //                 source: "example_name2",
        //                 content: "example content"
        //             }

        //             let kb3 = {
        //                 name: "example_name3",
        //                 type: "url",
        //                 source: "https://www.exampleurl3.com",
        //                 content: ""
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + "/kb")
        //                 .auth(email, pwd)
        //                 .send(kb1)
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kb res.body: ", res.body); }
        //                     res.should.have.status(200);

        //                     setTimeout(() => {
        //                         chai.request(server)
        //                             .post('/' + savedProject._id + "/kb")
        //                             .auth(email, pwd)
        //                             .send(kb2)
        //                             .end((err, res) => {
        //                                 if (log) { console.log("create kb res.body: ", res.body); }
        //                                 res.should.have.status(200);

        //                                 setTimeout(() => {
        //                                     chai.request(server)
        //                                         .post('/' + savedProject._id + "/kb")
        //                                         .auth(email, pwd)
        //                                         .send(kb3)
        //                                         .end((err, res) => {
        //                                             if (log) { console.log("create kb res.body: ", res.body); }
        //                                             res.should.have.status(200);

        //                                             let query = "?status=100&type=url&limit=5&page=0&direction=-1&sortField=updatedAt&search=example";
        //                                             //let query = "";
        //                                             console.log("query: ", query);

        //                                             chai.request(server)
        //                                                 .get('/' + savedProject._id + "/kb" + query)
        //                                                 .auth(email, pwd)
        //                                                 .end((err, res) => {
        //                                                     if (log) { console.log("getall res.body: ", res.body); }
        //                                                     res.should.have.status(200);
        //                                                     res.body.should.be.a('object');
        //                                                     res.body.kbs.should.be.a('array');
        //                                                     expect(res.body.kbs.length).to.equal(2);
        //                                                     expect(res.body.count).to.equal(2);
        //                                                     res.body.query.should.be.a('object');
        //                                                     expect(res.body.query.status).to.equal(100);
        //                                                     expect(res.body.query.limit).to.equal(5);
        //                                                     expect(res.body.query.page).to.equal(0);
        //                                                     expect(res.body.query.direction).to.equal(-1);
        //                                                     expect(res.body.query.sortField).to.equal("updatedAt");
        //                                                     expect(res.body.query.search).to.equal("example");

        //                                                     done();

        //                                                 })

        //                                         })
        //                                 }, 1000)
        //                             })
        //                     }, 1000)


        //                 })
        //         })
        //     })
        // }).timeout(20000)

        // it('scrapeSingle', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb = {
        //                 name: "example_name6",
        //                 type: "url",
        //                 source: "https://www.exampleurl6.com",
        //                 content: ""
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb')
        //                 .auth(email, pwd)
        //                 .send(kb) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kb res.body: ", res.body); }
        //                     res.should.have.status(200);

        //                     let kbid = res.body.value._id;
        //                     console.log("kbid: ", kbid)
        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kb/scrape/single")
        //                         .auth(email, pwd)
        //                         .send({ id: kbid })
        //                         .end((err, res) => {
        //                             if (log) { console.log("single scrape res.body: ", res.body); }
        //                             //res.should.have.status(200);
        //                             // res.body.should.be.a('object');
        //                             // expect(res.body.id_project).to.equal(savedProject._id.toString())
        //                             // expect(res.body.maxKbsNumber).to.equal(3);
        //                             // expect(res.body.maxPagesNumber).to.equal(1000);
        //                             // expect(res.body.kbs).is.an('array').that.is.empty;
        //                             done();

        //                         })


        //                     // res.body.should.be.a('object');
        //                     // expect(res.body.id_project).to.equal(savedProject._id.toString());




        //                 })

        //         });
        //     });

        // });

        // it('scrapeSingle-namespaceNotBelongsProject', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             let kb = {
        //                 name: "example_name6",
        //                 type: "url",
        //                 source: "https://www.exampleurl6.com",
        //                 content: ""
        //             }

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb')
        //                 .auth(email, pwd)
        //                 .send(kb) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kb res.body: ", res.body); }
        //                     res.should.have.status(200);

        //                     let kbid = res.body.value._id;
        //                     console.log("kbid: ", kbid)
        //                     chai.request(server)
        //                         .post('/' + savedProject._id + "/kb/scrape/single")
        //                         .auth(email, pwd)
        //                         .send({ id: kbid })
        //                         .end((err, res) => {
        //                             if (log) { console.log("single scrape res.body: ", res.body); }
        //                             //res.should.have.status(200);
        //                             // res.body.should.be.a('object');
        //                             // expect(res.body.id_project).to.equal(savedProject._id.toString())
        //                             // expect(res.body.maxKbsNumber).to.equal(3);
        //                             // expect(res.body.maxPagesNumber).to.equal(1000);
        //                             // expect(res.body.kbs).is.an('array').that.is.empty;
        //                             done();

        //                         })


        //                     // res.body.should.be.a('object');
        //                     // expect(res.body.id_project).to.equal(savedProject._id.toString());




        //                 })
        //         });
        //     });
        // });

        // it('multiadd', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb/multi')
        //                 .auth(email, pwd)
        //                 .set('Content-Type', 'text/plain')
        //                 .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
        //                 .end((err, res) => {

        //                     // console.log("res.body: ", res.body)
        //                     res.should.have.status(200);
        //                     expect(res.body.length).to.equal(4)

        //                     done();

        //                     // setTimeout(() => {

        //                     //     chai.request(server)
        //                     //         .post('/' + savedProject._id + '/kb/multi')
        //                     //         .auth(email, pwd)
        //                     //         .set('Content-Type', 'text/plain')
        //                     //         .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
        //                     //         .end((err, res) => {

        //                     //             // console.log("res.body: ", res.body);
        //                     //             res.should.have.status(200);
        //                     //             expect(res.body.length).to.equal(4)

        //                     //             done()
        //                     //         })
        //                     // }, 2000)

        //                 })

        //         });
        //     });

        // }).timeout(10000)

        // it('multiaddFail', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb/multi')
        //                 .auth(email, pwd)
        //                 .set('Content-Type', 'text/plain')
        //                 .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
        //                 .end((err, res) => {

        //                     // console.log("res.body: ", res.body)
        //                     res.should.have.status(200);
        //                     expect(res.body.length).to.equal(4)

        //                     setTimeout(() => {

        //                         chai.request(server)
        //                             .post('/' + savedProject._id + '/kb/multi')
        //                             .auth(email, pwd)
        //                             .set('Content-Type', 'text/plain')
        //                             .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './kbUrlsList.txt')), 'kbUrlsList.txt')
        //                             .end((err, res) => {

        //                                 // console.log("res.body: ", res.body);
        //                                 res.should.have.status(200);
        //                                 expect(res.body.length).to.equal(4)

        //                                 done()
        //                             })
        //                     }, 2000)

        //                 })

        //         });
        //     });

        // }).timeout(10000)

        // it('tooManyUrls', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb/multi')
        //                 .auth(email, pwd)
        //                 .set('Content-Type', 'text/plain')
        //                 .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './TooManykbUrlsList.txt')), 'TooManykbUrlsList.txt')
        //                 .end((err, res) => {

        //                     // console.log("res.body: ", res.body)
        //                     res.should.have.status(403);
        //                     expect(res.body.success).to.equal(false);
        //                     expect(res.body.error).to.equal("Too many urls. Can't index more than 300 urls at a time.");

        //                     done()

        //                 })

        //         });
        //     });

        // })

        // logic in standby
        // it('askkb-namespaceNotBelongsProject', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        //         projectService.create("test-kb-qa", savedUser._id).then((savedProject) => {

        //             /**
        //              * README
        //              * Namespace should be equal to savedProject._id;
        //              * A generic mongodb ID (like user id) is used instead for test porpouse
        //              */
        //             chai.request(server)
        //                 .post('/' + savedProject._id + "/kb/qa")
        //                 .auth(email, pwd)
        //                 .send({ model: "gpt-4", namespace: savedUser._id, question: "sample question"})
        //                 .end((err, res) => {

        //                     if (err) { console.log("error: ", err) };
        //                     if (log) { console.log("res.body: ", res.body) };

        //                     res.should.have.status(403); 
        //                     res.body.should.be.a('object');
        //                     expect(res.body.success).to.equal(false);
        //                     expect(res.body.error).to.equal("Not allowed. The namespace does not belong to the current project.");

        //                     done();                            
        //                 })
        //         })
        //     })
        // }).timeout(10000)


        // it('sitemap', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kb/sitemap')
        //                 .auth(email, pwd)
        //                 // .send({ sitemap: "https://www.wired.it/sitemap.xml" })
        //                 .send({ sitemap: "https://gethelp.tiledesk.com/sitemap.xml" })
        //                 .end((err, res) => {

        //                     if (err) { console.log("error: ", err) };
        //                     if (log) { console.log("res.body: ", res.body) }

        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');
        //                     res.body.sites.should.be.a('array');

        //                     done();

        //                 })

        //         });
        //     });

        // }).timeout(10000)

        // Ask KB
        // it('askkb-key-from-integrations', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        //         projectService.create("test-kb-qa", savedUser._id).then((savedProject) => {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + "/integration/")
        //                 .auth(email, pwd)
        //                 .send({ name: "openai", value: { apikey: "sk-testkey", organization: "Testkey" } })
        //                 .end((err, res) => {

        //                     if (err) { console.error("err: ", err) };
        //                     if (log) { console.log("res.body: ", res.body) };
        //                     console.log("Integration created..")

        //                     chai.request(server)
        //                         .get('/' + savedProject._id + '/kb/namespace/all')
        //                         .auth(email, pwd)
        //                         .end((err, res) => {
    
        //                             if (err) { console.error("err: ", err); }
        //                             if (log) { console.log("get all namespaces res.body: ", res.body); }
                                    
        //                             console.log("namespace created..")

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + "/kb/qa")
        //                                 .auth(email, pwd)
        //                                 .send({ model: "gpt-4o", namespace: savedProject._id, question: "sample question" })
        //                                 .end((err, res) => {

        //                                     if (err) { console.error("err: ", err) };
        //                                     if (log) { console.log("res.body: ", res.body) };
        //                                     console.log("res.body: ", res.body)
        //                                     done();
        //                                 })


        //                         })

        //                 })
        //         })
        //     })
        // }).timeout(10000)

        // Ask KB
        it('askkb-key-from-env', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-kb-qa", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            chai.request(server)
                                .post('/' + savedProject._id + "/kb/qa")
                                .auth(email, pwd)
                                .send({ model: "gpt-4o", namespace: savedProject._id, question: "sample question", advancedPrompt: true, system_context: "You are a robot coming from future" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    done();
                                })


                        })
                })
            })
        }).timeout(10000)


        it('webhook', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-kb-webhook", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.log("error: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('array');

                            let namespace_id = res.body[0].id;

                            let kb = {
                                name: "example_name6",
                                type: "url",
                                source: "https://www.exampleurl6.com",
                                content: "",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/')
                                .auth(email, pwd)
                                .send(kb)
                                .end((err, res) => {

                                    if (err) { console.log("error: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');

                                    let kb_id = res.body.value._id;

                                    chai.request(server)
                                        .post('/webhook/kb/status')
                                        .set("x-auth-token", "testtoken")
                                        .send({ id: kb_id, status: 300 })
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err) };
                                            if (log) { console.log("res.body: ", res.body) };

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.status).to.equal(300);

                                            done();

                                        })


                                })
                        })




                });
            });
        }).timeout(10000)

    })

    
    describe('/namespaces', () => {


        /**
         * Get all namespaces of a project.
         * If there isn't namespaces for a project_id, the default namespace is created and returned.
         */
        it('get-namespaces-1', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body.length).to.equal(1);
                            should.not.exist(res.body[0]._id);
                            //expect(res.body[0]._id).to.equal(undefined);
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");
                            should.exist(res.body[0].engine)
                            expect(res.body[0].engine.name).to.equal('pinecone')

                            done();


                        })

                });
            });

        })

        /**
         * Get all namespaces of a project.
         * If there isn't namespaces for a project_id, the default namespace is created and returned.
         */
        it('create-and-get-namespaces', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    // Get all namespaces. Create default namespace and return.
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body.length).to.equal(1);
                            should.not.exist(res.body[0]._id);
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");

                            // Create another namespace
                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/namespace')
                                .auth(email, pwd)
                                .send({ name: "MyCustomNamespace" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) }
                                    if (log) { console.log("create new namespace res.body: ", res.body) }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    should.not.exist(res.body._id)
                                    should.exist(res.body.id)
                                    expect(res.body.name).to.equal('MyCustomNamespace');

                                    // Get again all namespace. A new default namespace should not be created.
                                    chai.request(server)
                                        .get('/' + savedProject._id + '/kb/namespace/all')
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('array');
                                            expect(res.body.length).to.equal(2);
                                            should.not.exist(res.body[0]._id);
                                            should.not.exist(res.body[1]._id);
                                            should.exist(res.body[0].id);
                                            should.exist(res.body[1].id);

                                            done();
                                        })
                                })
                        })
                });
            });
        })

        it('create-namespaces-with-engine', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    // Get all namespaces. Create default namespace and return.
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body.length).to.equal(1);
                            should.not.exist(res.body[0]._id);
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");
                            should.exist(res.body[0].engine)
                            expect(res.body[0].engine.name).to.equal('pinecone');
                            expect(res.body[0].engine.type).to.equal('pod');

                            // Create another namespace
                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/namespace')
                                .auth(email, pwd)
                                .send({ name: "MyCustomNamespace" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) }
                                    if (log) { console.log("create new namespace res.body: ", res.body) }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    should.not.exist(res.body._id)
                                    should.exist(res.body.id)
                                    expect(res.body.name).to.equal('MyCustomNamespace');
                                    should.exist(res.body.engine)
                                    expect(res.body.engine.name).to.equal('pinecone');
                                    expect(res.body.engine.type).to.equal('pod');

                                    // Get again all namespace. A new default namespace should not be created.
                                    chai.request(server)
                                        .get('/' + savedProject._id + '/kb/namespace/all')
                                        .auth(email, pwd)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('array');
                                            expect(res.body.length).to.equal(2);
                                            should.not.exist(res.body[0]._id);
                                            should.not.exist(res.body[1]._id);
                                            should.exist(res.body[0].id);
                                            should.exist(res.body[1].id);

                                            done();
                                        })
                                })
                        })
                });
            });
        })

        /**
         * Update namespaces
         */
        it('update-namespace', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    // Get all namespaces. Create default namespace and return.
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body.length).to.equal(1);
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");

                            let namespace_id = res.body[0].id;

                            let new_settings = {
                                model: 'gpt-4o',
                                max_tokens: 256,
                                temperature: 0.3,
                                top_k: 6,
                                context: "You are an awesome AI Assistant."
                            }

                            // Update namespace
                            chai.request(server)
                                .put('/' + savedProject._id + '/kb/namespace/' + namespace_id)
                                .auth(email, pwd)
                                .send({ name: "New Name", preview_settings: new_settings })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) }
                                    if (log) { console.log("update namespace res.body: ", res.body) }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    should.not.exist(res.body._id);
                                    should.exist(res.body.id);
                                    expect(res.body.name).to.equal('New Name');
                                    expect(res.body.preview_settings.model).to.equal('gpt-4o')
                                    expect(res.body.preview_settings.max_tokens).to.equal(256)
                                    expect(res.body.preview_settings.temperature).to.equal(0.3)
                                    expect(res.body.preview_settings.top_k).to.equal(6)

                                    done();

                                })
                        })
                });
            });
        })

        /**
         * Delete default namespace - Forbidden
         */
        it('fail-to-delete-default-namespace', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    // Get all namespaces. Create default namespace and return.
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body.length).to.equal(1);
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");

                            let namespace_id = res.body[0].id;

                            // Update namespace
                            chai.request(server)
                                .delete('/' + savedProject._id + '/kb/namespace/' + namespace_id)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) }
                                    if (log) { console.log("delete namespace res.body: ", res.body) }

                                    res.should.have.status(403);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(false);
                                    expect(res.body.error).to.equal('Default namespace cannot be deleted');

                                    done();

                                })
                        })
                });
            });
        })


        it('get-chatbots-from-namespace', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create('test-faqkb-create', savedUser._id).then((savedProject) => {
                    faqService.create("testbot1", null, savedProject._id, savedUser._id).then((savedBot1) => {
                        faqService.create("testbot2", null, savedProject._id, savedUser._id).then((savedBot2) => {

                            chai.request(server)
                                .get('/' + savedProject._id + '/kb/namespace/all')
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("get all namespaces res.body: ", res.body); }

                                    res.should.have.status(200);

                                    let namespace_id = res.body[0].id;
                                    if (log) { console.log("namespace_id: ", namespace_id) }

                                    let newFaq1 = new faq({
                                        id_faq_kb: savedBot1._id,
                                        id_project: savedProject._id,
                                        intent_id: "new-faq-1",
                                        createdBy: savedUser._id,
                                        updatedBy: savedUser._id,
                                        actions: [{ "_tdActionType": "askgptv2", "_tdActionId": "f58212f9-1a8c-4623-b6fa-0f34e57d9999", "namespace": namespace_id }]
                                    })

                                    newFaq1.save((err, saved1) => {
                                        if (err) { console.error("err1: ", err) };
                                        if (log) { console.log("faq1 saved: ", saved1) };

                                        let newFaq2 = new faq({
                                            id_faq_kb: savedBot2._id,
                                            id_project: savedProject._id,
                                            intent_id: "new-faq-2",
                                            createdBy: savedUser._id,
                                            updatedBy: savedUser._id,
                                            actions: [{ "_tdActionType": "reply", "_tdActionId": "f58212f9-1a8c-4623-b6fa-0f34e57d9998" }]
                                        })

                                        newFaq2.save((err, saved2) => {
                                            if (err) { console.error("err2: ", err) };
                                            if (log) { console.log("faq2 saved: ", saved2) };

                                            chai.request(server)
                                                .get('/' + savedProject._id + '/kb/namespace/' + namespace_id + '/chatbots')
                                                .auth(email, pwd)
                                                .end((err, res) => {

                                                    if (err) { console.error("err: ", err) };
                                                    if (log) { console.log("get chatbots from namespace res.body: ", res.body) };
                                                    
                                                    res.should.have.status(200);
                                                    res.body.should.be.a('array');
                                                    expect(res.body.length).to.equal(1);
                                                    expect(res.body[0]._id).to.equal((savedBot1._id).toString());
                                                    expect(res.body[0].name).to.equal('testbot1');

                                                    done();
                                                })
                                        })
                                    })
                                })

                        })
                    })
                })
            })
        }).timeout(10000)

        /**
         * Delete namespace
         * !! Unable to test it due to external request
         */
        // it('delete-namespace', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     nock('https://api.openai.com')
        //         .post('/v1/namespaces/delete')
        //         .reply(200, { success: true });

        //     userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
        //         projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

        //             // Get all namespaces. Create default namespace and return.
        //             chai.request(server)
        //                 .get('/' + savedProject._id + '/kb/namespace/all')
        //                 .auth(email, pwd)
        //                 .end((err, res) => {

        //                     if (err) { console.error("err: ", err); }
        //                     if (log) { console.log("get all namespaces res.body: ", res.body); }

        //                     res.should.have.status(200);
        //                     res.body.should.be.a('array');
        //                     expect(res.body.length).to.equal(1);
        //                     expect(res.body[0].namespace_id).to.equal(savedProject._id.toString());
        //                     expect(res.body[0].name).to.equal("Default");

        //                     // Create another namespace
        //                     chai.request(server)
        //                         .post('/' + savedProject._id + '/kb/namespace')
        //                         .auth(email, pwd)
        //                         .send({ name: "MyCustomNamespace" })
        //                         .end((err, res) => {

        //                             if (err) { console.error("err: ", err) }
        //                             if (log) { console.log("create new namespace res.body: ", res.body) }

        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');
        //                             expect(res.body.name).to.equal('MyCustomNamespace');

        //                             let namespace_to_delete = res.body.namespace_id;
        //                             console.log("namespace_to_delete: ", namespace_to_delete);

        //                             // Get again all namespace. A new default namespace should not be created.
        //                             chai.request(server)
        //                                 .get('/' + savedProject._id + '/kb/namespace/all')
        //                                 .auth(email, pwd)
        //                                 .end((err, res) => {

        //                                     if (err) { console.error("err: ", err); }
        //                                     if (log) { console.log("get all namespaces res.body: ", res.body); }

        //                                     res.should.have.status(200);
        //                                     res.body.should.be.a('array');
        //                                     expect(res.body.length).to.equal(2);

        //                                     console.log("namespace_to_delete: ", namespace_to_delete);

        //                                     chai.request(server)
        //                                         .delete('/' + savedProject._id + '/kb/namespace/' + namespace_to_delete)
        //                                         .auth(email, pwd)
        //                                         .end((err, res) => {

        //                                             if (err) { console.error("err: ", err); }
        //                                             if (log) { console.log("delete namespaces res.body: ", res.body); }

        //                                             res.should.have.status(200);

        //                                             done();
        //                                         })
        //                                 })
        //                         })
        //                 })
        //         });
        //     });
        // })

    })
});



