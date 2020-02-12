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
var jwt = require('jsonwebtoken');


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
 
   

    it('signupOk', (done) => {

        
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


    it('signupkOWrongEmail', (done) => {

        
        //   this.timeout();
    
           var email = "test-signuoOk-" + Date.now() + "@email";
           var pwd = "pwd";
    
              
                        chai.request(server)
                            .post('/auth/signup' )
                            .send({email:email, password:pwd, lastname:"lastname", firstname: "firstname", disableEmail: true})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(422);                                                                      
                            
                                done();
                            });
    
                 
                    
        });


});




describe('/signInAnonymously', () => {
 
   

    it('signInAnonymouslyOk', (done) => {

        
        var email = "test-signInAnonymouslyOk-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signInAnonymouslyOk", savedUser._id).then(function(savedProject) {     
          
                    chai.request(server)
                        .post('/auth/signinAnonymously' )
                        .send({ id_project: savedProject._id, email: "email@email.com"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);                                                                                                                     
                            expect(res.body.user.email).to.equal("email@email.com");                                               
                            expect(res.body.token).to.not.equal(undefined);                                               
                        
                            done();
                        });
                    }); 
                });
             
                
    });


});






describe('/signinWithCustomToken', () => {
 

    it('signinWithCustomTokenOk', (done) => {

        
        var email = "test-signinWithCustomToken-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signInAnonymouslyOk", savedUser._id).then(function(savedProject) {     
          
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
                
                    // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                    var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: "email2@email.com",  customAttr: "c1"};
                    
                    console.log("externalUserObj", externalUserObj);


                    var signOptions = {                                                            
                        // subject:  'userexternal',                                                                 
                        subject: externalUserObj._id,
                        // audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                        audience:  '/projects/'+savedProject._id ,                                              
                    };


                    var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
                
                    console.log("jwtToken", jwtToken);


                    chai.request(server)
                        .post('/auth/signinWithCustomToken' )
                        .set('Authorization', 'JWT '+jwtToken)
                        //.send({ id_project: savedProject._id})
                        .send()
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);                                                                                                                     
                            expect(res.body.user.email).to.equal("email2@email.com");  
                            expect(res.body.user.firstname).to.equal("andrea");               
                            expect(res.body.user.customAttr).to.equal("c1");               
                                                            
                           
                            expect(res.body.token).to.not.equal(undefined);  
                            expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                         
                        
                            done();
                        });
                    });
                });
            });
                
    });

   

    // it('signinWithCustomTokenOk', (done) => {

        
    //     var email = "test-signinWithCustomToken-" + Date.now() + "@email.com";
    //     var pwd = "pwd";

    //     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //         // create(name, createdBy, settings)
    //         projectService.create("test-signInAnonymouslyOk", savedUser._id).then(function(savedProject) {     
          
    //             chai.request(server)
    //             .post('/'+ savedProject._id + '/keys/generate')
    //             .auth(email, pwd)
    //             .send()
    //             .end((err, res) => {
    //                 //console.log("res",  res);
    //                 console.log("res.body",  res.body);
    //                 res.should.have.status(200);
    //                 res.body.should.be.a('object');
    //                 expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                
    //                 // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
    //                 var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: "email2@email.com"};
                    
    //                 console.log("externalUserObj", externalUserObj);


    //                 var signOptions = {                                                            
    //                     subject:  'user',                                                                 
    //                     audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
    //                     };


    //                 var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
                
    //                 console.log("jwtToken", jwtToken);


    //                 chai.request(server)
    //                     .post('/auth/signinWithCustomToken' )
    //                     .set('Authorization', 'JWT '+jwtToken)
    //                     //.send({ id_project: savedProject._id})
    //                     .send()
    //                     .end((err, res) => {
    //                         //console.log("res",  res);
    //                         console.log("res.body",  res.body);
    //                         res.should.have.status(200);
    //                         res.body.should.be.a('object');
    //                         expect(res.body.success).to.equal(true);                                                                                                                     
    //                         expect(res.body.user.email).to.equal("email2@email.com");  
    //                         expect(res.body.user.firstname).to.equal("andrea");                                               
                           
    //                         expect(res.body.token).to.not.equal(undefined);                                               
                        
    //                         done();
    //                     });
    //                 });
    //             });
    //         });
                
    // });





    it('signinWithCustomTokenKO', (done) => {

        
        var email = "test-signinWithCustomToken-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signInAnonymouslyOk", savedUser._id).then(function(savedProject) {     
          
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
                

                    var externalUserObj = {_id: "123", name:"andrea", surname:"leo", customAttr: "c1"};
                    
                    console.log("externalUserObj", externalUserObj);


                    var signOptions = {                                                            
                        // subject:  'userexternal',    
                        subject:  externalUserObj._id,    
                                                                                     
                        audience:  '/projects/'+savedProject._id ,                                              
                        // audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                        };


                    var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret+"1234567KOOOOOOO",signOptions);
                
                    console.log("jwtToken", jwtToken);


                    chai.request(server)
                        .post('/auth/signinWithCustomToken' )
                        .set('Authorization', 'JWT '+jwtToken)
                        .send({ id_project: savedProject._id})
                        .end((err, res) => {
                            //console.log("res",  res);
                            // console.log("res.body",  res.body);
                            res.should.have.status(401);                                                                 
                        
                            done();
                        });
                    });
                });
            });
                
    });

});




it('signinWithCustomTokenKONoID', (done) => {

        
    var email = "test-signinWithCustomTokenKONoID-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenKONoID", savedUser._id).then(function(savedProject) {     
      
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
            
                // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                var externalUserObj = {firstname:"andrea", lastname:"leo", email: "email2@email.com"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {   
                    audience:  '/projects/'+savedProject._id ,                                                                                                       
                    // subject:  'userexternal',                                                                 
                    // audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                    };


                var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
            
                console.log("jwtToken", jwtToken);


                chai.request(server)
                    .post('/auth/signinWithCustomToken' )
                    .set('Authorization', 'JWT '+jwtToken)
                    //.send({ id_project: savedProject._id})
                    .send()
                    .end((err, res) => {
                        //console.log("res",  res);
                        console.log("res.body",  res.body);
                        res.should.have.status(401);                                                                                            
                    
                        done();
                    });
                });
            });
        });
            
});




it('signinWithCustomTokenKONoAud', (done) => {

        
    var email = "test-signinWithCustomTokenKOWrongAud-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenKOWrongAud", savedUser._id).then(function(savedProject) {     
      
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
            
                // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                var externalUserObj = {_id: 1234, firstname:"andrea", lastname:"leo", email: "email2@email.com"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {                                                            
                    subject:  'userexternal',                                                                 
                    //audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                    };


                var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
            
                console.log("jwtToken", jwtToken);


                chai.request(server)
                    .post('/auth/signinWithCustomToken' )
                    .set('Authorization', 'JWT '+jwtToken)
                    //.send({ id_project: savedProject._id})
                    .send()
                    .end((err, res) => {
                        //console.log("res",  res);
                        console.log("res.body",  res.body);
                        res.should.have.status(401);                                                                                            
                    
                        done();
                    });
                });
            });
        });
            
});




it('signinWithCustomTokenOkTwoSigninWithCT', (done) => {

        
    var email = "test-signinWithCustomTokenOkTwoSigninWithCT-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenOkTwoSigninWithCT", savedUser._id).then(function(savedProject) {     
      
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
            
                // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: "email2@email.com",  customAttr: "c1"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {                                                            
                    subject:  externalUserObj._id,                                                               
                    audience:  '/projects/'+savedProject._id ,  
                    // subject:  'userexternal',                                                                 
                    // audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                    };


                var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);
            
                console.log("jwtToken", jwtToken);


                chai.request(server)
                    .post('/auth/signinWithCustomToken' )
                    .set('Authorization', 'JWT '+jwtToken)
                    //.send({ id_project: savedProject._id})
                    .send()
                    .end((err, res) => {
                        //console.log("res",  res);
                        console.log("res.body",  res.body);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.success).to.equal(true);                                                                                                                     
                        expect(res.body.user.email).to.equal("email2@email.com");  
                        expect(res.body.user.firstname).to.equal("andrea");               
                        expect(res.body.user.customAttr).to.equal("c1");               
                                                        
                       
                        expect(res.body.token).to.not.equal(undefined);  
                        expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                     
                    
                        chai.request(server)
                                .post('/auth/signinWithCustomToken' )
                                .set('Authorization', 'JWT '+jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);                                                                                                                     
                                    expect(res.body.user.email).to.equal("email2@email.com");  
                                    expect(res.body.user.firstname).to.equal("andrea");               
                                    expect(res.body.user.customAttr).to.equal("c1");               
                                                                    
                                
                                    expect(res.body.token).to.not.equal(undefined);  
                                    expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                                
                                
                                    done();
                                });
                    });
                });
            });
        });
            
});








  }).timeout(20000);


