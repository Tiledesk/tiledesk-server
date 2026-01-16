
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
let userService = require('../services/userService');
let projectService = require('../services/projectService');
let faqService = require('../services/faqService');

let log = false;

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FileRoute', () => {

    describe('Upload User/Chatbot avatar', () => {

        it('post-user-photo', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/users/photo')
                        .auth(email, pwd)
                        .set('Content-Type', 'image/jpeg')
                        .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('Image uploaded successfully');
                            expect(res.body.filename).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fphoto.jpg`);
                            expect(res.body.thumbnail).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fthumbnails_200_200-photo.jpg`);

                            done();
                        });
                })
            })
        });

        it('post-user-photo-already-exists', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/users/photo')
                        .auth(email, pwd)
                        .set('Content-Type', 'image/jpeg')
                        .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('Image uploaded successfully');
                            expect(res.body.filename).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fphoto.jpg`);
                            expect(res.body.thumbnail).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fthumbnails_200_200-photo.jpg`);

                            chai.request(server)
                                .post('/' + savedProject._id + '/files/users/photo')
                                .auth(email, pwd)
                                .set('Content-Type', 'image/jpeg')
                                .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                                .end((err, res) => {
                                    
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(409);
                                    res.body.should.be.a('object');
                                    expect(res.body.success).to.equal(false);
                                    expect(res.body.error).to.equal('Error uploading photo image, file already exists');

                                    done();
                                })

                        });
                })
            })
        });

        it('post-user-photo-unauthorized', (done) => {
            let email = "test-signup-" + Date.now() + "@email.com";
            let attacker_email = "attacker-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    userService.signup(attacker_email, pwd, "Test Firstname", "Test lastname").then(function (attackerUser) {

                        chai.request(server)
                            .post('/' + savedProject._id + '/files/users/photo')
                            .auth(attacker_email, pwd)
                            .set('Content-Type', 'image/jpeg')
                            .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                            .end((err, res) => {
            
                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(403);
                                res.body.should.be.a('object');
                                expect(res.body.success).to.equal(false);
                                expect(res.body.msg).to.equal(`you dont belong to the project.`);
    
                                done();
                            });
                    })
                })
            })
        });

        it('post-chatbot-avatar', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    faqService.create(savedProject._id, savedUser._id, { name: "testbot" }).then(function (savedChatbot) {

                        chai.request(server)
                            .post('/' + savedProject._id + '/files/users/photo?bot_id=' + savedChatbot._id)
                            .auth(email, pwd)
                            .set('Content-Type', 'image/jpeg')
                            .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                            .end((err, res) => {
                                
                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(201);
                                res.body.should.be.a('object');
                                expect(res.body.message).to.equal('Image uploaded successfully');
                                expect(res.body.filename).to.equal(`uploads%2Fusers%2F${savedChatbot._id}%2Fimages%2Fphoto.jpg`);
                                expect(res.body.thumbnail).to.equal(`uploads%2Fusers%2F${savedChatbot._id}%2Fimages%2Fthumbnails_200_200-photo.jpg`);
                                done();
                            });
                    })

                })
            })
        })

        it('post-chatbot-avatar-unauthorized', (done) => {
            let email = "test-signup-" + Date.now() + "@email.com";
            let attacker_email = "attacker-" + Date.now() + "@email.com";
            let pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                userService.signup(attacker_email, pwd, "Test Firstname", "Test lastname").then(function (attackerUser) {
                    projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                        projectService.create("test-attacker-project", attackerUser._id).then(function (attackerProject) {
                            faqService.create(savedProject._id, savedUser._id, { name: "testbot" }).then(function (savedChatbot) {
        
                                chai.request(server)
                                    .post('/' + attackerProject._id + '/files/users/photo?bot_id=' + savedChatbot._id)
                                    .auth(attacker_email, pwd)
                                    .set('Content-Type', 'image/jpeg')
                                    .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                                    .end((err, res) => {
                                        
                                        if (err) { console.error("err: ", err); }
                                        if (log) { console.log("res.body", res.body); }
        
                                        res.should.have.status(401);
                                        res.body.should.be.a('object');
                                        expect(res.body.success).to.equal(false);
                                        expect(res.body.error).to.equal("You don't belong to the chatbot's project");

                                        done();
                                    });
                            })
                        })
                    })
                })
            })
        })

    });

    describe('Upload Chat Files', () => {

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

    })

    describe('Upload Project Assets Files', () => {

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
                            expect(res.body.error).to.equal("File extension .xyz is not allowed");

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
                            expect(res.body.error).to.equal("File content does not match mimetype. Detected: unknown, provided: application/pdf");

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
                            expect(res.body.error).to.equal("File extension .xyz is not allowed");

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
                            expect(res.body.error).to.equal("File content does not match mimetype. Detected: unknown, provided: application/pdf");

                            done();
                        });
                })
            })
        });

        it('post-chat-xss-html-as-image', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";
            // Prepare the file buffer inline, so we don't need an extra test fixture file.
            var maliciousContent = Buffer.from('<script>alert("xss-stored")</script>', 'utf8');

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {
                    chai.request(server)
                        .post('/' + savedProject._id + '/files/chat')
                        .auth(email, pwd)
                        .set('Content-Type', 'image/png')
                        .attach('file', maliciousContent, 'xss2.html')
                        .end((err, res) => {
                            
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            // Expect rejection since the file is actually HTML, not a PNG, and not a valid image.
                            res.should.have.status(403);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(false);
                            expect(res.body.error).to.equal("File extension .html is not allowed");

                            done();
                        });
                })
            })
        });

    })

    describe('Delete', () => {

        it('delete-user-photo', (done) => {
            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-assets-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/files/users/photo')
                        .auth(email, pwd)
                        .set('Content-Type', 'image/jpeg')
                        .attach('file', fs.readFileSync('./test/fixtures/avatar.jpg'), 'avatar.jpg')
                        .end((err, res) => {
        
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body", res.body); }

                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            expect(res.body.message).to.equal('Image uploaded successfully');
                            expect(res.body.filename).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fphoto.jpg`);
                            expect(res.body.thumbnail).to.equal(`uploads%2Fusers%2F${savedUser._id}%2Fimages%2Fthumbnails_200_200-photo.jpg`);

                            let filepath = res.body.filename;

                            chai.request(server)
                                .delete('/' + savedProject._id + '/files?path=' + filepath)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.message).to.equal('File deleted successfully');

                                    chai.request(server)
                                        .get('/' + savedProject._id + '/files?path=' + filepath)
                                        .auth(email, pwd)
                                        .end((err, res) => {
                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body", res.body); }
                                            
                                            res.should.have.status(404);
                                            res.body.should.be.a('object');
                                            expect(res.body.success).to.equal(false);
                                            expect(res.body.error).to.equal('File not found.');
                                            
                                            done();
                                        })
                                })
                        });
                })
            })
        });

    })


});


