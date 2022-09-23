//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;

let chaiHttp = require('chai-http');
let server = require('../app');
const projectService = require('../services/projectService');
const userService = require('../services/userService');
var RoleConstants = require("../models/roleConstants");
const Project_user = require('../models/project_user');
let should = chai.should();



chai.use(chaiHttp);

describe('CannedRoute', () => {

    it('new canned by owner/admin', (done) => {
        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
            projectService.create("test1", savedUser._id).then(savedProject => {

                chai.request(server)
                    .post('/' + savedProject._id + '/canned/')
                    .auth(email, pwd)
                    .set('content-type', 'application/json')
                    .send({ "title": "Test Title", "text": "Test Text" })
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('title').eql("Test Title");
                        res.body.should.have.property('text').eql("Test Text");
                        res.body.should.have.property('createdBy').eql(savedUser._id.toString());
                        res.body.should.have.property('shared').eql(true);

                        done();
                    })
            })
        })
    })

    it('new canned by agent', (done) => {
        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then(savedUser => {
            projectService.create("test1", savedUser._id).then(savedProject => {

                Project_user.findOneAndUpdate({id_project: savedProject._id, id_user: savedUser._id }, { role: RoleConstants.AGENT }, function(err, savedProject_user){
                    chai.request(server)
                    .post('/' + savedProject._id + '/canned/')
                    .auth(email, pwd)
                    .set('content-type', 'application/json')
                    .send({ title: "Test Title", text: "Test Text" })
                    .end((err, res) => {
                        res.body.should.be.a('object');
                        res.body.should.have.property('title').eql("Test Title");
                        res.body.should.have.property('text').eql("Test Text");
                        res.body.should.have.property('createdBy').eql(savedUser._id.toString());
                        res.body.should.have.property('shared').eql(false);

                        done();
                    })  
                })
            })
        })
    })

    it('get canned', (done) => {

        var email_owner = "owner-signup-" + Date.now() + "@email.com";
        var email_agent = "agent-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email_owner, pwd, "Owner Firstname", "Owner Lastname").then(savedOwner => {
            userService.signup(email_agent, pwd, "Agent Firstname", "Agent Lastname").then(savedAgent => {
                projectService.create("test1", savedOwner._id).then(savedProject => {
                    
                    // invite Agent on savedProject (?)
                    chai.request(server)
                        .post('/' + savedProject._id + "/project_users/invite")
                        .auth(email_owner, pwd)
                        .set('content-type', 'application/json')
                        .send({ email: email_agent, role: "agent", userAvailable: false })
                        .end((err, res) => {
                            res.should.have.status(200);


                            chai.request(server)
                                .post('/' + savedProject._id + "/canned/")
                                .auth(email_owner, pwd)
                                .set('content-type', 'application/json')
                                .send({ title: "Test1 Title", text: "Test1 Text" })
                                .end((err, res) => {

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');

                                    chai.request(server)
                                        .post('/' + savedProject._id + "/canned/")
                                        .auth(email_agent, pwd)
                                        .set('content-type', 'application/json')
                                        .send({ title: "Test2 Title", text: "Test2 Text" })
                                        .end((err, res) => {
                                            
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');

                                            chai.request(server)
                                                .get('/' + savedProject._id + "/canned/")
                                                .auth(email_owner, pwd)
                                                .set('content-type', 'application-json')
                                                .send()
                                                .end((err, res) => {

                                                    res.should.have.status(200);
                                                    //res.body.should.be.a('array');
                                                    
                                                    expect(res.body).to.be.an('array')
                                                    expect(res.body.length).to.equal(1);

                                                    chai.request(server)
                                                        .get('/' + savedProject._id + "/canned/")
                                                        .auth(email_agent, pwd)
                                                        .set('content-type', 'application-json')
                                                        .send()
                                                        .end((err, res) => {

                                                        res.should.have.status(200);
                                                        //res.body.should.be.a('array');
                                                        
                                                        expect(res.body).to.be.an('array')
                                                        expect(res.body.length).to.equal(2);

                                                        done();
                                                    
                                                        })


                                                })

                                                
                                        })

                                })
                        })
                })
            })
        })
    }).timeout(5000);
})