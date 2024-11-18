//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(require('chai-string'));
let server = require('../app');
let should = chai.should();
var fs = require('fs');
var userService = require('../services/userService');
const projectService = require('../services/projectService');

let log = false;

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('ImagesRoute', () => {

    describe('/upload', () => {

        it('upload-user', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .post('/images/users/')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/test-image.png'), 'test-image.png')
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
                        done();
                    });

            });
        });


        // mocha test/imageRoute.js  --grep 'upload-user-folder'
        it('upload-user-folder', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .put('/images/users')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                    // .field('folder', 'myfolder')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('Image uploded successfully');
                        expect(res.body.filename).to.not.equal(null);
                        expect(res.body.filename).to.containIgnoreSpaces('profile.png');
                        expect(res.body.filename).to.containIgnoreSpaces('users', 'images');
                        // assert(res.body.filename.indexOf()).to.have.string('');                             
                        // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                        expect(res.body.thumbnail).to.not.equal(null);

                        //check duplicate
                        chai.request(server)
                            .put('/images/users')
                            .auth(email, pwd)
                            .set('Content-Type', 'image/jpeg')
                            .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                            // .field('folder', 'myfolder')            
                            .end((err, res) => {
                                res.should.have.status(409);
                                done();
                            });
                    });
            });
        });


        // mocha test/imageRoute.js  --grep 'upload-avatar'
        it('upload-avatar', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .put('/images/users/photo')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                    // .field('folder', 'myfolder')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('Image uploded successfully');
                        // expect(res.body.filename).to.not.equal("photo.jpg");  
                        expect(res.body.filename).to.containIgnoreSpaces('photo.jpg');
                        expect(res.body.filename).to.containIgnoreSpaces('users', 'images');
                        // assert(res.body.filename.indexOf()).to.have.string('');                             
                        // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                        expect(res.body.thumbnail).to.not.equal(null);

                        //check duplicate
                        chai.request(server)
                            .put('/images/users/photo')
                            .auth(email, pwd)
                            .set('Content-Type', 'image/jpeg')
                            .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                            // .field('folder', 'myfolder')            
                            .end((err, res) => {

                                res.should.have.status(409);
                                done();
                            });
                    });
            });
        }).timeout(5000);


        // mocha test/imageRoute.js  --grep 'upload-avatar-force'
        it('upload-avatar-force', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .put('/images/users/photo?force=true')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                    // .field('folder', 'myfolder')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('Image uploded successfully');
                        // expect(res.body.filename).to.not.equal("photo.jpg");  
                        expect(res.body.filename).to.containIgnoreSpaces('photo.jpg');
                        expect(res.body.filename).to.containIgnoreSpaces('users', 'images');
                        // assert(res.body.filename.indexOf()).to.have.string('');                             
                        // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                        expect(res.body.thumbnail).to.not.equal(null);

                        //check duplicate
                        chai.request(server)
                            .put('/images/users/photo?force=true')
                            .auth(email, pwd)
                            .set('Content-Type', 'image/jpeg')
                            .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                            // .field('folder', 'myfolder')            
                            .end((err, res) => {
                                res.should.have.status(201);
                                done();
                            });
                    });
            });
        });


        // mocha test/imageRoute.js  --grep 'upload-avatar-another-user'
        it('upload-avatar-another-user', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function (savedProject) {

                    chai.request(server)
                        .post('/' + savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({ "name": "testbot", type: "internal", template: "example", language: 'en' })
                        .end((err, res) => {
                            if (err) { console.error("err: ", err); }
                            if (log) { console.log("res.body: ", res.body); }

                            //var bot = "bot_" + Date.now();
                            let bot_id = res.body._id;

                            chai.request(server)
                                .put('/images/users/photo?bot_id=' + bot_id)
                                .auth(email, pwd)
                                .set('Content-Type', 'image/jpeg')
                                .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                                // .field('folder', 'myfolder')            
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err); }
                                    if (log) { console.log("res.body", res.body); }

                                    res.should.have.status(201);
                                    res.body.should.be.a('object');
                                    expect(res.body.message).to.equal('Image uploded successfully');
                                    expect(res.body.filename).to.not.equal("photo.jpg");
                                    // assert(res.body.filename.indexOf()).to.have.string('');                             
                                    // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                                    expect(res.body.thumbnail).to.not.equal(null);
                                    // expect(res.body.filename).to.include.keys(bot);
                                    expect(res.body.filename).to.containIgnoreSpaces(bot_id);

                                    //check duplicate
                                    chai.request(server)
                                        .put('/images/users/photo?bot_id=' + bot_id)
                                        .auth(email, pwd)
                                        .set('Content-Type', 'image/jpeg')
                                        .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                                        // .field('folder', 'myfolder')            
                                        .end((err, res) => {

                                            if (err) { console.error("err: ", err); }
                                            if (log) { console.log("res.body: ", res.body); }
                                            
                                            res.should.have.status(409);
                                            
                                            done();
                                        });
                                });

                        })
                });
            })
        });


        // mocha test/imageRoute.js  --grep 'delete-user-folder'
        it('delete-user-folder', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {

                chai.request(server)
                    .put('/images/users')
                    .auth(email, pwd)
                    .set('Content-Type', 'image/jpeg')
                    .attach('file', fs.readFileSync('./test/test-image.png'), 'profile.png')
                    // .field('folder', 'myfolder')            
                    .end((err, res) => {

                        if (err) { console.error("err: ", err); }
                        if (log) { console.log("res.body", res.body); }

                        res.should.have.status(201);
                        res.body.should.be.a('object');
                        expect(res.body.message).to.equal('Image uploded successfully');
                        expect(res.body.filename).to.not.equal(null);
                        // assert(res.body.filename.indexOf()).to.have.string('');                             
                        // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                        expect(res.body.thumbnail).to.not.equal(null);

                        chai.request(server)
                            .delete('/images/users?path=' + res.body.filename)
                            .auth(email, pwd)
                            .end((err, res) => {

                                if (err) { console.error("err: ", err); }
                                if (log) { console.log("res.body", res.body); }

                                res.should.have.status(200);
                                expect(res.body.message).to.equal('Image deleted successfully');
                                done();
                            });
                    });
            });
        });


        // mocha test/imageRoute.js  --grep 'upload-public'
        it('upload-public', (done) => {

            chai.request(server)
                .post('/images/public/')
                .set('Content-Type', 'image/jpeg')
                .attach('file', fs.readFileSync('./test/test-image.png'), 'test-image.png')
                // .field('delimiter', ';')            
                .end((err, res) => {

                    if (err) { console.error("err: ", err); }
                    if (log) { console.log("res.body", res.body); }

                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('Image uploded successfully');
                    expect(res.body.filename).to.not.equal(null);
                    expect(res.body.thumbnail).to.not.equal(null);

                    done();
                });
        });
    });

});


