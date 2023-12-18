//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

let mock_log = {
    json_message: {
        messaging_product: "whatsapp",
        to: "+393484511111",
        type: "template",
        template: {
            name: "codice_sconto",
            language: {
                code: "it"
            },
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            "type": "text",
                            "text": "Giovanni"
                        }
                    ]
                }
            ]
        }
    },
    id_project: null,
    transaction_id: null,
    message_id: "wamid.HBgMMzkzNDg0NTA2NjI3FQIAERgSQTRDNzRDOTM3NzA5Mjk3NzJFAA==",
    status: "read",
    status_code: 3,
    error: null,
}
chai.use(chaiHttp);

describe('LogsRoute', () => {

    describe('/getlogs', () => {

        it('whatsapp', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test1", savedUser._id).then(function (savedProject) {

                    mock_log.id_project = savedProject._id;
                    mock_log.transaction_id = "automation-request-" + savedProject._id;
                    console.log("mock_log.transaction_id: ", mock_log.transaction_id);

                    chai.request(server)
                        .post('/' + savedProject._id + '/logs/whatsapp')
                        .auth(email, pwd)
                        .send(mock_log)
                        .end((err, res) => {
                            console.log("err: ", err);
                            // console.log("res.body: ", res.body);
                            console.log("Added example log")
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .get('/' + savedProject._id + '/logs/whatsapp/' + mock_log.transaction_id)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    console.log("err: ", err);
                                    console.log("res.body: ", res.body);
                                    res.should.have.status(200);
                                    
                                    done();

                                })

                        })

                });
            });

        });


    });
});

