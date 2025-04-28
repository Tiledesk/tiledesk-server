//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

var projectService = require('../services/projectService');
var userService = require('../services/userService');
let chatbot_mock = require('./chatbot-mock');
let log = false;

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('WebhookRoute', () => {

    it('create-new-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.async).to.equal(true);
                                expect(res.body.id_project).to.equal(savedProject._id.toString());
                                expect(res.body.chatbot_id).to.equal(chatbot_id);
                                expect(res.body.block_id).to.equal(webhook_intent_id);
                                should.exist(res.body.webhook_id)
                                expect(res.body).to.haveOwnProperty('webhook_id')
                                expect(res.body.webhook_id).to.have.length(32)

                                done();

                            });
                    });
            });
        });
    })

    it('create-and-get-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                chai.request(server)
                                    .get('/' + savedProject._id + '/webhooks/' + chatbot_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.async).to.equal(true);
                                        expect(res.body.id_project).to.equal(savedProject._id.toString());
                                        expect(res.body.chatbot_id).to.equal(chatbot_id);
                                        expect(res.body.block_id).to.equal(webhook_intent_id);
                                        should.exist(res.body.webhook_id)
                                        expect(res.body).to.haveOwnProperty('webhook_id')
                                        expect(res.body.webhook_id).to.have.length(32)

                                    })

                                done();

                            });
                    });
            });
        });
    })

    it('update-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.async).to.equal(true);

                                chai.request(server)
                                    .put('/' + savedProject._id + '/webhooks/' + chatbot_id)
                                    .auth(email, pwd)
                                    .send({ async: false })
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.async).to.equal(false);

                                        done();

                                    });
                            });

                    });
            });
        });
    })

    it('rigenerate-url-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                let old_webhook_id = res.body.webhook_id;

                                chai.request(server)
                                    .put('/' + savedProject._id + '/webhooks/' + chatbot_id + "/regenerate")
                                    .auth(email, pwd)
                                    .send()
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        should.exist(res.body.webhook_id)
                                        expect(res.body.webhook_id).to.have.length(32)
                                        expect(res.body.webhook_id).to.not.equal(old_webhook_id);

                                        done();

                                    });
                            });

                    });
            });
        });
    })

    it('delete-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                chai.request(server)
                                    .delete('/' + savedProject._id + '/webhooks/' + chatbot_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(true);
                                        expect(res.body.message).to.equal("Webhook for chatbot " + chatbot_id +  " deleted successfully")

                                        done();

                                    });
                            });

                    });
            });
        });
    })

    it('preload-and-run-webhook', (done) => {
        
        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-preload", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ name: "testbot", type: "tilebot", subtype: "webhook", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                let webhook_id = res.body.webhook_id;

                                chai.request(server)
                                    .post('/' + savedProject._id + '/webhooks/preload/' + webhook_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(true);
                                        expect(res.body.message).to.equal("Webhook preloaded successfully");
                                        assert(res.body.request_id.startsWith('automation-request-' + savedProject._id ))

                                        chai.request(server)
                                            .post('/webhook/' + webhook_id + "/dev")
                                            .auth(email, pwd)
                                            .end((err, res) => {
        
                                                if (err) { console.error("err: ", err); }
                                                if (log) { console.log("res.body", res.body); }
        
                                                res.should.have.status(200);
                                                res.body.should.be.a('object');
                                                expect(res.body.success).to.equal(true);
                                                expect(res.body.message).to.equal("Webhook disabled in test mode");
        

                                                done();
        
                                            });
                                    })
                            });

                    });
            });
        });
    })

    it('run-webhook-without-preloading', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-preload", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ name: "testbot", type: "tilebot", subtype: "webhook", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                let webhook_id = res.body.webhook_id;

                                chai.request(server)
                                    .post('/webhook/' + webhook_id + "/dev")
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(422);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(false);
                                        expect(res.body.message).to.equal("Development webhook is currently turned off");
                                        expect(res.body.code).to.equal(13001);

                                        done();

                                    });
                            });

                    });
            });
        });
    })

    it('run-draft-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .post('/' + savedProject._id + '/webhooks/')
                            .auth(email, pwd)
                            .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                let webhook_id = res.body.webhook_id;

                                chai.request(server)
                                    .post('/webhook/' + webhook_id)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(true);
                                        expect(res.body.message).to.equal("Webhook disabled in test mode");

                                        done();

                                    });
                            });

                    });
            });
        });
    })

    it('run-published-webhook', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-webhook-create", savedUser._id).then(function (savedProject) {

                class chatbot_service {
                    async fork(id_faq_kb, api_url, token, project_id) {
                        let forked_bot_id = id_faq_kb.substr(id_faq_kb, id_faq_kb.length - 4) + "1111";
                        return { bot_id: forked_bot_id }
                    }
                }

                server.set('chatbot_service', new chatbot_service());

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "tilebot", language: "en", template: "blank" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        let chatbot_id = res.body._id;
                        let webhook_intent_id = "3bfda939-ff76-4762-bbe0-fc0f0dc4c777"

                        chai.request(server)
                            .put('/' + savedProject._id + '/faq_kb/' + chatbot_id + '/publish') 
                            .auth(email, pwd)
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                chai.request(server)
                                    .post('/' + savedProject._id + '/webhooks/')
                                    .auth(email, pwd)
                                    .send({ chatbot_id: chatbot_id, block_id: webhook_intent_id })
                                    .end((err, res) => {
        
                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }
        
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
        
                                        let webhook_id = res.body.webhook_id;
        
                                        chai.request(server)
                                            .post('/webhook/' + webhook_id)
                                            .auth(email, pwd)
                                            .end((err, res) => {
        
                                                if (err) { console.error("err: ", err); }
                                                if (log) { console.log("res.body", res.body); }
        
                                                res.should.have.status(200);
                                                res.body.should.be.a('object');
                                                expect(res.body.success).to.equal(true);
                                                expect(res.body.message).to.equal("Webhook disabled in test mode");
        
                                                done();
        
                                            });
                                    });

                            })
                    });
            });
        });
    })
});
