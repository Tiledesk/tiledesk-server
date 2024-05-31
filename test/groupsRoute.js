//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

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

let log = true;

chai.use(chaiHttp);

describe('FaqKBRoute', () => {

    describe('/create', () => {

        it('create', (done) => {

            //   this.timeout();

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    
                    // Create Chatbot
                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({  "name": "testbot", type: "internal", template: "blank", language: 'it' })
                        .end((err, res) => {
                            if (log) { console.log("res.body", res.body ); }
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.language).to.equal("it");

                            let bot_id = res.body._id;

                            // Get Chatbot Token
                            chai.request(server)
                                .get('/' + savedProject._id + '/faq_kb/' + bot_id + "/jwt")
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (log) { console.log("res.body", res.body); }
                                    res.should.have.status(200);

                                    let bot_token = res.body.jwt;
                                    console.log("bot_token: ", bot_token);

                                    let members = [];
                                    members.push(savedUser.id);
                                    console.log("members: ", members);


                                    chai.request(server)
                                        .post('/' + savedProject._id + '/groups/')
                                        .auth(email, pwd)
                                        .send({ "name": "TestGroup", "members": members })
                                        .end((err, res) => {

                                            console.log("err ", err);
                                            console.log("res ", res.body);

                                            chai.request(server)
                                                .get('/' + savedProject._id + '/groups')
                                                .set('Authorization', 'JWT ' + bot_token)
                                                .end((err, res) => {
        
                                                    console.error("err: ", err );
                                                    console.log("Get groups req.body: ", res.body);
                                                    
                                                    done();
                                                })

                                        })


                                });
                        });
                });
            });
        });
    });
});

