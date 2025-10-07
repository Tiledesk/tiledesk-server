//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = "admin@tiledesk.com";
process.env.LOG_LEVEL = 'critical';
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

let config = require('../config/database');

let log = false;

let mongoose = require('mongoose');
mongoose.connect(config.databasetest);


chai.use(chaiHttp);

describe('Authentication', () => {

    // mocha test/authentication.js  --grep 'signinOk'

    describe('/signin', () => {


        it('signinOk', (done) => {

            let email = "test-signin-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .post('/auth/signin')
                    .send({ "email": email, "password": pwd })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

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

            let email = "test-signinko-" + Date.now() + "@email.com";
            let pwd = "pwd";

            chai.request(server)
                .post('/auth/signin')
                .send({ "email": email, "password": pwd })
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(401);

                    done();
                });

        });


        it('signinValidation', (done) => {

            let email = "test-signinko-" + Date.now() + "@email.com";
            let pwd = "pwd";

            chai.request(server)
                .post('/auth/signin')
                .send()
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(422);

                    done();
                });

        });


        // mocha test/authentication.js  --grep 'signinLowercase'
        it('signinLowercase', (done) => {

            let email = "Test-SigninKO-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .post('/auth/signin')
                    .send({ "email": email, "password": pwd })
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.success).to.equal(true);
                        expect(res.body.token).to.not.equal(null);
                        expect(res.body.user.email).to.equal(email.toLowerCase());
                        expect(res.body.user.password).to.equal(undefined);

                        chai.request(server)
                            .get('/users/')
                            .auth(email, pwd)
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                res.body.should.be.a('object');

                                done();
                            });
                    });
            });
        });

    });

    describe('/signup', () => {


        it('signupOk', (done) => {

            let email = "test-signuook-" + Date.now() + "@email.com";
            let pwd = "Pwd1234!";

            chai.request(server)
                .post('/auth/signup')
                .send({ email: email, password: pwd, lastname: "lastname", firstname: "firstname", disableEmail: true }) // whi disableEmail true?
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    expect(res.body.success).to.equal(true);
                    expect(res.body.user.email).to.equal(email);
                    expect(res.body.user.password).to.equal(undefined);

                    done();
                });
        });


        // it('verifyemail', (done) => {

        //     let user_id = "670e55c8187b430e793d644e";
        //     let code = "4fx6e1hfcm2admb4a";
        //     chai.request(server)
        //         .put('/auth/verifyemail/' + user_id + '/' + code)
        //         .send({ emailVerified: true })
        //         .end((err, res) => {

        //             console.error("err: ", err)
        //             console.log("res.body: ", res.body)
        //             done();
        //         })



        // });




        // it('signUpAdminNoVerificationEmail', (done) => {

        //     let email = "test-signup-" + Date.now() + "@email.com";
        //     let pwd = "pwd";

        //     chai.request(server)
        //         .post("/auth/signin")
        //         .send({ email: "admin@tiledesk.com", password: "adminadmin" })
        //         .end((err, res) => {

        //             // console.log("login with superadmin res.body: ", res.body)
        //             let superadmin_token = res.body.token;

        //             chai.request(server)
        //                 .post("/auth/signup")
        //                 .set('Authorization', superadmin_token)
        //                 .send({ email: email, password: pwd, lastname: "lastname", firstname: "firstname", disableEmail: true })
        //                 .end((err, res) => {

        //                     // console.log("res.body: ", res.body);
        //                     done();
        //                 })
        //         })


        // })

        // mocha test/authentication.js  --grep 'signupUpperCaseEmail'


        it('signupUpperCaseEmail', (done) => {

            let now = Date.now();
            let email = "test-signupUpperCaseEmail-" + now + "@email.com";
            let pwd = "Pwd1234!";

            chai.request(server)
                .post('/auth/signup')
                .send({ email: email, password: pwd, lastname: "lastname", firstname: "firstname", disableEmail: true })
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

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

            let email = "test-signuoOk-" + Date.now() + "@email";
            let pwd = "Pwd1234!";

            chai.request(server)
                .post('/auth/signup')
                .send({ email: email, password: pwd, lastname: "lastname", firstname: "firstname", disableEmail: true })
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(422);

                    done();
                });
        });


        // });













    });

    describe('/signInAnonymously', () => {


        it('signInAnonymouslyOk', (done) => {

            let email = "test-signInAnonymouslyOk-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signInAnonymouslyOk", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/auth/signinAnonymously')
                        .send({ id_project: savedProject._id, email: "email@email.com" })
                        .end((err, res) => {

                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

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


        //     let email = "test-signInAnonymouslyReLogin-" + Date.now() + "@email.com";
        //     let pwd = "pwd";

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

        //                         let uuid = res.body.user._id.toString();
        //                         console.log("uuid", uuid);

        //                         let token = res.body.token;
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


        //     let email = "test-signInAnonymouslyReLogin-" + Date.now() + "@email.com";
        //     let pwd = "pwd";

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

        //                         let uuid = res.body.user._id.toString();
        //                         console.log("uuid", uuid);

        //                         let token = res.body.token;
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

            let email = "test-signinwithcustomtoken-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomToken", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { _id: "123", firstname: "andrea", lastname: "leo", email: "email2@email.com", customAttr: "c1" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.user.email).to.equal("email2@email.com");
                                    expect(res.body.user.firstname).to.equal("andrea");
                                    expect(res.body.user.customAttr).to.equal("c1");
                                    expect(res.body.token).to.not.equal(undefined);
                                    expect(res.body.token).to.equal('JWT ' + jwtToken);

                                    done();
                                });
                        });
                });
            });
        });


        it('signinWithCustomTokenKO', (done) => {

            let email = "test-signinwithcustomtoken-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomTokenKO", savedUser._id).then(function (savedProject) {

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

                            let externalUserObj = { _id: "123", name: "andrea", surname: "leo", customAttr: "c1" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };


                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret + "1234567KOOOOOOO", signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                .send({ id_project: savedProject._id })
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(401);

                                    done();
                                });
                        });
                });
            });
        });


        it('signinWithCustomTokenKONoID', (done) => {

            let email = "test-signinwithcustomtokenkonoid-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomTokenKONoID", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { firstname: "andrea", lastname: "leo", email: "email2@email.com" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(401);

                                    done();
                                });
                        });
                });
            });

        }).timeout(20000);


        // mocha test/authentication.js  --grep 'signinWithCustomTokenKONoAud'
        it('signinWithCustomTokenKONoAud', (done) => {

            let email = "test-signinwithcustomtokenkowrongaud-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomTokenKOWrongAud", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { _id: 1234, firstname: "andrea", lastname: "leo", email: "email2@email.com" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                //audience:  'https://tiledesk.com/projects/'+savedProject._id ,                                              
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(401);

                                    done();
                                });
                        });
                });
            });
        });


        // mocha test/authentication.js  --grep 'signinWithCustomTokenOkTwoSigninWithCT'
        it('signinWithCustomTokenOkTwoSigninWithCT', (done) => {

            let email = "test-signinwithcustomtokenoktwosigninwithct-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomTokenOkTwoSigninWithCT", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { _id: "123", firstname: "andrea", lastname: "leo", email: "email2@email.com", customAttr: "c1" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.user.email).to.equal("email2@email.com");
                                    expect(res.body.user.firstname).to.equal("andrea");
                                    expect(res.body.user.customAttr).to.equal("c1");
                                    expect(res.body.token).to.not.equal(undefined);
                                    expect(res.body.token).to.equal('JWT ' + jwtToken);

                                    chai.request(server)
                                        .post('/auth/signinWithCustomToken')
                                        .set('Authorization', 'JWT ' + jwtToken)
                                        //.send({ id_project: savedProject._id})
                                        .send()
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }

                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(true);
                                            expect(res.body.user.email).to.equal("email2@email.com");
                                            expect(res.body.user.firstname).to.equal("andrea");
                                            expect(res.body.user.customAttr).to.equal("c1");
                                            expect(res.body.token).to.not.equal(undefined);
                                            expect(res.body.token).to.equal('JWT ' + jwtToken);

                                            done();
                                        });
                                });
                        });
                });
            });

        }).timeout(20000);


        // mocha test/authentication.js  --grep 'signinWithCustomTokenRoleNew'
        it('signinWithCustomTokenRoleNew', (done) => {

            let email = "test-signinWithCustomTokenRole-" + Date.now() + "@email.com";
            let pwd = "pwd";
            let emailToCheck = "emailrole" + Date.now() + "@email.com";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                // create(name, createdBy, settings)
                projectService.create("test-signinWithCustomTokenRole", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { _id: "123", firstname: "andrea", lastname: "leo", email: emailToCheck, role: "admin" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.user.email).to.equal(emailToCheck);
                                    expect(res.body.user.firstname).to.equal("andrea");
                                    // expect(res.body.user._id).to.not.equal("123");
                                    expect(res.body.token).to.not.equal(undefined);
                                    // expect(res.body.token).to.equal('JWT '+jwtToken);  
                                    done();
                                });
                        });
                });
            });
        });


        // mocha test/authentication.js  --grep 'signinWithCustomTokenRole'
        it('signinWithCustomTokenRoleEmailAlreadyUsed', (done) => {

            let email = "test-signinWithCustomTokenRoleEmailAlreadyUsed-" + Date.now() + "@email.com";
            let pwd = "pwd";
            let emailToCheck = "emailrole" + Date.now() + "@email.com";

            userService.signup(emailToCheck, pwd, "andrea", "leo").then(function (savedUserToCheck) {
                userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                    projectService.create("test-signinWithCustomTokenRoleEmailAlreadyUsed", savedUser._id).then(function (savedProject) {

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

                                // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                                let externalUserObj = { _id: "123", firstname: "andrea", lastname: "leo", email: emailToCheck, role: "admin" };
                                if (log) { console.log("externalUserObj", externalUserObj); }

                                let signOptions = {
                                    subject: 'userexternal',
                                    audience: 'https://tiledesk.com/projects/' + savedProject._id,
                                };

                                let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                                if (log) { console.log("jwtToken", jwtToken); }

                                chai.request(server)
                                    .post('/auth/signinWithCustomToken')
                                    .set('Authorization', 'JWT ' + jwtToken)
                                    //.send({ id_project: savedProject._id})
                                    .send()
                                    .end((err, res) => {

                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }

                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(true);
                                        expect(res.body.user.email).to.equal(emailToCheck);
                                        expect(res.body.user.firstname).to.equal("andrea");
                                        // expect(res.body.user._id).to.not.equal("123");
                                        expect(res.body.token).to.not.equal(undefined);
                                        // expect(res.body.token).to.equal('JWT '+jwtToken);
                                        done();
                                    });
                            });
                    });
                });
            });
        });


        // mocha test/authentication.js  --grep 'signinWithCustomTokenRoleSameOwnerEmail'
        it('signinWithCustomTokenRoleSameOwnerEmail', (done) => {

            let email = "test-sctrolesameowner-" + Date.now() + "@email.com";
            let pwd = "pwd";
            let emailToCheck = email;

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-signinWithCustomTokenRoleEmailAlreadyUsed", savedUser._id).then(function (savedProject) {

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

                            // 'E11000 duplicate key error collection: tiledesk-test.users index: email_1 dup key: { email: "email@email.com" }' }
                            let externalUserObj = { _id: "123", firstname: "andrea", lastname: "leo", email: emailToCheck, role: "admin" };
                            if (log) { console.log("externalUserObj", externalUserObj); }

                            let signOptions = {
                                subject: 'userexternal',
                                audience: 'https://tiledesk.com/projects/' + savedProject._id,
                            };

                            let jwtToken = jwt.sign(externalUserObj, res.body.jwtSecret, signOptions);
                            if (log) { console.log("jwtToken", jwtToken); }

                            chai.request(server)
                                .post('/auth/signinWithCustomToken')
                                .set('Authorization', 'JWT ' + jwtToken)
                                //.send({ id_project: savedProject._id})
                                .send()
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(true);
                                    expect(res.body.user.email).to.equal(emailToCheck);
                                    expect(res.body.user.firstname).to.equal("Test Firstname");
                                    // expect(res.body.user._id).to.not.equal("123");          
                                    expect(res.body.token).to.not.equal(undefined);
                                    // expect(res.body.token).to.equal('JWT '+jwtToken);  
                                    done();
                                });
                        });
                });
            });
        });


    }).timeout(20000);

});