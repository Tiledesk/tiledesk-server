//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'critical';

let expect = require('chai').expect;

let assert = require('chai').assert;
let config = require('../config/database');
let mongoose = require('mongoose');

mongoose.connect(config.databasetest);

let leadService = require('../services/leadService');
let projectService = require("../services/projectService");
let userService = require('../services/userService');
let faqService = require('../services/faqService');
let Faq = require('../models/faq');
let winston = require('../config/winston');

let log = false;


describe('FaqService()', function () {

  it('createee-and-search', (done) => {

    let email = "test-subscription-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("test-FaqService", savedUser._id).then(function (savedProject) {
        faqService.create(savedProject._id, savedUser._id, { name: "testbot" }).then(function (savedBot) {

          let newFaq = new Faq({
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

            let query = { "id_faq_kb": savedBot._id };

            // aggiunta qui 
            query.$text = { "$search": "question" };

            return Faq.find(query, { score: { $meta: "textScore" } })
              .sort({ score: { $meta: "textScore" } }) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
              .lean()
              .exec(function (err, faqs) {
                if (log) { console.log("faqs", faqs); }
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

    let email = "test-subscription-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("test-FaqService", savedUser._id).then(function (savedProject) {
        faqService.create(savedProject._id, savedUser._id, { name: "testbot" }).then(function (savedBot) {

          let newFaq = new Faq({
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

            let query = { "id_faq_kb": savedBot._id };

            // aggiunta qui 
            query.$text = { "$search": "question" };

            return Faq.find(query, { score: { $meta: "textScore" } })
              .sort({ score: { $meta: "textScore" } }) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
              .lean().
              exec(function (err, faqs) {
                if (err) { console.error("err: ", err )}
                if (log) { console.log("faqs", faqs); }
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

    let email = "test-subscription-" + Date.now() + "@email.com";
    let pwd = "pwd";

    userService.signup(email, pwd, "Test Firstname", "Test lastname").then(function (savedUser) {
      projectService.create("test-FaqService", savedUser._id).then(function (savedProject) {
        faqService.create(savedProject._id, savedUser._id, { name: "testbot" }).then(function (savedBot) {

          let newFaq0 = new Faq({
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

            let newFaq = new Faq({
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

              if (log) { console.log("err.code ", err.code); }
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


