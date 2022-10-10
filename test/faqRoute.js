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
                        .send({"name":"testbot", type: "internal"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.public).to.exist;
                            expect(res.body.public).to.equal(false);
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
                                    expect(res.body.intent_display_name).to.not.equal(undefined);                                                                              
                                    expect(res.body.webhook_enabled).to.equal(false);                                                                              
                                    
                                    done();
                                });

                        });

                        
                });
                });
                
    });

    it('create with template example', (done) => {

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
            projectService.create("test-faqkb-create", savedUser._id).then((savedProject) => {

                chai.request(server)
                    .post('/'+ savedProject._id + '/faq_kb')
                    .auth(email, pwd)
                    .send({"name":"testbot", type: "internal", template: "example" })
                    .end((err, res) => {
                        //console.log("res",  res);
                        console.log("res.body",  res.body);
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        expect(res.body.name).to.equal("testbot");                                                                              
                        var id_faq_kb = res.body._id;

                        chai.request(server)
                            .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                            .auth(email, pwd)
                            .end((err, res) => {
                                console.log("faq_list: ", res.body);
                                res.should.have.status(200);
                                res.body.should.be.an('array').that.is.not.empty;

                                done();

                            })

                        

                    });
            })
        })
    })


    it('create with template empty', (done) => {

        
        //   this.timeout();

        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                    chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "tilebot"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body (faqkb)",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");
                            expect(res.body.type).to.equal("tilebot");
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .get('/' + savedProject._id + '/faq?id_faq_kb=' + id_faq_kb)
                                .auth(email, pwd)
                                .end((err, res) => {
                                    console.log("faq_list: ", res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.an('array').that.is.empty;

                                    var reply_example = {
                                        type: "text",
                                        text: "Hello with buttons",
                                        attributes: {
                                            attachment: {
                                                type:"template",
                                                buttons: [
                                                    {
                                                        type: "text",
                                                        value: "REPLY ONE"
                                                    },
                                                    {
                                                        type: "text",
                                                        value: "REPLY TWO"
                                                    }
                                                ]
                                            }
                                        }
                                    }

                                    chai.request(server)
                                        .post('/'+ savedProject._id + '/faq')
                                        .auth(email, pwd)
                                        .send({id_faq_kb: id_faq_kb, question: "question1", reply: reply_example })
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body (faq reply)",  res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            res.body.reply.should.be.a('object');
                                            expect(res.body.id_faq_kb).to.equal(id_faq_kb);
                                            expect(res.body.question).to.equal("question1");
                                            expect(res.body.reply.type).to.equal(reply_example.type);
                                            expect(res.body.reply.text).to.equal(reply_example.text);
                                            expect(res.body.intent_display_name).to.not.equal(undefined);
                                            expect(res.body.webhook_enabled).to.equal(false);
                                            
                                            done();
                                        });

                                })
                        });
                });
            });
    });





    it('createWithLanguage', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                        chai.request(server)
                            .post('/'+ savedProject._id + '/faq_kb')
                            .auth(email, pwd)
                            .send({"name":"testbot", type: "internal", template: "example", language: "it"})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.name).to.equal("testbot");    
                                expect(res.body.language).to.equal("it");                                                                              
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
                                        expect(res.body.intent_display_name).to.not.equal(undefined);                                                                              
                                        expect(res.body.webhook_enabled).to.equal(false);                                                                              
                                        expect(res.body.language).to.equal("it");                                                                              
                                        done();
                                    });
    
                            });
    
                            
                    });
                    });
                    
        });
    
    




    it('createWithIntentDisplayNameAndWebhookEnalbed', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                      
                    chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "internal", template: "example",})
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
                                .send({id_faq_kb: id_faq_kb, question: "question1", answer: "answer1", webhook_enabled:true, intent_display_name: "intent_display_name1"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.id_faq_kb).to.equal(id_faq_kb);                                                                              
                                    expect(res.body.question).to.equal("question1");                                                                              
                                    expect(res.body.answer).to.equal("answer1");                                                                              
                                    expect(res.body.intent_display_name).to.equal("intent_display_name1");                                                                              
                                    expect(res.body.webhook_enabled).to.equal(true);                                                                              

                                    done();
                                });

                        });
    
                            
                    });
                    });
                    
        });
    
        



        it('update', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test-faqkb-create", savedUser._id).then(function(savedProject) {                                              
                            chai.request(server)
                                .post('/'+ savedProject._id + '/faq_kb')
                                .auth(email, pwd)
                                .send({"name":"testbot", type: "internal"})
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
                                            expect(res.body.intent_display_name).to.not.equal(undefined);                                                                              
                                            expect(res.body.webhook_enabled).to.equal(false);                                                                              
                                            
                                            chai.request(server)
                                            .put('/'+ savedProject._id + '/faq/'+res.body._id)
                                            .auth(email, pwd)
                                            .send({id_faq_kb: id_faq_kb, question: "question2", answer: "answer2", webhook_enabled:true})
                                            .end((err, res) => {
                                                //console.log("res",  res);
                                                console.log("res.body",  res.body);
                                                res.should.have.status(200);
                                                res.body.should.be.a('object');
                                                expect(res.body.id_faq_kb).to.equal(id_faq_kb);                                                                              
                                                expect(res.body.question).to.equal("question2");                                                                              
                                                expect(res.body.answer).to.equal("answer2");                                                                              
                                                expect(res.body.intent_display_name).to.not.equal(undefined);                                                                              
                                                expect(res.body.webhook_enabled).to.equal(true);                                                                              
                                                
                                                done();
                                            });

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
                        .send({"name":"testbot", type: "internal"})
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
                                .attach('uploadFile',  fs.readFileSync('./example-faqs.csv'), 'example-faqs.csv') 
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
        





    
        it('uploadcsvWithLanguage', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test-uploadcsv", savedUser._id).then(function(savedProject) {            
                        
                        chai.request(server)
                        .post('/'+ savedProject._id + '/faq_kb')
                        .auth(email, pwd)
                        .send({"name":"testbot", type: "internal", language: "it"})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");                   
                            expect(res.body.language).to.equal("it");                                                                      
                            var id_faq_kb = res.body._id;

                            chai.request(server)
                                .post('/'+ savedProject._id + '/faq/uploadcsv')
                                .auth(email, pwd)
                                .set('Content-Type', 'text/csv')
                                .attach('uploadFile',  fs.readFileSync('./example-faqs.csv'), 'example-faqs.csv') 
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


