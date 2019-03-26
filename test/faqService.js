//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// require('./controllers/todo.controller.test.js');
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
            faqService.create("testbot", null, savedProject._id, savedUser._id, true).then(function(savedBot) {  

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
                winston.debug("resolve", savedFaq.toObject());
                expect(savedBot.name).to.equal("testbot");
                expect(savedFaq.question).to.equal("question");
               
                var query = { "id_project": savedProject._id };

                query.$text = {"$search": "question"};
                 
                return Faq.find(query,  {score: { $meta: "textScore" } })  
                .lean().               
                  exec(function (err, faqs) {
                    console.log("faqs", faqs);
                    expect(faqs.length).to.equal(1);
                    expect(faqs[0]._id.toString()).to.equal(savedFaq._id.toString());
                    expect(faqs[0].score).to.not.equal(null);
                    done();   
                  });

               


                
              });

                 
    });
  });
});
});







});


