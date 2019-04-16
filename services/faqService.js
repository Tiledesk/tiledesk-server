var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var request = require('request');
var winston = require('../config/winston');
const botEvent = require('../event/botEvent');

// var mongoose = require('mongoose');

class FaqService {


  create(name, url, projectid, user_id, external) {
    var that = this;
    return new Promise(function (resolve, reject) {

        //winston.debug('FAQ-KB POST REQUEST BODY ', req.body);
        var newFaq_kb = new Faq_kb({
          name: name,
          url: url,
          id_project: projectid,
          //kbkey_remote: req.body.kbkey_remote,
          external: external,
          trashed: false,
          createdBy: user_id,
          updatedBy: user_id
        });
      
        newFaq_kb.save(function (err, savedFaq_kb) {
          if (err) {
            winston.error('--- > ERROR ', err)
            return reject('Error saving object.' );
          }
          winston.info('-> -> SAVED FAQFAQ KB ', savedFaq_kb.toObject())              
      
          botEvent.emit('faqbot.create', savedFaq_kb);


          // if (savedFaq_kb.external===false) {
          //   createFaqKbRemote(savedFaq_kb._id, savedFaq_kb);
          // } else {
          //   winston.debug('external bot');
          // }

          return resolve(savedFaq_kb);
        });  
    });
  }

  createGreetingsAndOperationalsFaqs(faq_kb_id, created_by, projectid, remote_faqkb_key) {
    var that = this;
    return new Promise(function (resolve, reject) {

      // { 'question': 'Operator', 'answer': '\\agent', 'topic': 'operational' },
      // { 'question': 'Agent', 'answer': '\\agent', 'topic': 'operational' },
      // { 'question': 'Human', 'answer': '\\agent', 'topic': 'operational' },
      // { 'question': 'Operatore', 'answer': '\\agent', 'topic': 'operational' },
      // { 'question': 'Agente', 'answer': '\\agent', 'topic': 'operational' },
      // { 'question': 'Umano', 'answer': '\\agent', 'topic': 'operational' }

      var faqsArray = [
        { 'question': 'Ciao', 'answer': 'Ciao', 'topic': 'greetings' },
        { 'question': 'Hi', 'answer': 'Hi', 'topic': 'greetings' },
        { 'question': 'Hello', 'answer': 'Hello', 'topic': 'greetings' }
      ]

      faqsArray.forEach(faq => {

        var newFaq = new Faq({
          id_faq_kb: faq_kb_id,
          question: faq.question,
          answer: faq.answer,
          id_project: projectid,
          topic: faq.topic,
          createdBy: created_by,
          updatedBy: created_by
        });

        newFaq.save(function (err, savedFaq) {
          if (err) {
            winston.error('--- > ERROR ', err)
            return reject({ success: false, msg: 'Error saving object.', err: err });
          }
          winston.debug('FAQ SERVICE (save new faq) - ID OF THE NEW GREETINGS FAQ CREATED ', savedFaq._id)
          winston.debug('FAQ SERVICE (save new faq) - QUESTION OF THE NEW GREETINGS FAQ CREATED ', savedFaq.question)
          winston.debug('FAQ SERVICE (save new faq) - ANSWER OF THE NEW GREETINGS FAQ CREATED ', savedFaq.answer)
          winston.debug('FAQ SERVICE (save new faq) - ID FAQKB GET IN THE OBJECT OF NEW FAQ CREATED ', savedFaq.id_faq_kb)
          // res.json({ 'Greetings Faqs': savedFaq });
          // return resolve(savedFaq);

          that.createRemoteFaq(remote_faqkb_key, savedFaq);

        })
      });
    });
  }

  createRemoteFaq(faqkb_remotekey, savedFaq) {

    winston.debug('FAQ SERVICE (create remote faq) - REMOTE KEY of the FAQKB PASSED BY faq_kb routes ', faqkb_remotekey)
    winston.debug('FAQ SERVICE (create remote faq) - ID OF THE NEW FAQ CREATED ', savedFaq._id)
    winston.debug('FAQ SERVICE (create remote faq) - QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
    winston.debug('FAQ SERVICE (create remote faq) - ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)

    var json = {
      "id": savedFaq._id,
      "conversation": "id:1006",
      "index_in_conversation": 3,
      "question": savedFaq.question,
      "answer": savedFaq.answer,
      "question_scored_terms": [
      ],
      "verified": true,
      "topics": "t1 t2",
      "doctype": "normal",
      "state": "",
      "status": 0
    };


    var options = {
      url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faqkb_remotekey + '/knowledgebase',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='
      },
      json: json
    };

    request(options, function (err, res, body) {
      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
        winston.debug('FAQ REMOTE POST BODY ', body);


      }
      if (err) {
        winston.debug('FAQ REMOTE POST ERROR ', err);
      }
    });
  }

  // getFaqKbKeyById(faqKb_id, callback) {
  //   winston.debug('FAQ SERVICE - FAQ-KB ID ', faqKb_id)
  //   Faq_kb.findById(faqKb_id, function (err, faq_kb) {
  //     if (err) {
  //       winston.debug('FAQ SERVICE - FAQKB GET BY ID ERROR ', err)
  //       callback(null)
  //       return
  //       // res.status(500).send({ success: false, msg: 'Error getting object.' });
  //     }
  //     if (!faq_kb) {
  //       winston.debug('FAQ SERVICE - FAQKB GET BY ID - OBJECT NOT FOUND')
  //       callback(null)
  //       return
  //       // res.status(404).send({ success: false, msg: 'Object not found.' });
  //     }
  //     winston.debug('FAQ SERVICE - FAQ-KB', faq_kb)
  //     callback(faq_kb.kbkey_remote);

  //     // res.json(faq_kb);

  //     // createRemoteFaq(faq_kb.kbkey_remote, savedFaq)
  //   });
  // }

}

var faqService = new FaqService();
module.exports = faqService;
