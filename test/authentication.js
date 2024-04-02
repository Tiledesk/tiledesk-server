//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = "admin@tiledesk.com";
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

var config = require('../config/database');

var mongoose = require('mongoose');
mongoose.connect(config.databasetest);


chai.use(chaiHttp);

describe('Authentication', () => {

   // mocha test/authentication.js  --grep 'signinOk'

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
        





    it('signinValidation', (done) => {

        
        //   this.timeout();
    
           var email = "test-signinko-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
          
                        chai.request(server)
                            .post('/auth/signin' )
                            .send()
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(422);
                                
                            
                                done();
                            });
    
                 
                    });
        

    // mocha test/authentication.js  --grep 'signinLowercase'

    it('signinLowercase', (done) => {

        
        //   this.timeout();
    
           var email = "Test-SigninKO-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
           userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {

                        chai.request(server)
                            .post('/auth/signin' )
                            .send({"email":email, "password":pwd})
                            .end((err, res) => {
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.success).to.equal(true);                                               
                                expect(res.body.token).to.not.equal(null);                                               
                                expect(res.body.user.email).to.equal(email.toLowerCase());                                               
                                expect(res.body.user.password).to.equal(undefined);                                               
                        
                            

                                chai.request(server)
                                    .get('/users/' )        
                                    .auth(email, pwd)                            
                                    .end((err, res) => {
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');                                                                                
                                
                                        done();
                                    });
            
                                });

                            });
    
                        });
                    });
        

});









describe('/signup', () => {
 
   

    it('signupOk', (done) => {

        
    //   this.timeout();

       var email = "test-signuook-" + Date.now() + "@email.com";
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

    it('signUpAdminNoVerificationEmail', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        chai.request(server)
            .post("/auth/signin")
            .send({ email: "admin@tiledesk.com", password: "adminadmin" })
            .end((err, res) => {

                // console.log("login with superadmin res.body: ", res.body)
                let superadmin_token = res.body.token;

                chai.request(server)
                    .post("/auth/signup")
                    .set('Authorization', superadmin_token)
                    .send({ email: email, password: pwd, lastname: "lastname", firstname: "firstname", disableEmail: true })
                    .end((err, res) => {

                        // console.log("res.body: ", res.body);
                        done();
                    })
            })


    })

    // mocha test/authentication.js  --grep 'signupUpperCaseEmail'


    it('signupUpperCaseEmail', (done) => {

        
        //   this.timeout();
            var now = Date.now();
           var email = "test-signupUpperCaseEmail-" + now + "@email.com";
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
                                expect(res.body.user.email).to.equal("test-signupuppercaseemail-" + now + "@email.com");                                               
                                expect(res.body.user.password).to.equal(undefined);                                               
                            
                                done();
                            });
                           
        });

   // mocha test/authentication.js  --grep 'signupkOWrongEmail'

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


// });




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




    // it('signInAnonymouslyReLoginSameProject', (done) => {

        
    //     var email = "test-signInAnonymouslyReLogin-" + Date.now() + "@email.com";
    //     var pwd = "pwd";

    //     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //         // create(name, createdBy, settings)
    //         projectService.create("test-signInAnonymouslyReLogin", savedUser._id).then(function(savedProject) {     
          
    //                 chai.request(server)
    //                     .post('/auth/signinAnonymously' )
    //                     .send({ id_project: savedProject._id, email: "email@email.com"})
    //                     .end((err, res) => {
    //                         //console.log("res",  res);
    //                         console.log("res.body",  res.body);
    //                         res.should.have.status(200);
    //                         res.body.should.be.a('object');
    //                         expect(res.body.success).to.equal(true);                                                                                                                     
    //                         expect(res.body.user.email).to.equal("email@email.com");                                               
    //                         expect(res.body.token).to.not.equal(undefined);                                               
    //                         expect(res.body.user._id).to.not.equal(undefined);                                               

    //                         var uuid = res.body.user._id.toString();
    //                         console.log("uuid", uuid);

    //                         var token = res.body.token;
    //                         console.log("token", token);

    //                         chai.request(server)
    //                             .post('/auth/resigninAnonymously' )
    //                             .set('Authorization', token)
    //                             .send({ id_project: savedProject._id, email: "email@email.com"})
    //                             .end((err, res) => {
    //                                 //console.log("res",  res);
    //                                 console.log("res.body",  res.body);
    //                                 res.should.have.status(200);
    //                                 res.body.should.be.a('object');
    //                                 expect(res.body.success).to.equal(true);                                                                                                                     
    //                                 expect(res.body.user.email).to.equal("email@email.com");                                               
    //                                 expect(res.body.token).to.not.equal(undefined);                                               
    //                                 expect(res.body.user._id.toString()).to.equal(uuid.toString());                                               

    //                                 done();
    //                             });
    //                     });
    //                 }); 
    //             });
             
                
    // });





    // it('signInAnonymouslyReLoginDifferentProject', (done) => {

        
    //     var email = "test-signInAnonymouslyReLogin-" + Date.now() + "@email.com";
    //     var pwd = "pwd";

    //     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //         // create(name, createdBy, settings)
    //         projectService.create("test-signInAnonymouslyReLogin", savedUser._id).then(function(savedProject) {     

    //             projectService.create("test-signInAnonymouslyReLoginDifferent", savedUser._id).then(function(savedProjectDifferent) {     
          
    //                 chai.request(server)
    //                     .post('/auth/signinAnonymously' )
    //                     .send({ id_project: savedProject._id, email: "email@email.com"})
    //                     .end((err, res) => {
    //                         //console.log("res",  res);
    //                         console.log("res.body",  res.body);
    //                         res.should.have.status(200);
    //                         res.body.should.be.a('object');
    //                         expect(res.body.success).to.equal(true);                                                                                                                     
    //                         expect(res.body.user.email).to.equal("email@email.com");                                               
    //                         expect(res.body.token).to.not.equal(undefined);                                               
    //                         expect(res.body.user._id).to.not.equal(undefined);                                               

    //                         var uuid = res.body.user._id.toString();
    //                         console.log("uuid", uuid);

    //                         var token = res.body.token;
    //                         console.log("token", token);

    //                         chai.request(server)
    //                             .post('/auth/resigninAnonymously' )
    //                             .set('Authorization', token)
    //                             .send({ id_project: savedProjectDifferent._id, email: "email@email.com"})
    //                             .end((err, res) => {
    //                                 //console.log("res",  res);
    //                                 console.log("res.body",  res.body);
    //                                 res.should.have.status(200);
    //                                 res.body.should.be.a('object');
    //                                 expect(res.body.success).to.equal(true);                                                                                                                     
    //                                 expect(res.body.user.email).to.equal("email@email.com");                                               
    //                                 expect(res.body.token).to.not.equal(undefined);                                               
    //                                 expect(res.body.user._id.toString()).to.equal(uuid.toString());                                               

    //                                 done();
    //                             });
    //                     });
    //                 }); 
    //             });
    //         });
                
    // });




});






describe('/signinWithCustomToken', () => {
 

    it('signinWithCustomTokenOk', (done) => {

        
        var email = "test-signinwithcustomtoken-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinWithCustomToken", savedUser._id).then(function(savedProject) {     
          
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
                        subject:  'userexternal',                                                                 
                        audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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

   




    it('signinWithCustomTokenKO', (done) => {

        
        var email = "test-signinwithcustomtoken-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinWithCustomTokenKO", savedUser._id).then(function(savedProject) {     
          
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
                        subject:  'userexternal',                                                                 
                        audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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

        
    var email = "test-signinwithcustomtokenkonoid-" + Date.now() + "@email.com";
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
                    subject:  'userexternal',                                                                 
                    audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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
            
}).timeout(20000);




it('signinWithCustomTokenKONoAud', (done) => {

        
    var email = "test-signinwithcustomtokenkowrongaud-" + Date.now() + "@email.com";
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



   // mocha test/authentication.js  --grep 'signinWithCustomTokenOkTwoSigninWithCT'

it('signinWithCustomTokenOkTwoSigninWithCT', (done) => {

        
    var email = "test-signinwithcustomtokenoktwosigninwithct-" + Date.now() + "@email.com";
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
                    subject:  'userexternal',                                                                 
                    audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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
            
}).timeout(20000);





   // mocha test/authentication.js  --grep 'signinWithCustomTokenRoleNew'


it('signinWithCustomTokenRoleNew', (done) => {

        
    var email = "test-signinWithCustomTokenRole-" + Date.now() + "@email.com";
    var pwd = "pwd";


    var emailToCheck = "emailrole"+ Date.now() +"@email.com";


    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenRole", savedUser._id).then(function(savedProject) {     
      
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
                var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: emailToCheck, role:"admin"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {                                                            
                    subject:  'userexternal',                                                                 
                    audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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
                        console.log("1");
                                                                                                           
                        expect(res.body.user.email).to.equal(emailToCheck);  
                        console.log("2");
                        expect(res.body.user.firstname).to.equal("andrea");          
                        // expect(res.body.user._id).to.not.equal("123");          
                        console.log("3");
                                                        
                       
                        expect(res.body.token).to.not.equal(undefined);  
                        // expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                     
                        console.log("4");
                        done();
                    });
                });
            });
        });

});





   // mocha test/authentication.js  --grep 'signinWithCustomTokenRole'


   it('signinWithCustomTokenRoleEmailAlreadyUsed', (done) => {

        
    var email = "test-signinWithCustomTokenRoleEmailAlreadyUsed-" + Date.now() + "@email.com";
    var pwd = "pwd";


    var emailToCheck = "emailrole"+ Date.now() +"@email.com";

    userService.signup( emailToCheck ,pwd, "andrea", "leo").then(function(savedUserToCheck) {

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenRoleEmailAlreadyUsed", savedUser._id).then(function(savedProject) {     
      
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
                var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: emailToCheck, role:"admin"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {                                                            
                    subject:  'userexternal',                                                                 
                    audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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
                        // console.log("1");
                                                                                                           
                        expect(res.body.user.email).to.equal(emailToCheck);  
                        // console.log("2");
                        expect(res.body.user.firstname).to.equal("andrea");          
                        // expect(res.body.user._id).to.not.equal("123");          
                        // console.log("3");
                                                        
                       
                        expect(res.body.token).to.not.equal(undefined);  
                        // expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                     
                        // console.log("4");
                        done();
                    });
                });
            });
        });
    });
});







   // mocha test/authentication.js  --grep 'signinWithCustomTokenRoleSameOwnerEmail'


   it('signinWithCustomTokenRoleSameOwnerEmail', (done) => {

        
    var email = "test-sctrolesameowner-" + Date.now() + "@email.com";
    var pwd = "pwd";


    var emailToCheck = email;


    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        // create(name, createdBy, settings)
        projectService.create("test-signinWithCustomTokenRoleEmailAlreadyUsed", savedUser._id).then(function(savedProject) {     
      
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
                var externalUserObj = {_id: "123", firstname:"andrea", lastname:"leo", email: emailToCheck, role:"admin"};
                
                console.log("externalUserObj", externalUserObj);


                var signOptions = {                                                            
                    subject:  'userexternal',                                                                 
                    audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
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
                        console.log("1");
                                                                                                           
                        expect(res.body.user.email).to.equal(emailToCheck);  
                        console.log("2");
                        expect(res.body.user.firstname).to.equal("Test Firstname");          
                        // expect(res.body.user._id).to.not.equal("123");          
                        console.log("3");
                                                        
                       
                        expect(res.body.token).to.not.equal(undefined);  
                        // expect(res.body.token).to.equal('JWT '+jwtToken);  
                                                                     
                        console.log("4");
                        done();
                    });
                });
            });
        });
    });





  }).timeout(20000);


