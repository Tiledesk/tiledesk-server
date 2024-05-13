var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var winston = require('../config/winston');
const botEvent = require('../event/botEvent');
const ActionsConstants = require('../models/actionsConstants');
const uuidv4 = require('uuid/v4');


class FaqService {


  create(name, url, projectid, user_id, type, description, webhook_url, webhook_enabled, language, template, mainCategory, intentsEngine, attributes) {
    var that = this;
    return new Promise(function (resolve, reject) {

      //winston.debug('FAQ-KB POST REQUEST BODY ', req.body);
      var newFaq_kb = new Faq_kb({
        name: name,
        description: description,
        url: url,
        id_project: projectid,
        webhook_url: webhook_url,
        webhook_enabled: webhook_enabled,
        type: type,
        language: language,
        public: false,
        certified: false,
        mainCategory: mainCategory,
        intentsEngine: intentsEngine,
        trashed: false,
        createdBy: user_id,
        updatedBy: user_id,
        attributes: attributes
      });


      newFaq_kb.save(function (err, savedFaq_kb) {
        if (err) {
          winston.error('--- > ERROR ', err)
          return reject('Error saving object.');
        }
        winston.debug('-> -> SAVED FAQFAQ KB ', savedFaq_kb.toObject())

        botEvent.emit('faqbot.create', savedFaq_kb);

        winston.debug('type ' + type)

        if (type === "internal" || type === "tilebot") {

          if (!template) {
            template = "empty";
          }
          winston.debug('template ' + template);
          that.createGreetingsAndOperationalsFaqs(savedFaq_kb._id, savedFaq_kb.createdBy, savedFaq_kb.id_project, template);
        } else {
          winston.debug('external bot: ', savedFaq_kb);
        }



        return resolve(savedFaq_kb);
      });
    });
  }

  createGreetingsAndOperationalsFaqs(faq_kb_id, created_by, projectid, template) {
    var that = this;
    return new Promise(function (resolve, reject) {

      // aggiungi esempio tdAction con intent_id

      // TODO non scatta i trigger sui rest hook. fare?
      winston.debug('template: ' + template);

      var faqsArray;

      if (template === "example") {

        faqsArray = [
          { 'question': 'Hi', 'answer': 'Hi', 'topic': 'greetings' },
          { 'question': 'Hello', 'answer': 'Hello', 'topic': 'greetings' },
          { 'question': 'Who are you?', 'answer': 'Hi, I\'m a bot 🤖. You can find more about me [here](https://tiledesk.com/chatbot-for-customer-service).\ntdImage:https://console.tiledesk.com/assets/images/tily-welcomebot.gif\n* See the website https://tiledesk.com/\n* Back to start tdAction:start', 'topic': 'greetings' },
          { 'question': '👨🏻‍🦰 I want an agent', 'answer': 'We are looking for an operator.. ' + ActionsConstants.CHAT_ACTION_MESSAGE.AGENT, 'intent_display_name': 'agent_handoff', 'topic': 'internal' },
          { 'question': 'Close\nResolved', 'answer': ActionsConstants.CHAT_ACTION_MESSAGE.CLOSE, 'topic': 'internal' },
          { 'question': '\\start', 'answer': 'Hello 👋. I\'m a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.\n* Who are you?\n* Where are you?\n* What can you do?\n* 👨🏻‍🦰 I want an agent', 'intent_display_name': 'start', 'topic': 'internal' },
          { 'question': 'defaultFallback', 'answer': 'I can not provide an adequate answer. Write a new question or talk to a human agent.\n* Back to start tdAction:start\n* See the docs https://docs.tiledesk.com/\n* 👨🏻‍🦰 I want an agent', 'intent_display_name': 'defaultFallback', 'topic': 'internal' }, //TODO se metto spazio n * nn va      
          { 'question': 'What can you do?', 'answer': 'Using natural language processing, I\'m able to find the best answer for your users. I also support images, videos etc.. Let\'s try:\n* Sample Image\n* Sample Video\n* Sample Action tdAction:action1\n* Sample Frame\n* Back to start tdAction:start', 'topic': 'sample' },
          { 'question': 'Sample Image', 'answer': 'tdImage:https://tiledesk.com/wp-content/uploads/2022/07/tiledesk_v2.png\n* What can you do?\n* Back to start tdAction:start', 'topic': 'sample' },
          { 'question': 'Sample Frame', 'answer': 'tdFrame:https://www.emanueleferonato.com/wp-content/uploads/2019/02/runner/\n* What can you do?\n* Back to start tdAction:start', 'topic': 'sample' },
          { 'question': 'Sample Video', 'answer': 'tdVideo:https://www.youtube.com/embed/EngW7tLk6R8\n* What can you do?\n* Back to start tdAction:start', 'topic': 'sample' },
          { 'question': 'Where are you?', 'answer': 'We are here ❤️\ntdFrame:https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6087916.923447935!2d8.234804542117423!3d41.836572992140624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12d4fe82448dd203%3A0xe22cf55c24635e6f!2sItaly!5e0!3m2!1sen!2sit!4v1613657475377!5m2!1sen!2sit\n* Back to start tdAction:start', 'topic': 'sample' },

          // { 'question': 'Sample Webhook', 'answer': 'tdWebhook:https://tiledesk-bot-webhook.tiledesk.repl.co', 'topic': 'sample' },    
          { 'question': 'Sample Action', 'answer': 'Hello 👋 Would you like to take a closer look at our offer?\n* Yes, please tdAction:yes_action\n* No tdAction:no_action', 'intent_display_name': 'action1', 'topic': 'sample' },
          { 'question': 'Yes Action', 'answer': 'Great! Take a look here:\n* Tiledesk Pricing https://tiledesk.com/pricing-cloud/', 'intent_display_name': 'yes_action', 'topic': 'sample' },
          { 'question': 'No Action', 'answer': 'All right! If you need anything, let us know.', 'intent_display_name': 'no_action', 'topic': 'sample' },


          // action button nn si può fare perche gli id cambiano 
        ]

      }

      if (template === "blank") {

        let custom_intent_id = uuidv4();
        // faqsArray = [         
        //   { 'question': '\\start', 'answer': 'Hello', 'intent_display_name': 'start', 'topic': 'internal' },            
        //   { 'question': 'defaultFallback', 'answer': 'I can not provide an adequate answer. Write a new question or talk to a human agent.\n* Back to start tdAction:start\n* See the docs https://docs.tiledesk.com/\n* 👨🏻‍🦰 I want an agent', 'intent_display_name': 'defaultFallback', 'topic': 'internal' }, //TODO se metto spazio n * nn va              
        // ]
        faqsArray = [{
          "webhook_enabled": false,
          "enabled": true,
          "actions": [{
            "_tdActionType": "reply",
            "text": "I didn't understand. Can you rephrase your question?",
            "attributes": {
              "commands": [{
                "type": "wait",
                "time": 500
              },{
                "type": "message",
                "message": {
                  "type": "text",
                  "text": "I didn't understand. Can you rephrase your question?"
                }
              }]
            }
          }],
          "intent_display_name": "defaultFallback",
          "attributes": {
            "position": {
              "x": 714,
              "y": 528
            }
          }
        }, {
          "webhook_enabled": false,
          "enabled": true,
          "actions": [{
            "_tdActionType": "intent",
            "intentName": "#" + custom_intent_id
          }],
          "question": "",
          "intent_display_name": "start",
          "attributes": {
            "position": {
              "x": 172,
              "y": 384
            }
          }
        }, {
          "webhook_enabled": false,
          "enabled": true,
          "actions": [{
            "_tdActionType": "reply",
            "attributes": {
              "disableInputMessage": false,
              "commands": [{
                "type": "wait",
                "time": 500
              }, {
                "type": "message",
                "message": {
                  "type": "text",
                  "text": "Hi, how can I help you?"
                }
              }]
            },
            "text": "Hi, how can I help you?\r\n"
          }],
          "intent_display_name": "welcome",
          "intent_id": custom_intent_id,
          "attributes": {
            "position": {
              "x": 714,
              "y": 113
            }
          }
        }]

      }


      if (template === "handoff") {

        faqsArray = [
          { 'question': '', 'answer': 'Hello', 'intent_display_name': 'start', 'topic': 'internal' },
          { 'question': '👨🏻‍🦰 I want an agent', 'answer': 'We are looking for an operator.. ' + ActionsConstants.CHAT_ACTION_MESSAGE.AGENT, 'intent_display_name': 'agent_handoff', 'topic': 'internal' },
          { 'question': 'defaultFallback', 'answer': 'I can not provide an adequate answer. Write a new question or talk to a human agent.\n* Back to start tdAction:start\n* See the docs https://docs.tiledesk.com/\n* 👨🏻‍🦰 I want an agent', 'intent_display_name': 'defaultFallback', 'topic': 'internal' }, //TODO se metto spazio n * nn va              
        ]

      }

      if (template === "empty") {
        faqsArray = [];
      }


      faqsArray.forEach(faq => {

        var newFaq = new Faq({
          id_faq_kb: faq_kb_id,
          intent_id: faq.intent_id,
          question: faq.question,
          answer: faq.answer,
          actions: faq.actions,
          reply: faq.reply,
          intent_display_name: faq.intent_display_name,
          language: "en",
          attributes: faq.attributes,
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

        })
      });
    });
  }

  getAll(faq_kb_id) {

    winston.debug("(Service) GET ALL FAQ OF THE BOT ID (req.query): ", faq_kb_id);

    return new Promise((resolve, reject) => {

      Faq.find({ id_faq_kb: faq_kb_id }, (err, faqs) => {
        if (err) {
          reject(err);
        }
        resolve(faqs);
      }).lean().exec()
    })
  }


}

var faqService = new FaqService();
module.exports = faqService;
