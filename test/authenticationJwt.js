//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//let User = require('../models/user');
let projectService = require('../services/projectService');
let requestService = require('../services/requestService');
let userService = require('../services/userService');
let leadService = require('../services/leadService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

let expect = chai.expect;
let assert = chai.assert;
let jwt = require('jsonwebtoken');
let config = require('../config/database'); // get db config file
let faqService = require('../services/faqService');

let log = false;

chai.use(chaiHttp);

describe('AuthenticationJWT', () => {

    it('signinJWt-userNoAudNoSubject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                let jwtToken = jwt.sign(savedUser.toObject(), config.secret);
                if (log) { console.log("jwtToken", jwtToken); }

                chai.request(server)
                    .get('/' + savedProject._id + '/requests')
                    .set('Authorization', 'JWT ' + jwtToken)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);

                        done();
                    });
            });
        });
    });


    it('signinJWt-userYESAudNoSubject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                let savedUserObj = savedUser.toObject();
                if (log) { console.log("savedUserObj", savedUserObj); }

                let signOptions = {
                    // subject:  'user',                                                                 
                    audience: 'https://tiledesk.com',
                };


                let jwtToken = jwt.sign(savedUserObj, config.secret, signOptions);
                if (log) { console.log("jwtToken", jwtToken); }

                chai.request(server)
                    .get('/' + savedProject._id + '/requests')
                    .set('Authorization', 'JWT ' + jwtToken)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);

                        done();
                    });
            });
        });
    });
                


    it('signinJWt-userYESAudYesSubject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                let savedUserObj = savedUser.toObject();
                if (log) { console.log("savedUserObj", savedUserObj); }

                let signOptions = {
                    subject: 'user',
                    audience: 'https://tiledesk.com',
                };

                let jwtToken = jwt.sign(savedUserObj, config.secret, signOptions);
                if (log) { console.log("jwtToken", jwtToken); }

                chai.request(server)
                    .get('/' + savedProject._id + '/requests')
                    .set('Authorization', 'JWT ' + jwtToken)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);

                        done();
                    });
            });
        });
    });


    it('signinJWt-Project-user-YESAudNoSubject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/keys/generate')
                    .auth(email, pwd)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.jwtSecret).to.not.equal(null);

                        let savedUserObj = savedUser.toObject();
                        if (log) { console.log("savedUserObj", savedUserObj); }

                        let signOptions = {
                            // subject:  'user',                                                                 
                            audience: 'https://tiledesk.com/projects/' + savedProject._id,
                        };

                        let jwtToken = jwt.sign(savedUserObj, res.body.jwtSecret, signOptions);
                        if (log) { console.log("jwtToken", jwtToken); }

                        chai.request(server)
                            .get('/' + savedProject._id + '/requests')
                            .set('Authorization', 'JWT ' + jwtToken)
                            .send()
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);

                                done();
                            });
                    });
            });
        });
    });
                            
                    


    it('signinJWt-Project-user-YESAudYesSubject', (done) => {

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/keys/generate')
                    .auth(email, pwd)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.jwtSecret).to.not.equal(null);

                        let savedUserObj = savedUser.toObject();
                        if (log) { console.log("savedUserObj", savedUserObj); }

                        let signOptions = {
                            subject: 'user',
                            audience: 'https://tiledesk.com/projects/' + savedProject._id,
                        };

                        let jwtToken = jwt.sign(savedUserObj, res.body.jwtSecret, signOptions);
                        if (log) { console.log("jwtToken", jwtToken); }
                        
                        chai.request(server)
                            .get('/' + savedProject._id + '/requests')
                            .set('Authorization', 'JWT ' + jwtToken)
                            .send()
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);

                                done();
                            });
                    });
            });
        });
    });                    
                                                

    it('signinJWt-Project-external-user-YESAudYesSubject', (done) => {


        //   this.timeout();

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {

                chai.request(server)
                    .post('/' + savedProject._id + '/keys/generate')
                    .auth(email, pwd)
                    .send()
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.jwtSecret).to.not.equal(null);


                        let externalUserObj = { _id: "123", name: "andrea", surname: "leo" };
                        if (log) { console.log("externalUserObj", externalUserObj); }

                        let signOptions = {
                            subject: 'userexternal',
                            audience: 'https://tiledesk.com/projects/' + savedProject._id,
                        };

                        let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                        if (log) { console.log("jwtToken", jwtToken); }

                        chai.request(server)
                            .get('/testauth/noentitycheck')
                            .set('Authorization', 'JWT ' + jwtToken)
                            .send()
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

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
    
//             let email = "test-signup-" + Date.now() + "@email.com";
//             let pwd = "pwd";
    
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
                    

//                         let externalUserObj = {_id:"123",name:"andrea", surname:"leo",role : 'agent'};
                        
//                         console.log("externalUserObj", externalUserObj);


//                         let signOptions = {                                                            
//                             subject:  'userexternal',                                                                                     
//                             audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
//                             };


//                         let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret,signOptions);

                            
                                
//                                 if (log) { console.log("jwtToken", jwtToken); }
                                
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

        let email = "test-signup-" + Date.now() + "@email.com";
        let pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
            // create(name, createdBy, settings)
            projectService.create("test-signinJWt-user", savedUser._id).then(function (savedProject) {
                // create(name, url, projectid, user_id, type, description, webhook_url, webhook_enabled, language) {                                         
                faqService.create(savedProject._id, savedUser._id, { name: "testbot"}).then(function (savedBot) {

                    let savedBotObj = savedBot.toObject();
                    if (log) { console.log("savedBotObj", savedBotObj); }

                    let signOptions = {
                        subject: 'bot',
                        audience: 'https://tiledesk.com/bots/' + savedBot._id,
                    };

                    let jwtToken = jwt.sign(savedBotObj, savedBot.secret, signOptions);
                    if (log) { console.log("jwtToken", jwtToken); }

                    chai.request(server)
                        // .get('/'+ savedProject._id + '/faq_kb')
                        .get('/' + savedProject._id + '/authtestWithRoleCheck/bot')

                        .set('Authorization', 'JWT ' + jwtToken)
                        .send()
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(200);

                            done();
                        });
                });
            });
        });
    }); 

});


