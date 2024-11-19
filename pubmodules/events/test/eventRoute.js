//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../../../models/user');
var Project_user = require('../../../models/project_user');

var projectService = require('../../../services/projectService');
var userService = require('../../../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../../app');
let should = chai.should();

let log = false;

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('EventRoute', () => {

  describe('/create', () => {
 
   

    it('create', (done) => {

        
       var email = "test-signup-eventroute" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-EventRoute-create", savedUser._id).then(function(savedProject) {                                              
                    chai.request(server)
                        .post('/'+ savedProject._id + '/events')
                        .set('content-type', 'application/json')
                        .auth(email, pwd)
                        .send({"name":"event1", attributes: {"attr1":"val1"}})
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body",  res.body); }

                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("event1");                                                                              
                            expect(res.body.attributes.attr1).to.equal("val1");                                                                              
                        
                            Project_user.findOne({ id_user:  savedUser.id, status: "active"} )
                            .populate('events')
                            .exec(function (err, project_user) {
                                if (log) { console.log("project_user",  project_user.toJSON()); }
                                expect(project_user.events.length).to.equal(1);  
                                done();
                            });
                           
                        });

                        
                });
                });
                
    }).timeout(20000);








});

});


