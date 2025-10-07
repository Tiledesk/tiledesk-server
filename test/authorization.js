//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

//let User = require('../models/user');
let projectService = require('../services/projectService');
let requestService = require('../services/requestService');
let userService = require('../services/userService');
let leadService = require('../services/leadService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

let log = false;

// chai.config.includeStack = true;

let expect = chai.expect;
let assert = chai.assert;

chai.use(chaiHttp);

describe('Authorization', () => {

    
    it('userBelongsToProject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "Pwd1234!";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.createAndReturnProjectAndProjectUser("test-auth", savedUser._id).then(function (savedProjectAndPU) {
                let savedProject = savedProjectAndPU.project;
                leadService.createIfNotExists("request_id1-userBelongsToProject", "email@userBelongsToProject.com", savedProject._id).then(function (createdLead) {
                    // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
                    let id_request = "test-userBelongsToProject" + Date.now();
                    requestService.createWithIdAndRequester(id_request, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {

                        // let webhookContent =     { "assignee": 'assignee-member'}
                        chai.request(server)
                            .get('/' + savedProject._id + '/requests/' + savedRequest.request_id)
                            .auth(email, pwd)
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
    }).timeout(20000);


    it('userNOTBelongsToProject', (done) => {

        let email = "test-signup-other-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            userService.signup("test-signup" + Date.now() + "@email.com", pwd, "Test Firstname other", "Test lastname other").then(function (savedUserOther) {
                projectService.createAndReturnProjectAndProjectUser("test-auth", savedUserOther._id).then(function (savedProjectAndPU) {
                    let savedProject = savedProjectAndPU.project;
                    leadService.createIfNotExists("request_id1-userNOTBelongsToProject", "email@userNOTBelongsToProject.com", savedProject._id).then(function (createdLead) {

                        let id_request = "test-auth" + Date.now();
                        requestService.createWithIdAndRequester(id_request, savedProjectAndPU.project_user._id, createdLead._id, savedProject._id, "first_text").then(function (savedRequest) {

                            // let webhookContent =     { "assignee": 'assignee-member'}
                            chai.request(server)
                                .get('/' + savedProject._id + '/requests/' + savedRequest._id)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(403);

                                    done();
                                });
                        });
                    });
                });
            });
        });
    }).timeout(20000);


        // it('userCANTAddProjectUser', (done) => {

        
        //     //   this.timeout();
        
        //        let email = "test-signup-other-" + Date.now() + "@email.com";
        //        let pwd = "pwd";
    
        //        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        //         userService.signup(  "test-signup" + Date.now() + "@email.com" ,pwd, "Test Firstname other", "Test lastname other").then(function(savedUserOther) {
        //             projectService.create("test-auth", savedUserOther._id).then(function(savedProject) {
        //                 requestService.createWithId("test-auth", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {
        
        //                     // let webhookContent =     { "assignee": 'assignee-member'}
                                
                    
        //                     chai.request(server)
        //                         .get('/'+ savedProject._id + '/requests/' + savedRequest._id )
        //                         .auth(email, pwd)
        //                         .end((err, res) => {
        //                             //console.log("res",  res);
        //                             console.log("res.body",  res.body);
        //                             res.should.have.status(403);
                                    
        //                             done();
        //                         });
        
                                
        //                 });
        //                 });
        //                 });
        //             });
        //     }).timeout(20000);

});


