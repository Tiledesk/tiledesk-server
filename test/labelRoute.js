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

chai.use(chaiHttp);

describe('LabelRoute', () => {

  describe('/clone', () => {
 
   

    it('clone', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test1", savedUser._id).then(function(savedProject) {

                chai.request(server)
                        .post('/'+ savedProject._id + '/labels/default/clone')
                        .auth(email, pwd)
                        .send({lang: "EN"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject.id);     

                        
                            done();
                        });

                        
                });
                });
                
    });




    it('getByLanguageEN', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test1", savedUser._id).then(function(savedProject) {
    
                    chai.request(server)
                            .post('/'+ savedProject._id + '/labels/default/clone')
                            .auth(email, pwd)
                            .send({lang: "EN"})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                expect(res.body.id_project).to.equal(savedProject.id);     


                                chai.request(server)
                                .get('/'+ savedProject._id + '/labels/EN')
                                .auth(email, pwd)
                                .send()
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");     
                                    done();
                                });
                            });
    
                            
                    });
                    });
                    
        });
    



        it('getByLanguageIT', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "EN"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
    
    
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/labels/EN')
                                    .auth(email, pwd)
                                    .send()
                                    .end((err, res) => {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");     
                                        done();
                                    });
                                });
        
                                
                        });
                        });
                        
            });




            it('getByLanguageAR', (done) => {

        
                //   this.timeout();
            
                   var email = "test-signup-" + Date.now() + "@email.com";
                   var pwd = "pwd";
            
                    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                        projectService.create("test1", savedUser._id).then(function(savedProject) {
            
                            chai.request(server)
                                    .post('/'+ savedProject._id + '/labels/default/clone')
                                    .auth(email, pwd)
                                    .send({lang: "EN"})
                                    .end((err, res) => {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                        expect(res.body.id_project).to.equal(savedProject.id);     
        
        
                                        chai.request(server)
                                        .get('/'+ savedProject._id + '/labels/EN')
                                        .auth(email, pwd)
                                        .send()
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body",  res.body);
                                            expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");     
                                            done();
                                        });
                                    });
            
                                    
                            });
                            });
                            
                });



});

});


