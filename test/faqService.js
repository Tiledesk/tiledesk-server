//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');

mongoose.connect(config.databasetest);

var leadService = require('../services/leadService');
var projectService = require("../services/projectService");
var userService = require('../services/userService');
var faqService = require('../services/faqService');
var Faq = require('../models/faq');
var winston = require('../config/winston');


describe('FaqService()', function () {

  it('create-and-search', (done) => {
       
    var email = "test-subscription-" + Date.now() + "@email.com";
    var pwd = "pwd";

   

     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
         projectService.create("test-FaqService", savedUser._id).then(function(savedProject) {    
            faqService.create("testbot", null, savedProject._id, savedUser._id).then(function(savedBot) {  

              var newFaq = new Faq({
                id_faq_kb: savedBot._id,
                question: "question",
                answer: "answer",
                id_project: savedProject._id,
                topic: "default",
                createdBy: savedUser._id,
                updatedBy: savedUser._id
              });
            
              newFaq.save(function (err, savedFaq) {
                winston.debug("err", err);
                winston.debug("resolve", savedFaq);
                expect(savedBot.name).to.equal("testbot");
                expect(savedBot.secret).to.not.equal(null);
                expect(savedFaq.question).to.equal("question");
                expect(savedFaq.intent_id).to.not.equal(undefined);
                expect(savedFaq.intent_display_name).to.not.equal(undefined);
                expect(savedFaq.webhook_enabled).to.equal(false);
               
                var query = { "id_project": savedProject._id };


                // aggiunta qui 
                query.$text = {"$search": "question"};
                 
                return Faq.find(query,  {score: { $meta: "textScore" } }) 
                .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
                .lean().               
                  exec(function (err, faqs) {
                    console.log("faqs", faqs);
                    // expect(faqs.length).to.equal(1);
                    expect(faqs[0]._id.toString()).to.equal(savedFaq._id.toString());
                    expect(faqs[0].answer).to.equal("answer");
                    expect(faqs[0].question).to.equal("question");
                    expect(faqs[0].score).to.not.equal(null);
                    done();   
                  });

               


                
              });

                 
    });
  });
});
});





it('create-with-intent_display_name-and-search', (done) => {
       
  var email = "test-subscription-" + Date.now() + "@email.com";
  var pwd = "pwd";

 

   userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
       projectService.create("test-FaqService", savedUser._id).then(function(savedProject) {    
          faqService.create("testbot", null, savedProject._id, savedUser._id).then(function(savedBot) {  

            var newFaq = new Faq({
              id_faq_kb: savedBot._id,
              question: "question",
              answer: "answer",
              id_project: savedProject._id,
              topic: "default",
              intent_display_name: "question1",
              createdBy: savedUser._id,
              updatedBy: savedUser._id
            });
          
            newFaq.save(function (err, savedFaq) {
              winston.debug("err", err);
              winston.debug("resolve", savedFaq);
              expect(savedBot.name).to.equal("testbot");
              expect(savedBot.secret).to.not.equal(null);
              expect(savedFaq.question).to.equal("question");
              expect(savedFaq.intent_id).to.not.equal(undefined);
              expect(savedFaq.intent_display_name).to.equal("question1");
              expect(savedFaq.webhook_enabled).to.equal(false);

              var query = { "id_project": savedProject._id };


              // aggiunta qui 
              query.$text = {"$search": "question"};
               
              return Faq.find(query,  {score: { $meta: "textScore" } }) 
              .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
              .lean().               
                exec(function (err, faqs) {
                  console.log("faqs", faqs);
                  // expect(faqs.length).to.equal(1);
                  expect(faqs[0]._id.toString()).to.equal(savedFaq._id.toString());
                  expect(faqs[0].answer).to.equal("answer");
                  expect(faqs[0].question).to.equal("question");
                  expect(faqs[0].score).to.not.equal(null);
                  done();   
                });

             


              
            });

               
  });
});
});
});






it('create-with-duplicated-intent_display_name-and-search', (done) => {
       
  var email = "test-subscription-" + Date.now() + "@email.com";
  var pwd = "pwd";

 

   userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
       projectService.create("test-FaqService", savedUser._id).then(function(savedProject) {    
          faqService.create("testbot", null, savedProject._id, savedUser._id).then(function(savedBot) {  

            var newFaq0 = new Faq({
              id_faq_kb: savedBot._id,
              question: "question",
              answer: "answer",
              id_project: savedProject._id,
              topic: "default",
              intent_display_name: "question1",
              createdBy: savedUser._id,
              updatedBy: savedUser._id
            });
          
            newFaq0.save(function (err, savedFaq0) {


              var newFaq = new Faq({
                id_faq_kb: savedBot._id,
                question: "question",
                answer: "answer",
                id_project: savedProject._id,
                topic: "default",
                intent_display_name: "question1",
                createdBy: savedUser._id,
                updatedBy: savedUser._id
              });
            
              newFaq.save(function (err, savedFaq) {

                console.log("err.code ",err.code );
                if (err.code == 11000) {
                  done()
                }
             

              });
              
            });

               
  });
});
});
});







});


