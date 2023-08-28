//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

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

        it('home', (done) => {
            
        })

        it('create', (done) => {

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




    });

});


