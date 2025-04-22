var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var winston = require('../config/winston');
const botEvent = require('../event/botEvent');
const chatbotTypes = require("../models/chatbotTypes");
const chatbotTemplates = require("../models/chatbotTemplates");
const templates = require('../template/chatbot');

class FaqService {

  create(id_project, id_user, data) {

    return new Promise((resolve, reject) => {

      var newFaq_kb = new Faq_kb({
        name: data.name,
        slug: data.slug,
        description: data.description,
        url: data.url,
        id_project: id_project,
        webhook_url: data.webhook_url,
        webhook_enabled: data.webhook_enabled,
        type: data.type,
        subtype: data.subtype,
        language: data.language,
        public: false,
        certified: false,
        mainCategory: data.mainCategory,
        intentsEngine: data.intentsEngine,
        trashed: false,
        createdBy: id_user,
        updatedBy: id_user,
        attributes: data.attributes
      });

      newFaq_kb.save((err, savedFaq_kb) => {

        if (err) {
          winston.error('(FaqService) error saving new chatbot ', err)
          return reject('Error saving object.');
        }

        winston.debug('(FaqService) saved chatbot ', savedFaq_kb.toObject())
        botEvent.emit('faqbot.create', savedFaq_kb);

        winston.debug('type ' + data.type)

        if (data.type === "internal" || data.type === "tilebot") {

          let template = this.#resolveTemplate(data.subtype, data.template);
          winston.debug('template ' + template);

          let options = {};
          if (data.namespace_id) {
            options.namespace_id = data.namespace_id;
          }

          this.createGreetingsAndOperationalsFaqs(savedFaq_kb._id, savedFaq_kb.createdBy, savedFaq_kb.id_project, template, options);

        } else {
          winston.debug('(FaqService) Chatbot type: external bot');
        }

        return resolve(savedFaq_kb);
      });

    });
  }

  #resolveTemplate(subtype, template) {
    subtype = chatbotTemplates[subtype] ? subtype : 'chatbot';
    const { templates, default: defaultTemplate } = chatbotTemplates[subtype];
    if (template && templates.includes(template)) {
      return template;
    }
    return defaultTemplate;
  }

  createGreetingsAndOperationalsFaqs(faq_kb_id, created_by, projectid, template, options) {
    
    return new Promise( async (resolve, reject) =>  {

      winston.debug('(FaqService) create faqs from template: ' + template);

      let faqsArray = templates[template](options);

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
            winston.error('(FaqService) error saving faq: ', err)
            return reject({ success: false, msg: 'Error saving object.', err: err });
          }

          winston.debug('(FaqService) saved new faq for chatbot ' + savedFaq.id_faq_kb);

        })
      });
    });
  }

  getAll(faq_kb_id) {

    winston.debug("(FaqService) Get all faq for chatbot: ", faq_kb_id);

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
