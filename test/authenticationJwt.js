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
var config = require('../config/database'); // get db config file
var faqService = require('../services/faqService');


chai.use(chaiHttp);

describe('AuthenticationJWT', () => {





it('signinJWt-userNoAudNoSubject', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                                                
                        

                            var jwtToken = jwt.sign(savedUser.toObject(), config.secret);

                              
                                  
                                  console.log("jwtToken", jwtToken);
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/requests')
                                    .set('Authorization', 'JWT '+jwtToken)
                                    .send()
                                    .end((err, res) => {
                                        console.log("res.body", res.body);
                                      res.should.have.status(200);
                                      
                                      done();
                                    });

                                
                    
                            
                        });

                        
                });
                });







it('signinJWt-userYESAudNoSubject', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                                                
                            var savedUserObj = savedUser.toObject();                           
                            console.log("savedUserObj", savedUserObj);


                            var signOptions = {                                                            
                                // subject:  'user',                                                                 
                                audience:  'https://tiledesk.com',                                              
                              };


                            var jwtToken = jwt.sign(savedUserObj, config.secret,signOptions);

                              
                                  
                                  console.log("jwtToken", jwtToken);
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/requests')
                                    .set('Authorization', 'JWT '+jwtToken)
                                    .send()
                                    .end((err, res) => {
                                        console.log("res.body", res.body);
                                      res.should.have.status(200);
                                      
                                      done();
                                    });

                                
                    
                            
                        });

                        
                });
                });
                


it('signinJWt-userYESAudYesSubject', (done) => {

        
                    //   this.timeout();
                
                       var email = "test-signup-" + Date.now() + "@email.com";
                       var pwd = "pwd";
                
                        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                            // create(name, createdBy, settings)
                            projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                                                                
                                            var savedUserObj = savedUser.toObject();                           
                                            console.log("savedUserObj", savedUserObj);
                
                
                                            var signOptions = {                                                            
                                                subject:  'user',                                                                 
                                                audience:  'https://tiledesk.com',                                              
                                              };
                
                
                                            var jwtToken = jwt.sign(savedUserObj, config.secret,signOptions);
                
                                              
                                                  
                                                  console.log("jwtToken", jwtToken);
                                                    chai.request(server)
                                                    .get('/'+ savedProject._id + '/requests')
                                                    .set('Authorization', 'JWT '+jwtToken)
                                                    .send()
                                                    .end((err, res) => {
                                                        console.log("res.body", res.body);
                                                      res.should.have.status(200);
                                                      
                                                      done();
                                                    });
                
                                                
                                    
                                            
                                        });
                
                                        
                                });
                                });







    it('signinJWt-Project-user-YESAudNoSubject', (done) => {


        //   this.timeout();
    
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                              
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
                    
                        var savedUserObj = savedUser.toObject();                           
                        console.log("savedUserObj", savedUserObj);


                        var signOptions = {                                                            
                            // subject:  'user',                                                                 
                            audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                            };


                        var jwtToken = jwt.sign(savedUserObj, res.body.jwtSecret,signOptions);

                            
                                
                                console.log("jwtToken", jwtToken);
                                chai.request(server)
                                .get('/'+ savedProject._id + '/requests')
                                .set('Authorization', 'JWT '+jwtToken)
                                .send()
                                .end((err, res) => {
                                    console.log("res.body", res.body);
                                    res.should.have.status(200);
                                    
                                    done();
                                });

                            
                
                        
                    });





                    });
                            
                            
                    });
                    });
                            
                    


    it('signinJWt-Project-user-YESAudYesSubject', (done) => {


        //   this.timeout();
    
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                
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
                    
                        var savedUserObj = savedUser.toObject();                           
                        console.log("savedUserObj", savedUserObj);


                        var signOptions = {                                                            
                            subject:  'user',                                                                 
                            audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                            };


                        var jwtToken = jwt.sign(savedUserObj, res.body.jwtSecret,signOptions);

                            
                                
                                console.log("jwtToken", jwtToken);
                                chai.request(server)
                                .get('/'+ savedProject._id + '/requests')
                                .set('Authorization', 'JWT '+jwtToken)
                                .send()
                                .end((err, res) => {
                                    console.log("res.body", res.body);
                                    res.should.have.status(200);
                                    
                                    done();
                                });

                            
                
                        
                    });





                    });
                            
                            
                    });
                    });                    
                                                


    it('signinJWt-Project-external-user-YESAudYesSubject', (done) => {


        //   this.timeout();
    
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                
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
                    

                        var externalUserObj = {_id:"123",name:"andrea", surname:"leo"};
                        
                        console.log("externalUserObj", externalUserObj);


                        var signOptions = {                                                            
                            subject:  'userexternal',                                                                 
                            audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                            };


                        var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);

                            
                                
                                console.log("jwtToken", jwtToken);
                                
                                chai.request(server)
                                .get('/testauth/noentitycheck')
                                .set('Authorization', 'JWT '+jwtToken)
                                .send()
                                .end((err, res) => {
                                    console.log("res.body", res.body);
                                    res.should.have.status(200);
                                    
                                    done();
                                });

                            
                
                        
                    });





                    });
                            
                            
                    });
                    });                           







// // mocha test/authenticationJwt.js  --grep 'signinJWt-Project-external-user-YESAudYesSubjectAndRole'

//     it('signinJWt-Project-external-user-YESAudYesSubjectAndRole', (done) => {


//         //   this.timeout();
    
//             var email = "test-signup-" + Date.now() + "@email.com";
//             var pwd = "pwd";
    
//             userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
//                 // create(name, createdBy, settings)
//                 projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {                                              
                                                
//                     chai.request(server)
//                     .post('/'+ savedProject._id + '/keys/generate')
//                     .auth(email, pwd)
//                     .send()
//                     .end((err, res) => {
//                         //console.log("res",  res);
//                         console.log("res.body",  res.body);
//                         res.should.have.status(200);
//                         res.body.should.be.a('object');
//                         expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                    

//                         var externalUserObj = {_id:"123",name:"andrea", surname:"leo",role : 'agent'};
                        
//                         console.log("externalUserObj", externalUserObj);


//                         var signOptions = {                                                            
//                             subject:  'userexternal',                                                                                     
//                             audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
//                             };


//                         var jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);

                            
                                
//                                 console.log("jwtToken", jwtToken);
                                
//                                 chai.request(server)
//                                 .get('/testauth/noentitycheck')
//                                 .set('Authorization', 'JWT '+jwtToken)
//                                 .send()
//                                 .end((err, res) => {
//                                     console.log("res.body", res.body);
//                                     res.should.have.status(200);
                                    
//                                     done();
//                                 });

                            
                
                        
//                     });





//                     });
                            
                            
//                     });
//                     });                           

    it('signinJWt-bot-YESAudYesSubject', (done) => {


        //   this.timeout();
    
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinJWt-user", savedUser._id).then(function(savedProject) {     
                    // create(name, url, projectid, user_id, type, description, webhook_url, webhook_enabled, language) {                                         
                    faqService.create("testbot", null, savedProject._id, savedUser._id).then(function(savedBot) {                                                             
                                var savedBotObj = savedBot.toObject();                           
                                console.log("savedBotObj", savedBotObj);
    
    
                                var signOptions = {                                                            
                                    subject:  'bot',                                                                 
                                    audience:  'https://tiledesk.com/bots/'+savedBot._id,                                              
                                    };
    
    
                                var jwtToken = jwt.sign(savedBotObj, savedBot.secret,signOptions);
    
                                    
                                        
                                        console.log("jwtToken", jwtToken);
                                        chai.request(server)
                                        // .get('/'+ savedProject._id + '/faq_kb')
                                        .get('/'+savedProject._id+'/authtestWithRoleCheck/bot')
                                       
                                        .set('Authorization', 'JWT '+jwtToken)
                                        .send()
                                        .end((err, res) => {
                                            console.log("res.body", res.body);
                                            res.should.have.status(200);
                                            
                                            done();
                                        });
    
                                    
                        
                                
                            });
    
                        });
                    });
                    });           
                    
                
    

});


