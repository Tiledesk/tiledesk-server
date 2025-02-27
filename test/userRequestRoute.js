process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);

var expect = require('chai').expect;
var assert = require('chai').assert;
var config = require('../config/database');

var mongoose = require('mongoose');
var winston = require('../config/winston');

let log = false;

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var userService = require('../services/userService');
const projectService = require('../services/projectService');
var leadService = require('../services/leadService');
var requestService = require('../services/requestService');
const faqService = require('../services/faqService');
var Bot = require("../models/faq_kb");

var jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');


describe('UserService()', function () {

    it('request-rating', function (done) {

        var email = "test-UserRequest-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            var userid = savedUser.id;

            projectService.createAndReturnProjectAndProjectUser("createWithId", savedUser.id).then(function (savedProjectAndPU) {
                var savedProject = savedProjectAndPU.project;

                faqService.create("testbot", null, savedProject._id, savedUser._id, "tilebot", null, null, null, "en", "blank").then(async function (savedFaq_kb) {

                    var signOptions = {
                        issuer: 'https://tiledesk.com',
                        subject: 'bot',
                        audience: 'https://tiledesk.com/bots/' + savedFaq_kb._id,
                        jwtid: uuidv4()
                    };

                    let botPayload = savedFaq_kb.toObject();
                    let botSecret = botPayload.secret;

                    var bot_token = jwt.sign(botPayload, botSecret, signOptions);

                    leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
                        var now = Date.now();
                        var request = {
                            request_id: "request_id-createObjSimple-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
                            id_project: savedProject._id, first_text: "first_text",
                            lead: createdLead, requester: savedProjectAndPU.project_user
                        };

                        requestService.create(request).then(function (savedRequest) {

                            chai.request(server)
                                .patch('/' + savedProject._id + '/requests/' + savedRequest.request_id + "/rating")
                                .set('Authorization', "JWT " + bot_token)
                                .send({ rating: 4, rating_message: "Good" })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };
                                    
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.rating).to.equal(4);
                                    expect(res.body.rating_message).to.equal('Good');

                                    done()
                                });
                        });
                    });



                });



                // console.log("savedProject: ", savedProject)
                // leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function (createdLead) {
                //     var now = Date.now();
                //     var request = {
                //         request_id: "request_id-createObjSimple-" + now, project_user_id: savedProjectAndPU.project_user._id, lead_id: createdLead._id,
                //         id_project: savedProject._id, first_text: "first_text",
                //         lead: createdLead, requester: savedProjectAndPU.project_user
                //     };

                //     console.log("request: ", request)


                //     requestService.create(request).then(function (savedRequest) {

                //         console.log("savedRequest: ", savedRequest);
                //         done();
                //     });
                // });
            });

        })


    }).timeout(10000);
})

