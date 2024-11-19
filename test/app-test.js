process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical'

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
const userService = require('../services/userService');
const projectService = require('../services/projectService');

let log = false;

let expect = chai.expect;
let assert = chai.assert;

chai.use(chaiHttp);

describe('Root Test', () => {

    /**
     * Try to perform a request with an invalid id project.
     * A fake id is passed.
     * This test must respond with status 400 and with an error.
     */
    it("Wrong request url", (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-root-project", savedUser._id).then((savedProject) => {

                let fake_id_project = "fake1234"

                chai.request(server)
                    //.get('/' + savedUser._id + '/faq_kb')
                    .get('/' + fake_id_project + '/faq_kb')
                    .auth(email, pwd)
                    .end((err, res) => {
                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }
                        
                        res.should.have.status(400);
                        assert.notEqual(res.body.error, null);
                        expect(res.body.error).to.equal("Invalid project id: " + fake_id_project)
                        done();
                    })
            })
        })
    }).timeout(5000)

    /**
     * Try to perform a request with an invalid id project.
     * A non existent mongo id (like user id) is passed.
     * This test must respond with status 400 and with an error.
     */
    it("Wrong request url", (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-root-project", savedUser._id).then((savedProject) => {

                // A real valid mongo id without a corresponding project
                let fake_id_project = savedUser._id;

                chai.request(server)
                    //.get('/' + savedUser._id + '/faq_kb')
                    .get('/' + fake_id_project + '/faq_kb')
                    .auth(email, pwd)
                    .end((err, res) => {
                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }
                        
                        res.should.have.status(400);
                        assert.notEqual(res.body.error, null);
                        expect(res.body.error).to.equal("Project not found with id: " + fake_id_project)
                        done();
                    })
            })
        })
    }).timeout(5000)

})