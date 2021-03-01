//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('FaqKBRoute', () => {

  describe('/create', () => {
 
   

    it('create', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                    chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "external"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");                                                                              
                            var id_faq_kb = res.body._id;

                             chai.request(server)
                                .post('/'+ savedProject._id + '/faq')
                                .auth(email, pwd)
                                .send({id_faq_kb: id_faq_kb, question: "question1", answer: "answer1"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.id_faq_kb).to.equal(id_faq_kb);                                                                              
                                    expect(res.body.question).to.equal("question1");                                                                              
                                    expect(res.body.answer).to.equal("answer1");                                                                              
                                    expect(res.body.intent_display_name).to.equal(undefined);                                                                              
                                    expect(res.body.webhook_enabled).to.equal(false);                                                                              
                                    
                                    done();
                                });

                        });

                        
                });
                });
                
    });





    it('createWithIntentDisplayName', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                      
                    chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "external"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");                                                                              
                            var id_faq_kb = res.body._id;

                             chai.request(server)
                                .post('/'+ savedProject._id + '/faq')
                                .auth(email, pwd)
                                .send({id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", intent_display_name: "intent_display_name1"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.id_faq_kb).to.equal(id_faq_kb);                                                                              
                                    expect(res.body.question).to.equal("question1");                                                                              
                                    expect(res.body.answer).to.equal("answer1");                                                                              
                                    expect(res.body.intent_display_name).to.equal("intent_display_name1");                                                                              
                                    expect(res.body.webhook_enabled).to.equal(false);                                                                              

                                    done();
                                });

                        });
    
                            
                    });
                    });
                    
        });
    
    
    
        it('uploadcsv', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test-uploadcsv", savedUser._id).then(function(savedProject) {            
                        
                        chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "external"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");                                                                              
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/'+ savedProject._id + '/faq/uploadcsv')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/csv')
                                .attach('uploadFile',  fs.readFileSync('./test/example-faqs.csv'), 'example-faqs.csv') 
                                .field('id_faq_kb', id_faq_kb)
                                .field('delimiter', ';')
                                // .send({id_faq_kb: id_faq_kb})       
                                .end((err, res) => {
                                    console.log("err",  err);
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

});


