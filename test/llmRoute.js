//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

var projectService = require('../services/projectService');
var userService = require('../services/userService');

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

describe('llmRoute', () => {


    it('transcription', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {


                chai.request(server)
                    .post('/' + savedProject._id + '/integration/')
                    .auth(email, pwd)
                    .send({ name: "openai", value: { apikey: "testkey"} })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }


                        chai.request(server)
                            .post('/' + savedProject._id + '/llm/transcription')
                            .auth(email, pwd)
                            .set('Content-Type', 'text/plain')
                            .attach('uploadFile', fs.readFileSync(path.resolve(__dirname, './harvard.wav')), 'example-audio')
                            .end((err, res) => {
        
                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }
        
                                res.should.have.status(200);
        
                                done()
        
                            })
                    })



            })
        })

    })

});
