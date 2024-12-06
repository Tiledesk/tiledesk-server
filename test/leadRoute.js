//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const userService = require('../services/userService');
const projectService = require('../services/projectService');
const leadService = require('../services/leadService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var expect = chai.expect;
var assert = chai.assert;


let log = false;

chai.use(chaiHttp);


describe('LeadRoute', () => {

    // mocha test/leadRoute.js  --grep 'add-tags-to-lead'
    it('add-tags-to-lead', function (done) {
        
        var email = "test-request-create-" + Date.now() + "@email.com";
        var pwd = "pwd";
        var userid = "5badfe5d553d1844ad654072";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {
                var attr = { myprop: 123 };
                leadService.create("fullname", "email@email.com", savedProject._id, userid, attr).then(function (savedLead) {

                    savedLead.should.have.property('_id').not.eql(null);
                    let lead_id = savedLead._id;
                    
                    let tags = [ "tag1", "tag2" ]
                    
                    // First Step: add 2 tags on a conversation no tagged at all
                    chai.request(server)
                        .put('/' + savedProject._id + '/leads/' + lead_id + '/tag')
                        .auth(email, pwd)
                        .send(tags)
                        .end((err, res) => {

                            if (err) { console.log("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.tags).to.have.length(2);
                            expect(res.body.tags[0]).to.equal('tag1');
                            expect(res.body.tags[1]).to.equal('tag2');

                            let tags2 = [ "tag2", "tag3" ]

                            // Second Step: add more 2 tags of which one already existant in the conversation
                            chai.request(server)
                                .put('/' + savedProject._id + '/leads/' + lead_id + '/tag')
                                .auth(email, pwd)
                                .send(tags2)
                                .end((err, res) => {

                                    if (err) { console.log("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.tags).to.have.length(3);
                                    expect(res.body.tags[0]).to.equal('tag1');
                                    expect(res.body.tags[1]).to.equal('tag2');
                                    expect(res.body.tags[2]).to.equal('tag3');

                                    done();
                                })

                        })

                }).catch(function (err) {
                    winston.error("test reject", err);
                    assert.isNotOk(err, 'Promise error');
                    done();
                });
            })

        })

    }).timeout(5000)

    // mocha test/leadRoute.js  --grep 'remove-tags-from-lead'
    it('remove-tags-from-lead', function (done) {
        
        var email = "test-request-create-" + Date.now() + "@email.com";
        var pwd = "pwd";
        var userid = "5badfe5d553d1844ad654072";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("request-create", savedUser._id, { email: { template: { assignedRequest: "123" } } }).then(function (savedProject) {
                var attr = { myprop: 123 };
                leadService.create("fullname", "email@email.com", savedProject._id, userid, attr).then(function (savedLead) {

                    savedLead.should.have.property('_id').not.eql(null);
                    let lead_id = savedLead._id;
                    
                    let tags = [ "tag1", "tag2" ]
                    
                    // First Step: add 2 tags on a conversation no tagged at all
                    chai.request(server)
                        .put('/' + savedProject._id + '/leads/' + lead_id + '/tag')
                        .auth(email, pwd)
                        .send(tags)
                        .end((err, res) => {

                            if (err) { console.log("err: ", err) };
                            if (log) { console.log("res.body: ", res.body) };

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.tags).to.have.length(2);
                            expect(res.body.tags[0]).to.equal('tag1');
                            expect(res.body.tags[1]).to.equal('tag2');

                            let tag_to_remove = res.body.tags[1];

                            chai.request(server)
                                .delete('/' + savedProject._id + '/leads/' + lead_id + '/tag/' + tag_to_remove)
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.log("err: ", err) };
                                    if (log) { console.log("res.body: ", res.body) };

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.tags).to.have.length(1);
                                    expect(res.body.tags[0]).to.equal('tag1');

                                    done();

                                })

                        })

                }).catch(function (err) {
                    winston.error("test reject", err);
                    assert.isNotOk(err, 'Promise error');
                    done();
                });
            })

        })

    }).timeout(5000)
})