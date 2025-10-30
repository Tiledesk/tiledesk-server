//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';
process.env.ENABLE_ATTACHMENT_RETENTION = "true"


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(require('chai-string'));
let server = require('../app');
let should = chai.should();
var fs = require('fs');
var userService = require('../services/userService');
let projectService = require('../services/projectService');

let log = false;

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FileRoute', () => {

    describe('Upload', () => {

        it('post-chat-pdf', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/chat')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/sample.pdf'), 'sample.pdf')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }
        
                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('File uploaded successfully');
                            expect(res.body.filename).to.not.equal(null);

                            done();
                        });
                })
            })
        });

        it('post-chat-png', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/chat')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/test-image.png'), 'test-image.png')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('File uploaded successfully');
                            expect(res.body.filename).to.not.equal(null);
                            expect(res.body.thumbnail).to.not.equal(null);
                            done();
                        });
                })
            })
        });

        it('post-assets-pdf', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/files/assets')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/sample.pdf'), 'sample.pdf')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }
        
                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('File uploaded successfully');
                            expect(res.body.filename).to.not.equal(null);

                            done();
                        });
                })
            })
        });

        it('post-assets-png', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                        .post('/' + savedProject._id + '/files/assets')
                        .auth(email, pwd)
                        .set('Content-Type', 'image/jpeg')
                        .attach('file', fs.readFileSync('./test/fixtures/test-image.png'), 'test-image.png')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }
        
                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('File uploaded successfully');
                            expect(res.body.filename).to.not.equal(null);
                            expect(res.body.thumbnail).to.not.equal(null);

                            done();
                        });
                })
            })
        });

        it('post-assets-images-retro-compatibility', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    
                    chai.request(server)
                    .post('/images/users/')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/fixtures/test-image.png'), 'test-image.png')
                    // .field('delimiter', ';')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('Image uploded successfully');
                        expect(res.body.filename).to.not.equal(null);
                        expect(res.body.filename).to.containIgnoreSpaces('test-image.png');
                        expect(res.body.filename).to.containIgnoreSpaces('users', 'images');
                        expect(res.body.thumbnail).to.not.equal(null);

                        let filepath = res.body.filename;

                        chai.request(server)
                            .get('/' + savedProject._id + '/files?path=' + filepath)
                            .auth(email, pwd)
                            .end((err, res) => {
            
                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }
            
                                res.should.have.status(200);
                                expect(res.body).to.be.instanceof(Buffer)
                                
                                done();
                            });
                    });
                })
            })
        });

    });

    describe('Security', () => {

        /**
         * This test verifies that a file with an extension 
         * not present in the whitelist will not be uploaded.
         */
        it('post-chat-not-whitelisted-extension', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/chat')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/sample.xyz'), 'sample.xyz')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(403);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.msg).to.equal("Extension not allowed");

                            done();
                        });
                })
            })
        });

        /**
         * This test verifies that an html file whose extension has been renamed to 
         * a whitelisted extension will not be uploaded.
         */
        it('post-chat-pdf-attack-html', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/chat')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/fake.pdf'), 'fake.pdf')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(403);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.msg).to.equal("File content does not match mimetype. Detected: unknown, provided: application/pdf");

                            done();
                        });
                })
            })
        });

        /**
         * This test verifies that a file with an extension 
         * not present in the whitelist will not be uploaded.
         */
        it('post-assets-not-whitelisted-extension', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/assets')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/sample.xyz'), 'sample.xyz')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(403);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.msg).to.equal("Extension not allowed");

                            done();
                        });
                })
            })
        });

        /**
         * This test verifies that an html file whose extension has been renamed to 
         * a whitelisted extension will not be uploaded.
         */
        it('post-assets-pdf-attack-html', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/assets')
                        .auth(email, pwd)
                        .set('Content-Type', 'application/pdf')
                        .attach('file', fs.readFileSync('./test/fixtures/fake.pdf'), 'fake.pdf')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(403);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.msg).to.equal("File content does not match mimetype. Detected: unknown, provided: application/pdf");

                            done();
                        });
                })
            })
        });

    })


});


