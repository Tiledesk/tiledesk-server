//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
// process.env.GPTKEY = 'customgptkey';

let log = false;
var projectService = require('../services/projectService');
var userService = require('../services/userService');

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

describe('OpenaiRoute', () => {

    describe('/create', () => {

        // it('completions', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        //         projectService.create("test-openai-create", savedUser._id).then((savedProject) => {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');

        //                     chai.request(server)
        //                         .put('/' + savedProject._id + "/kbsettings/" + res.body._id)
        //                         .auth(email, pwd)
        //                         .send({ gptkey: "sk-12345678" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("add kb to kb settings res.body: ", res.body); }
        //                             res.should.have.status(200);
        //                             res.body.should.be.a('object');

        //                             chai.request(server)
        //                                 .post('/' + savedProject._id + '/openai')
        //                                 .auth(email, pwd)
        //                                 .send({ question: "Provide 3 names for a dog", context: "you are an awesome assistant", max_tokens: 100, temperature: 0, model: "gpt-3.5-turbo" })
        //                                 .end((err, res) => {
        //                                     console.log("res.body (1): ", res.body);
        //                                     console.log("res.status: ", res.status);

        //                                     done();
        //                                 })

        //                         })
        //                 })
        //         })
        //     })
        // }).timeout(20000)

        // it('completions missing gptkey', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        //         projectService.create("test-openai-create", savedUser._id).then((savedProject) => {

        //             chai.request(server)
        //                 .post('/' + savedProject._id + '/kbsettings')
        //                 .auth(email, pwd)
        //                 .send({}) // can be empty
        //                 .end((err, res) => {
        //                     if (log) { console.log("create kbsettings res.body: ", res.body); }
        //                     res.should.have.status(200);
        //                     res.body.should.be.a('object');

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + '/openai')
        //                         .auth(email, pwd)
        //                         .send({ question: "Provide 3 names for a dog", context: "you are an awesome assistant", max_tokens: 100, temperature: 0, model: "gpt-3.5-turbo" })
        //                         .end((err, res) => {
        //                             if (log) { console.log("res.body: ", res.body); }
        //                             console.log("res.body: ", res.body)
        //                             // res.should.have.status(400);
        //                             // res.body.should.be.a('object');
        //                             // expect(res.body.success).to.equal(false);
        //                             // expect(res.body.message).to.equal("Missing gptkey parameter");

        //                             done();
        //                         })
        //                 })
        //         })
        //     })
        // }).timeout(20000)

        it('newCompletionsMissingGptkey', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-openai-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/' + savedProject._id + '/openai')
                        .auth(email, pwd)
                        .send({ question: "Provide 3 names for a dog", context: "you are an awesome assistant", max_tokens: 100, temperature: 0, model: "gpt-3.5-turbo" })
                        .end((err, res) => {
                            if (log) { console.log("res.body: ", res.body); }
                            res.should.have.status(400);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.message).to.equal("Missing gptkey parameter");

                            done();
                        })


                })
            })
        }).timeout(10000)


        /**
         * This test will be no longer available after merge with master because 
         * the profile section can no longer be modified via api.
         */
        // it('completionsWithProfileModified', (done) => {

        //     var email = "test-signup-" + Date.now() + "@email.com";
        //     var pwd = "pwd";

        //     userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
        //         projectService.create("test-openai-create", savedUser._id).then((savedProject) => {

        //             chai.request(server)
        //                 .put('/projects/' + savedProject._id)
        //                 .auth(email, pwd)
        //                 .send({ profile: { quotes: { tokens: 400000, kbs: 100 } } })
        //                 .end((err, res) => {
        //                     if (log) { console.log("res.body: ", res.body); };
        //                     console.log("res.body: ", res.body)

        //                     chai.request(server)
        //                         .post('/' + savedProject._id + '/openai')
        //                         .auth(email, pwd)
        //                         .send({ question: "Provide 3 names for a dog", context: "you are an awesome assistant", max_tokens: 100, temperature: 0, model: "gpt-3.5-turbo" })
        //                         .end((err, res) => {
                                    
        //                             if (log) { console.log("res.body: ", res.body); }
        //                             done();

        //                         })


        //                 })
        //         })
        //     })
        // }).timeout(10000)

    });

});


