//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.GPTKEY = "fakegptkey";
process.env.LOG_LEVEL = 'critical'
process.env.KB_WEBHOOK_TOKEN = "testtoken"
process.env.PINECONE_INDEX = "test-index";
process.env.PINECONE_TYPE = "serverless";
process.env.PINECONE_INDEX_HYBRID = "test-index-hybrid";
process.env.PINECONE_TYPE_HYBRID = "serverless";
process.env.ADMIN_EMAIL = "admin@tiledesk.com";

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

let custom_profile_sample = { 
    name: "Custom",
    type: "payment",
    subStart: new Date(),
    subEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    customization: { hybrid: true } 
}

mongoose.connect(config.databasetest);

chai.use(chaiHttp);

describe('KbRoute', () => {
    
    describe('/qa', () => {
        
        it('ask-kb', (done) => {


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
                            expect(res.body[0].engine.index_name).to.equal('test-index')

                            let namespace_id = res.body[0].id;

                            let data = {
                                question: "sample question?",
                                namespace: namespace_id,
                                llm: "openai",
                                model: "gpt-4o",
                                temperature: 0.7,
                                max_tokens: 128,
                                top_k: 4,
                                chunks_only: false,
                                system_context: "",
                                advancedPrompt: false,
                                citations: true
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/qa')
                                .auth(email, pwd)
                                .send(data)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("ask kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    
                                    done();
                                })
                        })
                });
            });

        })
    })

    describe('Namespaces', () => {

        /**
         * Get all namespaces of a project.
         * If there isn't namespaces for a project_id, the default namespace is created and returned.
         */
        it('get-all-namespaces', (done) => {

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
                            expect(res.body[0].id).to.equal(savedProject._id.toString());
                            expect(res.body[0].name).to.equal("Default");
                            should.exist(res.body[0].engine);
                            expect(res.body[0].engine.name).to.equal('pinecone');
                            expect(res.body[0].engine.type).to.equal('serverless');
                            expect(res.body[0].engine.vector_size).to.equal(1536);
                            expect(res.body[0].engine.index_name).to.equal('test-index');
                            should.exist(res.body[0].embedding);
                            expect(res.body[0].embedding.provider).to.equal('openai')
                            expect(res.body[0].embedding.name).to.equal('text-embedding-ada-002')
                            expect(res.body[0].embedding.dimension).to.equal(1536)

                            done();
                        })

                });
            });

        })

        it('create-namespaces-with-engine-similarity', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

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
                            expect(res.body.engine.type).to.equal('serverless');
                            expect(res.body.engine.vector_size).to.equal(1536);
                            expect(res.body.engine.index_name).to.equal('test-index');
                            should.exist(res.body.embedding);
                            expect(res.body.embedding.provider).to.equal('openai')
                            expect(res.body.embedding.name).to.equal('text-embedding-ada-002')
                            expect(res.body.embedding.dimension).to.equal(1536)

                            // Get again all namespace. A new default namespace should not be created.
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
                                    should.exist(res.body[0].id);

                                    done();
                                })
                        })
                });
            });
        })

        it('create-namespaces-with-engine-hybrid-rejected', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                    .post('/' + savedProject._id + '/kb/namespace')
                    .auth(email, pwd)
                    .send({ name: "MyCustomNamespace", hybrid: true })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err) }
                        if (log) { console.log("create new namespace res.body: ", res.body) }

                        res.should.have.status(403);
                        res.body.should.be.a('object');
                        expect(res.body.success).to.equal(false);
                        expect(res.body.error).to.equal('Hybrid mode is not allowed for the current project');
                        
                        done();
                    })
                });
            });
        })
        
        it('create-namespaces-with-engine-hybrid-accepted', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/auth/signin')
                        .send({ email: "admin@tiledesk.com", password: "adminadmin" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err) }
                            if (log) { console.log("login with superadmin res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);
                            expect(res.body.token).not.equal(null);

                            let superadmin_token = res.body.token;


                            chai.request(server)
                                .put('/projects/' + savedProject._id)
                                .set('Authorization', superadmin_token)
                                .send({ profile: custom_profile_sample })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) }
                                    if (log) { console.log("update project res.body: ", res.body) }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.profile.customization.hybrid).to.equal(true);

                                    chai.request(server)
                                        .post('/' + savedProject._id + '/kb/namespace')
                                        .auth(email, pwd)
                                        .send({ name: "MyCustomNamespace", hybrid: true })
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
                                            expect(res.body.engine.type).to.equal('serverless');
                                            expect(res.body.engine.vector_size).to.equal(1536);
                                            expect(res.body.engine.index_name).to.equal('test-index-hybrid');
                                            should.exist(res.body.embedding);
                                            expect(res.body.embedding.provider).to.equal('openai')
                                            expect(res.body.embedding.name).to.equal('text-embedding-ada-002')
                                            expect(res.body.embedding.dimension).to.equal(1536)
                
                                            done();
                                        })
                                })
                            
                        })
                    
                })
            });
        })

        it('import-namespace', (done) => {
            
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-namespace-import", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get all namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            expect(res.body[0].name).to.equal("Default");

                            let namespace_id = res.body[0].id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/namespace/import/' + namespace_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/exported_namespace.json')), 'exported_namespace.json')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("import contents res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Contents imported successfully");

                                    done();

                                })

                        })
                })
            })
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
                    faqService.create(savedProject._id, savedUser._id, { name: "testbot1" }).then((savedBot1) => {
                        faqService.create(savedProject._id, savedUser._id, { name: "testbot2" }).then((savedBot2) => {

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

    })

    describe('Contents', () => {

        it('add-new-content', (done) => {

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
                            expect(res.body[0].engine.index_name).to.equal('test-index');

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
                                .send(kb)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Schedule scrape skipped in test environment");

                                    let realResponse = res.body.data;
                                    expect(realResponse.lastErrorObject.updatedExisting).to.equal(false);
                                    expect(realResponse.value.id_project).to.equal(namespace_id)
                                    expect(realResponse.value.namespace).to.equal(namespace_id)
                                    expect(realResponse.value.name).to.equal("example_name5")
                                    expect(realResponse.value.type).to.equal("url")
                                    expect(realResponse.value.source).to.equal("https://www.exampleurl5.com")
                                    expect(realResponse.value.status).to.equal(-1)
                                    should.not.exist(realResponse.engine)
                                    should.not.exist(realResponse.value.engine)
                                    should.not.exist(realResponse.embedding)
                                    should.not.exist(realResponse.value.embedding)

                                    let scheduleJson = res.body.schedule_json;
                                    expect(scheduleJson.namespace).to.equal(namespace_id)
                                    expect(scheduleJson.type).to.equal("url")
                                    expect(scheduleJson.source).to.equal("https://www.exampleurl5.com")
                                    expect(scheduleJson.hybrid).to.equal(false);
                                    should.exist(scheduleJson.engine)
                                    should.exist(scheduleJson.embedding)

                                    done();
                                })
                        })
                });
            });

        })

        it('add-new-text-content', (done) => {

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

                                    let realResponse = res.body.data;
                                    expect(realResponse.value.id_project).to.equal(namespace_id)
                                    expect(realResponse.value.name).to.equal("example_text1")
                                    expect(realResponse.value.type).to.equal("text")
                                    expect(realResponse.value.source).to.equal("example_text1")
                                    expect(realResponse.value.status).to.equal(-1)
                                    expect(typeof realResponse.value.scrape_type === "undefined").to.be.true;
                                    expect(typeof realResponse.value.scrape_options === "undefined").to.be.true;

                                    done();
                                })
                        })
                });
            });

        })

        it('get-content-chunks', (done) => {

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

                                    let realResponse = res.body.data;
                                    let content_id = realResponse.value._id;

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

        it('get-contents-with-queries', (done) => {

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

        it('get-contents-with-queries-namespace-not-belong-project', (done) => {

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
                            let namespace = res.body[0];
                            let namespace_id = namespace.id;

                            expect(namespace.engine.name).to.equal("pinecone");
                            expect(namespace.engine.type).to.equal("serverless");
                            expect(namespace.engine.index_name).to.equal("test-index");
                            expect(namespace.embedding.provider).to.equal("openai");
                            expect(namespace.embedding.name).to.equal("text-embedding-ada-002");
                            expect(namespace.embedding.dimension).to.equal(1536);

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/csv?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/csv')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/example-kb-faqs.csv')), 'example-kb-faqs.csv')
                                .field('delimiter', ';')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Schedule scrape skipped in test environment");

                                    let realResponse = res.body.data;
                                    realResponse.should.be.a('array');
                                    expect(realResponse.length).to.equal(2);
                                    expect(realResponse[0].namespace).to.equal(namespace_id);
                                    expect(realResponse[0].type).to.equal('faq');
                                    expect(realResponse[0].source).to.equal('Question 1');
                                    should.not.exist(realResponse[0].engine)
                                    should.not.exist(realResponse[0].embedding)
                                    expect(realResponse[1].namespace).to.equal(namespace_id);
                                    expect(realResponse[1].type).to.equal('faq');
                                    expect(realResponse[1].source).to.equal('Question 2');
                                    should.not.exist(realResponse[1].engine)
                                    should.not.exist(realResponse[1].embedding)

                                    let scheduleJson = res.body.schedule_json;
                                    scheduleJson.should.be.a('array');
                                    expect(scheduleJson.length).to.equal(2);
                                    expect(scheduleJson[0].namespace).to.equal(namespace_id);
                                    expect(scheduleJson[0].type).to.equal('faq');
                                    expect(scheduleJson[0].source).to.equal('Question 1');
                                    should.exist(scheduleJson[0].engine)
                                    should.exist(scheduleJson[0].embedding)
                                    expect(scheduleJson[0].engine.index_name).to.equal(namespace.engine.index_name);
                                    expect(scheduleJson[0].embedding.provider).to.equal(namespace.embedding.provider);
                                    expect(scheduleJson[0].embedding.name).to.equal(namespace.embedding.name);

                                    expect(scheduleJson[1].namespace).to.equal(namespace_id);
                                    expect(scheduleJson[1].type).to.equal('faq');
                                    expect(scheduleJson[1].source).to.equal('Question 2');
                                    should.exist(scheduleJson[0].engine)
                                    should.exist(scheduleJson[0].embedding)

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
                        .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/kbUrlsList.txt')), 'kbUrlsList.txt')
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(404);
                            res.should.be.a('object')
                            expect(res.body.success).to.equal(false);
                            let error_response = "Namespace not found with id 123456"
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
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/kbUrlsList.txt')), 'kbUrlsList.txt')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(404);
                                    res.should.be.a('object');
                                    expect(res.body.success).to.equal(false);
                                    let error_response = "Namespace not found with id fakenamespaceid";
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

                            let namespace = res.body[0];
                            let namespace_id = namespace.id;

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/multi?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'text/plain')
                                .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './fixtures/kbUrlsList.txt')), 'kbUrlsList.txt')
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);

                                    let realResponse = res.body.result;
                                    expect(realResponse.length).to.equal(4);
                                    expect(realResponse[0].namespace).to.equal(namespace_id);
                                    expect(realResponse[0].source).to.equal('https://gethelp.tiledesk.com/articles/article1');
                                    should.not.exist(realResponse[0].engine);
                                    should.not.exist(realResponse[0].embedding);
                                    expect(realResponse[1].namespace).to.equal(namespace_id);
                                    expect(realResponse[1].source).to.equal('https://gethelp.tiledesk.com/articles/article2');

                                    let scheduleJson = res.body.schedule_json;
                                    expect(scheduleJson.length).to.equal(4);
                                    expect(scheduleJson[0].namespace).to.equal(namespace_id);
                                    expect(scheduleJson[0].source).to.equal('https://gethelp.tiledesk.com/articles/article1');
                                    should.exist(scheduleJson[0].engine);
                                    should.exist(scheduleJson[0].embedding);
                                    expect(scheduleJson[0].engine.index_name).to.equal(namespace.engine.index_name);
                                    expect(scheduleJson[0].embedding.provider).to.equal(namespace.embedding.provider);
                                    expect(scheduleJson[0].embedding.name).to.equal(namespace.embedding.name);

                                    expect(scheduleJson[1].namespace).to.equal(namespace_id);
                                    expect(scheduleJson[1].source).to.equal('https://gethelp.tiledesk.com/articles/article2');

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

                                    let realResponse = res.body.result;
                                    expect(realResponse.length).to.equal(1)
                                    expect(realResponse[0].scrape_type).to.equal(4)
                                    expect(typeof realResponse[0].scrape_options === "undefined").to.be.false;
                                    expect(realResponse[0].scrape_options.tags_to_extract.length).to.equal(2);
                                    expect(realResponse[0].scrape_options.unwanted_tags.length).to.equal(2);
                                    expect(realResponse[0].scrape_options.unwanted_classnames.length).to.equal(2);

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
                                .send({ list:["https://gethelp.tiledesk.com/article"], refresh_rate: 'daily', scrape_type: 3 })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    res.should.have.status(200);

                                    let realResponse = res.body.result;
                                    expect(realResponse.length).to.equal(1)
                                    expect(realResponse[0].scrape_type).to.equal(3)
                                    expect(typeof realResponse[0].scrape_options === null);

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

        it('import-sitemap', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
          
            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-kb-import-sitemap", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body) }

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            let content = {
                                name: "https://www.sitemaps.org/sitemap.xml",
                                type: "sitemap",
                                source: "https://www.sitemaps.org/sitemap.xml",
                                content: "",
                                namespace: namespace_id
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/sitemap/import?namespace=' + namespace_id)
                                .auth(email, pwd)
                                .send(content)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body: ", res.body) }

                                    let realResponse = res.body.result;
                                    realResponse.should.be.a('array');
                                    should.exist(realResponse[0]._id);
                                    should.exist(realResponse[0].sitemap_origin_id);
                                    let sitemap_content = realResponse.find(e => e.type === 'sitemap');
                                    expect(sitemap_content).not.equal(null);
                                    expect(realResponse[0].sitemap_origin).to.equal("https://www.sitemaps.org/sitemap.xml");

                                    let scheduleJson = res.body.schedule_json;
                                    scheduleJson.should.be.a('array');
                                    should.exist(scheduleJson[0].engine)
                                    should.exist(scheduleJson[0].embedding)

                                    done();
                                })

                        })
                })
            })
        }).timeout(3000)

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
                            expect(res.body[0].id_project).to.equal(savedProject._id.toString())

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
                                .send(kb)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create kb res.body: ", res.body); }

                                    res.should.have.status(200);
                                    
                                    let realResponse = res.body.data;
                                    let savedKb = realResponse.value;
                                    expect(savedKb.id_project).to.equal(savedProject._id.toString())

                                    kb.id = realResponse.value._id;

                                    chai.request(server)
                                        .post('/' + savedProject._id + "/kb/scrape/single")
                                        .auth(email, pwd)
                                        .send(kb)
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("single scrape res.body: ", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(true);
                                            expect(res.body.message).to.equal("Skip indexing in test environment");
                                            expect(res.body.data.type).to.equal('url');
                                            expect(res.body.data.namespace).to.equal(namespace_id);
                                            should.exist(res.body.data.engine);
                                            expect(res.body.data.engine.index_name).to.equal("test-index");
                                            expect(res.body.data.engine.vector_size).to.equal(1536);
                                            should.exist(res.body.data.embedding);
                                            expect(res.body.data.embedding.provider).to.equal("openai");
                                            expect(res.body.data.embedding.name).to.equal("text-embedding-ada-002");
                                            expect(res.body.data.embedding.dimension).to.equal(1536);

                                            done();

                                        })
                                })
                        })
                });
            });
        }).timeout(5000);

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

                            res.should.have.status(200)

                            chai.request(server)
                                .post('/' + savedProject._id + "/kb/qa")
                                .auth(email, pwd)
                                .send({ model: "gpt-4o", namespace: savedProject._id, question: "sample question", advancedPrompt: true, system_context: "You are a robot coming from future" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };
                                    
                                    res.should.have.status(200)
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Question skipped in test environment");
                                    expect(res.body.data.llm).to.equal("openai")
                                    expect(res.body.data.model).to.equal("gpt-4o")
                                    expect(res.body.data.gptkey).to.equal("fakegptkey");
                                    expect(res.body.data.question).to.equal("sample question");
                                    should.exist(res.body.data.engine);
                                    should.exist(res.body.data.embedding);
                                    expect(res.body.data.embedding.api_key).to.equal("fakegptkey");

                                    done();
                                })


                        })
                })
            })
        }).timeout(10000)

        it('askkb-with-hybrid-search', (done) => {

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

                            res.should.have.status(200)
                            expect(res.body.length).to.equal(1);
                            expect(res.body[0].type === "serverless");


                            chai.request(server)
                                .post('/' + savedProject._id + "/kb/qa")
                                .auth(email, pwd)
                                .send({ model: "gpt-4o", namespace: savedProject._id, question: "sample question", advancedPrompt: true, system_context: "You are a robot coming from future" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    expect(res.body.data);
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.message).to.equal("Question skipped in test environment");
                                    expect(res.body.data.llm).to.equal("openai")
                                    expect(res.body.data.model).to.equal("gpt-4o")
                                    expect(res.body.data.gptkey).to.equal("fakegptkey");
                                    expect(res.body.data.search_type === "hybrid");
                                    expect(res.body.data.question).to.equal("sample question");
                                    should.exist(res.body.data.engine);
                                    should.exist(res.body.data.embedding);
                                    expect(res.body.data.embedding.api_key).to.equal("fakegptkey");

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

                                    let realResponse = res.body.data;
                                    let kb_id = realResponse.value._id;

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

        it('webhook-reindex', (done) => {

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

                                    let realResponse = res.body.data;
                                    let kb_id = realResponse.value._id;

                                    chai.request(server)
                                        .post('/webhook/kb/reindex')
                                        .set("x-auth-token", "testtoken")
                                        .send({ content_id: kb_id })
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err) };
                                            if (log) { console.log("res.body: ", res.body) };

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(true);
                                            expect(res.body.message).to.equal("Content queued for reindexing");

                                            done();

                                        })


                                })
                        })




                });
            });
        }).timeout(10000)

    })

    
    

    describe('Unanswered Questions', () => {
        
        it('add-unanswered-question', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            let data = {
                                namespace: namespace_id,
                                question: "Come funziona il prodotto?"
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/unanswered')
                                .auth(email, pwd)
                                .send(data)
                                .end((err, res) => {
                                    
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("create unanswered question res.body: ", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.namespace).to.equal(namespace_id);
                                    expect(res.body.question).to.equal("Come funziona il prodotto?");
                                    expect(res.body.id_project).to.equal(savedProject._id.toString());
                                    done();
                                });
                        });
                });
            });
        });

        it('get-unanswered-questions', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-get", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("get namespaces res.body: ", res.body); }

                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            // First add a question
                            let data = {
                                namespace: namespace_id,
                                question: "Come funziona il prodotto?"
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/unanswered')
                                .auth(email, pwd)
                                .send(data)
                                .end((err, res) => {
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("add unanswered question res.body: ", res.body); }

                                    res.should.have.status(200);

                                    // Then get all questions
                                    chai.request(server)
                                        .get('/' + savedProject._id + '/kb/unanswered/' + namespace_id)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("get unanswered questions res.body: ", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.count).to.equal(1);
                                            expect(res.body.questions).to.be.an('array');
                                            expect(res.body.questions[0].question).to.equal("Come funziona il prodotto?");
                                            expect(res.body.questions[0].namespace).to.equal(namespace_id);
                                            done();
                                        });
                                });
                        });
                });
            });
        });

        it('delete-unanswered-question', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-delete", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            // First add a question
                            let question = {
                                namespace: namespace_id,
                                question: "Come funziona il prodotto?"
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/unanswered')
                                .auth(email, pwd)
                                .send(question)
                                .end((err, res) => {
                                    if (err) { console.error("err: ", err); }
                                    res.should.have.status(200);
                                    let questionId = res.body._id;

                                    // Then delete it
                                    chai.request(server)
                                        .delete('/' + savedProject._id + '/kb/unanswered/' + questionId)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (err) { console.error("err: ", err); }
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.be.true;
                                            expect(res.body.message).to.equal("Question deleted successfully");

                                            // Verify it's deleted
                                            chai.request(server)
                                                .get('/' + savedProject._id + '/kb/unanswered/' + namespace_id)
                                                .auth(email, pwd)
                                                .end((err, res) => {
                                                    if (err) { console.error("err: ", err); }
                                                    res.should.have.status(200);
                                                    expect(res.body.count).to.equal(0);
                                                    expect(res.body.questions).to.be.an('array').that.is.empty;
                                                    done();
                                                });
                                        });
                                });
                        });
                });
            });
        });

        it('delete-all-unanswered-questions', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-delete-all", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            // First add two questions
                            let questions = [
                                {
                                    namespace: namespace_id,
                                    question: "Come funziona il prodotto?"
                                },
                                {
                                    namespace: namespace_id,
                                    question: "Quali sono i prezzi?"
                                }
                            ];

                            Promise.all(questions.map(q => 
                                chai.request(server)
                                    .post('/' + savedProject._id + '/kb/unanswered')
                                    .auth(email, pwd)
                                    .send(q)
                            )).then(() => {
                                // Then delete all questions
                                chai.request(server)
                                    .delete('/' + savedProject._id + '/kb/unanswered/namespace/' + namespace_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {
                                        if (err) { console.error("err: ", err); }
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.be.true;
                                        expect(res.body.count).to.equal(2);
                                        expect(res.body.message).to.equal("All questions deleted successfully");

                                        // Verify they're deleted
                                        chai.request(server)
                                            .get('/' + savedProject._id + '/kb/unanswered/' + namespace_id)
                                            .auth(email, pwd)
                                            .end((err, res) => {
                                                if (err) { console.error("err: ", err); }
                                                res.should.have.status(200);
                                                expect(res.body.count).to.equal(0);
                                                expect(res.body.questions).to.be.an('array').that.is.empty;
                                                done();
                                            });
                                    });
                            });
                        });
                });
            });
        });

        it('update-unanswered-question', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-update", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            // First add a question
                            let question = {
                                namespace: namespace_id,
                                question: "Come funziona il prodotto?"
                            }

                            chai.request(server)
                                .post('/' + savedProject._id + '/kb/unanswered')
                                .auth(email, pwd)
                                .send(question)
                                .end((err, res) => {
                                    if (err) { console.error("err: ", err); }
                                    res.should.have.status(200);
                                    let questionId = res.body._id;

                                    // Then update it
                                    chai.request(server)
                                        .put('/' + savedProject._id + '/kb/unanswered/' + questionId)
                                        .auth(email, pwd)
                                        .send({ question: "Come funziona il prodotto aggiornato?" })
                                        .end((err, res) => {
                                            if (err) { console.error("err: ", err); }
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.question).to.equal("Come funziona il prodotto aggiornato?");
                                            expect(res.body.namespace).to.equal(namespace_id);
                                            done();
                                        });
                                });
                        });
                });
            });
        });

        it('count-unanswered-questions', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-unanswered-count", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .get('/' + savedProject._id + '/kb/namespace/all')
                        .auth(email, pwd)
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            res.should.have.status(200);
                            expect(res.body.length).to.equal(1);

                            let namespace_id = res.body[0].id;

                            // First add two questions
                            let questions = [
                                {
                                    namespace: namespace_id,
                                    question: "Come funziona il prodotto?"
                                },
                                {
                                    namespace: namespace_id,
                                    question: "Quali sono i prezzi?"
                                }
                            ];

                            Promise.all(questions.map(q => 
                                chai.request(server)
                                    .post('/' + savedProject._id + '/kb/unanswered')
                                    .auth(email, pwd)
                                    .send(q)
                            )).then(() => {
                                // Then count them
                                chai.request(server)
                                    .get('/' + savedProject._id + '/kb/unanswered/count/' + namespace_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {
                                        if (err) { console.error("err: ", err); }
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.count).to.equal(2);
                                        done();
                                    });
                            });
                        });
                });
            });
        });
    });

    

});
