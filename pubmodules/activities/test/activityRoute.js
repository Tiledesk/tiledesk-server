//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var Activity = require('../models/activity');
var projectService = require('../../../services/projectService');
var userService = require('../../../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../../app');
let should = chai.should();
var winston = require('../../../config/winston');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('ActivityRoute', () => {

  describe('/create', () => {
 
   

    it('createAndList', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-activity-create", savedUser._id).then(function(savedProject) {
             
                var activity = new Activity(
                    {
                        actor: {type:"user", id: savedUser._id},
                        verb: "PROJECT_USER_UPDATE", 
                        actionObj: {field:"test"}, 
                        target: '/testtarget', 
                        id_project: savedProject._id
                    }
                    );
                activity.save(function(err, savedActivity) {
                    if (err) {
                        winston.error('Error saving activity ', err);
                      }

                    winston.info("savedActivity: "  + savedActivity);

                    chai.request(server)
                        .get('/'+ savedProject._id + '/activities')
                        .auth(email, pwd)
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.activities.should.be.a('array');
                            expect(res.body.count).to.equal(1);                                                                              
                        
                            done();
                        });

                    });
                });
                });
                
    }).timeout(20000);








});

});


