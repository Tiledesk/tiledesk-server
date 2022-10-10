//During the test the env variable is set to test
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(require('chai-string'));
let server = require('../app');
let should = chai.should();
var fs = require('fs');
var userService = require('../services/userService');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('ImagesRoute', () => {

  describe('/upload', () => {
 
   

    it('upload-user', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 
            chai.request(server)
            .post('/images/users/')
            .auth(email, pwd)
            .set('Content-Type','image/jpeg')
            .attach('file',  fs.readFileSync('./test/test-image.png'), 'test-image.png')             
            // .field('delimiter', ';')            
            .end((err, res) => {                        
                    //console.log("res",  res);
                    console.log("res.body",  res.body);
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                    expect(res.body.filename).to.not.equal(null);         
                    expect(res.body.filename).to.containIgnoreSpaces('test-image.png');                                                                     
                    expect(res.body.filename).to.containIgnoreSpaces('users','images');                                                                     
                    expect(res.body.thumbnail).to.not.equal(null);                                                                              
                    done();
            });              
                
        });
    });


// mocha test/imageRoute.js  --grep 'upload-user-folder'
    it('upload-user-folder', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 
            chai.request(server)
            .put('/images/users')
            .auth(email, pwd)
            .set('Content-Type','image/jpeg')
            .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
            // .field('folder', 'myfolder')            
            .end((err, res) => {                        
                    //console.log("res",  res);
                    console.log("res.body",  res.body);
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                    expect(res.body.filename).to.not.equal(null);            
                    expect(res.body.filename).to.containIgnoreSpaces('profile.png');                                                                     
                    expect(res.body.filename).to.containIgnoreSpaces('users','images');       
                    // assert(res.body.filename.indexOf()).to.have.string('');                             
                    // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                    expect(res.body.thumbnail).to.not.equal(null);  
                    


                    //check duplicate
                    chai.request(server)
                    .put('/images/users')
                    .auth(email, pwd)
                    .set('Content-Type','image/jpeg')
                    .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
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

     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             
        chai.request(server)
        .put('/images/users/photo')
        .auth(email, pwd)
        .set('Content-Type','image/jpeg')
        .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
        // .field('folder', 'myfolder')            
        .end((err, res) => {                        
                //console.log("res",  res);
                console.log("res.body",  res.body);
                console.log("res.status",  res.status);
                res.should.have.status(201);
                res.body.should.be.a('object');
                expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                // expect(res.body.filename).to.not.equal("photo.jpg");  
                expect(res.body.filename).to.containIgnoreSpaces('photo.jpg');                                                                     
                expect(res.body.filename).to.containIgnoreSpaces('users','images');                 
                // assert(res.body.filename.indexOf()).to.have.string('');                             
                // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                expect(res.body.thumbnail).to.not.equal(null);  
                


                //check duplicate
                chai.request(server)
                .put('/images/users/photo')
                .auth(email, pwd)
                .set('Content-Type','image/jpeg')
                .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
                // .field('folder', 'myfolder')            
                .end((err, res) => {   
                    res.should.have.status(409);
                    done();
                });
        });              
            
    });
}).timeout(1000);




// mocha test/imageRoute.js  --grep 'upload-avatar-force'
it('upload-avatar-force', (done) => {

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             
        chai.request(server)
        .put('/images/users/photo?force=true')
        .auth(email, pwd)
        .set('Content-Type','image/jpeg')
        .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
        // .field('folder', 'myfolder')            
        .end((err, res) => {                        
                //console.log("res",  res);
                console.log("res.body",  res.body);
                console.log("res.status",  res.status);
                res.should.have.status(201);
                res.body.should.be.a('object');
                expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                // expect(res.body.filename).to.not.equal("photo.jpg");  
                expect(res.body.filename).to.containIgnoreSpaces('photo.jpg');                                                                     
                expect(res.body.filename).to.containIgnoreSpaces('users','images');                 
                // assert(res.body.filename.indexOf()).to.have.string('');                             
                // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                expect(res.body.thumbnail).to.not.equal(null);  
                


                //check duplicate
                chai.request(server)
                .put('/images/users/photo?force=true')
                .auth(email, pwd)
                .set('Content-Type','image/jpeg')
                .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
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

     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
        var bot = "bot_"+ Date.now();
        chai.request(server)
        .put('/images/users/photo?user_id='+bot)
        .auth(email, pwd)
        .set('Content-Type','image/jpeg')
        .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
        // .field('folder', 'myfolder')            
        .end((err, res) => {                        
                //console.log("res",  res);
                console.log("res.body",  res.body);
                console.log("res.status",  res.status);
                res.should.have.status(201);
                res.body.should.be.a('object');
                expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                expect(res.body.filename).to.not.equal("photo.jpg");                 
                // assert(res.body.filename.indexOf()).to.have.string('');                             
                // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                expect(res.body.thumbnail).to.not.equal(null);  
                // expect(res.body.filename).to.include.keys(bot);
                expect(res.body.filename).to.containIgnoreSpaces(bot);



                //check duplicate
                chai.request(server)
                .put('/images/users/photo?user_id='+bot)
                .auth(email, pwd)
                .set('Content-Type','image/jpeg')
                .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
                // .field('folder', 'myfolder')            
                .end((err, res) => {   
                    res.should.have.status(409);
                    done();
                });
        });              
            
    });
});




// mocha test/imageRoute.js  --grep 'delete-user-folder'
it('delete-user-folder', (done) => {

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             
        chai.request(server)
        .put('/images/users')
        .auth(email, pwd)
        .set('Content-Type','image/jpeg')
        .attach('file',  fs.readFileSync('./test/test-image.png'), 'profile.png')             
        // .field('folder', 'myfolder')            
        .end((err, res) => {                        
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(201);
                res.body.should.be.a('object');
                expect(res.body.message).to.equal('Image uploded successfully');                                                                              
                expect(res.body.filename).to.not.equal(null);                 
                // assert(res.body.filename.indexOf()).to.have.string('');                             
                // assert.equal(res.body.filename.indexOf('myfilder'), 1);                                           
                expect(res.body.thumbnail).to.not.equal(null);  
                

                chai.request(server)
                .delete('/images/users?path='+res.body.filename)
                .auth(email, pwd)               
                .end((err, res) => {   
                    console.log("res.body",  res.body);
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
            .set('Content-Type','image/jpeg')
            .attach('file',  fs.readFileSync('./test/test-image.png'), 'test-image.png')             
            // .field('delimiter', ';')            
            .end((err, res) => {                        
                    //console.log("res",  res);
                    console.log("res.body",  res.body);
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


