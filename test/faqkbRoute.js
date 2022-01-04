//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var Faq = require('../models/faq');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
var faqService = require('../services/faqService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

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
                        .send({"name":"testbot", type: "external", language: 'fr'})
                        .end((err, res) => {
                            //console.log("res",  res);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.name).to.equal("testbot");         
                            expect(res.body.language).to.equal("fr");                                                                              
                        
                            done();
                        });

                        
                });
                });
                
    }).timeout(20000);







    // mocha test/faqkbRoute.js  --grep 'train'
    it('train', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test-faqkb-train", savedUser._id).then(function(savedProject) {  
                    faqService.create("testbot", "http://54.228.177.1644", savedProject._id, savedUser._id).then(function(savedBot) {  

                        var newFaq = new Faq({
                          id_faq_kb: savedBot._id,
                          question: "question1\nquestion2",
                          answer: "answer",
                          id_project: savedProject._id,
                          topic: "default",
                          createdBy: savedUser._id,
                          updatedBy: savedUser._id
                        });
                      
                        newFaq.save(function (err, savedFaq) {
                          console.log("err", err);
                          console.log("savedFaq", savedFaq);
                          expect(savedBot.name).to.equal("testbot");
                          expect(savedBot.secret).to.not.equal(null);

                        chai.request(server)
                            .post('/'+ savedProject._id + '/faq_kb/train')
                            .auth(email, pwd)
                            .send({"id_faq_kb":savedBot._id})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.train.nlu.intent).to.equal(savedBot.intent_display_name);         
                                // expect(res.body.text).to.equal("addestramento avviato");         
                                                                                      
                            
                                done();
                            });
    
                            
                    });
                    });
                }); 
            });
        }).timeout(20000);
    
    



});

});


