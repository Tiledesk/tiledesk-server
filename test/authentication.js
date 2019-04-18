//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//var User = require('../models/user');
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');
var leadService = require('../services/leadService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('Authentication', () => {

  describe('/signin', () => {
 
   

    it('signinOk', (done) => {

        
    //   this.timeout();

       var email = "test-signin-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
          
                    chai.request(server)
                        .post('/auth/signin' )
                        .send({"email":email, "password":pwd})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);                                               
                            expect(res.body.token).to.not.equal(null);                                               
                            expect(res.body.user.email).to.equal(email);                                               
                            expect(res.body.user.password).to.equal(undefined);                                               
                        
                            done();
                        });

             
                });
    });



    it('signinkO', (done) => {

        
        //   this.timeout();
    
           var email = "test-signinko-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
          
                        chai.request(server)
                            .post('/auth/signin' )
                            .send({"email":email, "password":pwd})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(401);
                                
                            
                                done();
                            });
    
                 
                    });
        



});









describe('/signup', () => {
 
   

    it('signuoOk', (done) => {

        
    //   this.timeout();

       var email = "test-signuoOk-" + Date.now() + "@email.com";
       var pwd = "pwd";

          
                    chai.request(server)
                        .post('/auth/signup' )
                        .send({email:email, password:pwd, lastname:"lastname", firstname: "firstname", disableEmail: true})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);                                                                                                                     
                            expect(res.body.user.email).to.equal(email);                                               
                            expect(res.body.user.password).to.equal(undefined);                                               
                        
                            done();
                        });

             
                
    });


});





});


