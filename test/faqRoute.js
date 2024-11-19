//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

var User = require('../models/user');
var projectService = require('../services/projectService');
var userService = require('../services/userService');

const example_data = require('./example-json-multiple-operation-mock');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');


// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

let log = false;

chai.use(chaiHttp);

describe('FaqKBRoute', () => {

    it('create', (done) => {

        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("create bot res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        expect(res.body.public).to.exist;
                        expect(res.body.public).to.equal(false);
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", attributes: { attr1: { one: "one", two: "two"}, attr2: {three: "three"}}, intent_id: 'custom-intent-id' }) // if intent_id is null the value will be the default one
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("create intent res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.question).to.equal("question1");
                                expect(res.body.answer).to.equal("answer1");
                                expect(res.body.intent_display_name).to.not.equal(undefined);
                                expect(res.body.webhook_enabled).to.equal(false);

                                done();
                            });

                    });


            });
        });

    });

    it('create with form (createFaqKb function)', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";
        let example_form = {
            fields: [
                {
                    name: "userFullname",
                    type: "text",
                    label: "What is your name?"
                },
                {
                    name: "userEmail",
                    type: "text",
                    regex: "/^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'+/0-9=?A-Z^_`a-z{|}~]+(.[-!#$%&'+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/",
                    label: "Your email?",
                    errorLabel: "This email address is invalid\n\nCan you insert a correct email address?"
                }
            ]
        }

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
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, form: example_form })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.form).to.exist;
                                res.body.form.should.be.a('object');
                                expect(res.body.intent_display_name).to.not.equal(undefined);
                                expect(res.body.webhook_enabled).to.equal(false);

                                done();
                            });
                    });


            });
        });

    }).timeout(20000);

    it('createWithLanguage', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", language: "it" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        expect(res.body.language).to.equal("it");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.question).to.equal("question1");
                                expect(res.body.answer).to.equal("answer1");
                                expect(res.body.intent_display_name).to.not.equal(undefined);
                                expect(res.body.webhook_enabled).to.equal(false);
                                expect(res.body.language).to.equal("it");
                                done();
                            });

                    });


            });
        });

    });

    it('createWithIntentDisplayNameAndWebhookEnalbed', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }
                        
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", webhook_enabled: true, intent_display_name: "intent_display_name1" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.question).to.equal("question1");
                                expect(res.body.answer).to.equal("answer1");
                                expect(res.body.intent_display_name).to.equal("intent_display_name1");
                                expect(res.body.webhook_enabled).to.equal(true);

                                done();
                            });

                    });


            });
        });

    });

    it('update', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", attributes: { attr1: {one: "one", two: "two"}} })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.question).to.equal("question1");
                                expect(res.body.answer).to.equal("answer1");
                                expect(res.body.intent_display_name).to.not.equal(undefined);
                                expect(res.body.webhook_enabled).to.equal(false);

                                chai.request(server)
                                    .put('/' + savedProject._id + '/faq/' + res.body._id)
                                    .auth(email, pwd)
                                    .send({ id_faq_kb: id_faq_kb, question: "question2", answer: "answer2", webhook_enabled: true, attributes: { two: "twooo" } })
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                        expect(res.body.question).to.equal("question2");
                                        expect(res.body.answer).to.equal("answer2");
                                        expect(res.body.intent_display_name).to.not.equal(undefined);
                                        expect(res.body.webhook_enabled).to.equal(true);

                                        done();
                                    });

                            });

                    });


            });
        });

    });

    it('update attributes', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {
                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                expect(res.body.question).to.equal("question1");
                                expect(res.body.answer).to.equal("answer1");
                                expect(res.body.intent_display_name).to.not.equal(undefined);
                                expect(res.body.webhook_enabled).to.equal(false);

                                chai.request(server)
                                    .patch('/' + savedProject._id + '/faq/' + res.body._id + '/attributes')
                                    .auth(email, pwd)
                                    .send({
                                        "first_parameter": {
                                            "x": "first",
                                            "y": "second"
                                        },
                                        "color": {
                                            "first": "first",
                                        }
                                    })
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) {
                                            console.log("res.body attributes", res.body);
                                            console.log("res.body attributes", res.body.attributes);
                                        }
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.attributes).to.not.equal(undefined);

                                        done();
                                    });

                            });

                    });


            });
        });
    })

    it('updateBulkOperations', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-updatebulkops", savedUser._id).then((savedProject) => {

                //console.log("EXAMPLE DATA: ", JSON.stringify(example_data));

                chai.request(server)
                    .post('/' + savedProject._id + '/faq/ops_update')
                    .auth(email, pwd)
                    .send(example_data.json_multiple_operation) // set up the payload
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');

                        done();
                    })

            })
        })
    })

    it('uploadcsv', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-uploadcsv", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq/uploadcsv')
                            .auth(email, pwd)
                            .set('Content-Type', 'text/csv')
                            .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-faqs.csv')), 'example-faqs.csv')
                            .field('id_faq_kb', id_faq_kb)
                            .field('delimiter', ';')
                            // .send({id_faq_kb: id_faq_kb})       
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                done();
                            });

                    });

            });
        });

    });

    it('uploadcsvWithLanguage', (done) => {


        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-uploadcsv", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", language: "it" })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        expect(res.body.language).to.equal("it");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq/uploadcsv')
                            .auth(email, pwd)
                            .set('Content-Type', 'text/csv')
                            .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './example-faqs.csv')), 'example-faqs.csv')
                            .field('id_faq_kb', id_faq_kb)
                            .field('delimiter', ';')
                            // .send({id_faq_kb: id_faq_kb})       
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                done();
                            });

                    });

            });
        });

    });

    it('searchFaqs', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

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


                        chai.request(server)
                            //.get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                            .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb + "&page=0&limit=25&text=looking")
                            .auth(email, pwd)
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("found these faqs: \n", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.an('array');


                                done();

                            })
                    })
            })
        })
    });

    it('intentsEngine on', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "blank", intentsEngine: 'tiledesk-ai' })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;


                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1\nciao\nbuongiorno", answer: "answer1" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) {  console.log("intentEngin on resbody (create faq): \n", res.body); }

                                res.should.have.status(200);

                                done();

                            })
                    })
            })
        })
    });

    it('delete with _id', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", intentsEngine: 'tiledesk-ai' })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("create chatbot res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1" })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("create intent res.body", res.body); }

                                res.should.have.status(200);
                                let faqid = res.body._id;

                                chai.request(server)
                                    .delete('/' + savedProject._id + '/faq/' + faqid)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("delete intent res.body", res.body); }

                                        res.should.have.status(200);

                                        done();
                                    })

                            })
                    })
            })
        })
    });

    it('deleteWithIntentId', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", intentsEngine: 'tiledesk-ai' })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("create chatbot res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", intent_id: uuidv4() })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("create intent res.body", res.body); }

                                res.should.have.status(200);
                                let faqid = res.body.intent_id;

                                chai.request(server)
                                    .delete('/' + savedProject._id + '/faq/intentId' + faqid + "?id_faq_kb=" + id_faq_kb)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("delete intent res.body", res.body); }

                                        res.should.have.status(200);

                                        done();
                                    })

                            })
                    })
            })
        })
    });

    it('deleteWithIntentIdError', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", intentsEngine: 'tiledesk-ai' })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("create chatbot res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", intent_id: uuidv4() })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("create intent res.body", res.body); }

                                res.should.have.status(200);
                                let faqid = res.body.intent_id;

                                chai.request(server)
                                    .delete('/' + savedProject._id + '/faq/intentId' + faqid)
                                    // .delete('/' + savedProject._id + '/faq/intentId' + faqid + "?id_faq_kb=" + id_faq_kb)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("delete intent res.body", res.body); }

                                        res.should.have.status(500);

                                        done();
                                    })

                            })
                    })
            })
        })
    });

    it('deleteWithIntentIdErroWrongChatbotId', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-search-faqs", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/' + savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({ "name": "testbot", type: "internal", template: "example", intentsEngine: 'tiledesk-ai' })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("create chatbot res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .post('/' + savedProject._id + '/faq')
                            .auth(email, pwd)
                            .send({ id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", intent_id: uuidv4() })
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("create intent res.body", res.body); }

                                res.should.have.status(200);
                                let faqid = res.body.intent_id;

                                chai.request(server)
                                    .delete('/' + savedProject._id + '/faq/intentId' + faqid + "?id_faq_kb=11233")
                                    // .delete('/' + savedProject._id + '/faq/intentId' + faqid + "?id_faq_kb=" + id_faq_kb)
                                    .auth(email, pwd)
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("delete intent res.body", res.body); }

                                        res.should.have.status(404);

                                        done();
                                    })
                            })
                    })
            })
        })
    });

});

