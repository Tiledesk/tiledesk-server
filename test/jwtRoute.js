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
var jwt = require('jsonwebtoken');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('JWTRoute', () => {

  describe('/decode', () => {
 
   

    it('decodeWithIatExp', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-join-member", savedUser._id).then(function(savedProject) {                                              
                    chai.request(server)
                        .post('/'+ savedProject._id + '/keys/generate')
                        .auth(email, pwd)
                        .send()
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                        
                              chai.request(server)
                              .post('/'+ savedProject._id + '/jwt/generatetestjwt')
                              .auth(email, pwd)
                              .send({"name":"andrea", "surname":"leo"})
                              .end((err, res) => {
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.token).to.not.equal(null);    
                                
                                  var jwtToken  = res.body.token;
                                  console.log("jwtToken", jwtToken);
                                    chai.request(server)
                                    .post('/'+ savedProject._id + '/jwt/decode')
                                    .set('Authorization', jwtToken)
                                    .send()
                                    .end((err, res) => {
                                      res.should.have.status(200);
                                      res.body.should.be.a('object');
                                      expect(res.body.name).to.not.equal("andrea");    
                                      expect(res.body.surname).to.not.equal("leo");    
                                      expect(res.body.iat).to.not.equal(null);    
                                      expect(res.body.exp).to.not.equal(null);    
                                      done();
                                    });

                                
                              });
                            
                        });

                        
                });
                });
                
    }).timeout(20000);





    it('decodeWithIatNoExp', (done) => {

        
      //   this.timeout();
  
         var email = "test-signup-" + Date.now() + "@email.com";
         var pwd = "pwd";
  
          userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
              projectService.create("test-join-member", savedUser._id).then(function(savedProject) {                                              
                      chai.request(server)
                          .post('/'+ savedProject._id + '/keys/generate')
                          .auth(email, pwd)
                          .send()
                          .end((err, res) => {
                              //console.log("res",  res);
                              console.log("res.body",  res.body);
                              res.should.have.status(200);
                              res.body.should.be.a('object');
                              expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                          

                              var jwtToken = jwt.sign({"name":"andrea", "surname":"leo"}, res.body.jwtSecret);

                                
                                    
                                    console.log("jwtToken", jwtToken);
                                      chai.request(server)
                                      .post('/'+ savedProject._id + '/jwt/decode')
                                      .set('Authorization', 'JWT '+jwtToken)
                                      .send()
                                      .end((err, res) => {
                                        res.should.have.status(401);
                                        
                                        done();
                                      });
  
                                  
                      
                              
                          });
  
                          
                  });
                  });
                  
      }).timeout(20000);






      it('decodeWithIatTooHightExp', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test-join-member", savedUser._id).then(function(savedProject) {                                              
                        chai.request(server)
                            .post('/'+ savedProject._id + '/keys/generate')
                            .auth(email, pwd)
                            .send()
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                            
  
                                var jwtToken = jwt.sign({"name":"andrea", "surname":"leo"}, res.body.jwtSecret, { expiresIn: 800 });
  
                                  
                                      
                                      console.log("jwtToken", jwtToken);
                                        chai.request(server)
                                        .post('/'+ savedProject._id + '/jwt/decode')
                                        .set('Authorization', 'JWT '+jwtToken)
                                        .send()
                                        .end((err, res) => {
                                          res.should.have.status(401);
                                          
                                          done();
                                        });
    
                                    
                        
                                
                            });
    
                            
                    });
                    });
                    
        }).timeout(20000);






});

});


