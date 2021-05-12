//During the test the env variable is set to test
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
var userService = require('../services/userService');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FileRoute', () => {

  describe('/post', () => {
 
   

    it('post-user', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                 
            chai.request(server)
            .post('/files/users/')
            .auth(email, pwd)
            .set('Content-Type','application/pdf')
            .attach('file',  fs.readFileSync('./test/sample.pdf'), 'sample.pdf')             
            // .field('delimiter', ';')            
            .end((err, res) => {                        
                    //console.log("res",  res);
                    console.log("res.body",  res.body);
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('File uploded successfully');                                                                              
                    expect(res.body.filename).to.not.equal(null);                                                                              
                    expect(res.body.thumbnail).to.not.equal(null);                                                                              
                    done();
            });              
                
        });
    });



    it('post-public', (done) => {

      
            chai.request(server)
            .post('/files/public/')
            .set('Content-Type','application/pdf')
            .attach('file',  fs.readFileSync('./test/sample.pdf'), 'sample.pdf')                  
            // .field('delimiter', ';')            
            .end((err, res) => {                        
                    //console.log("res",  res);
                    console.log("res.body",  res.body);
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    expect(res.body.message).to.equal('File uploded successfully');                                                                              
                    expect(res.body.filename).to.not.equal(null);                                                                              
                    expect(res.body.thumbnail).to.not.equal(null);                                                                              
                    done();
            });              
                
       
    });



});

});


