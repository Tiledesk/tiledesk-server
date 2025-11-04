const axios = require("axios").default;
const winston = require('../config/winston');
let Faq_kb = require("../models/faq_kb");

class ChatbotService {

  constructor() {}

  async fork(id_faq_kb, api_url, token, project_id) {
    winston.debug("(ChatbotService) fork");

    return await axios({
      url: api_url + '/' + project_id + '/faq_kb/fork/'+id_faq_kb+"?projectid="+project_id+"&public=false&globals=true",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      // data: chatbot,
      method: 'POST'
    }).then((resbody) => {
      winston.debug("(ChatbotService) fork resbody: ", resbody.data);
      return resbody.data;
    }).catch((err) => {
      winston.error("(ChatbotService) fork error " + err);
      throw err;
    })

  }

  async getBotById(id_faq_kb, published, api_url, chatbot_templates_api_url, token, project_id, globals) {

    winston.debug("(ChatbotService) getBotById");

    // private bot
    if (published == "false") {

      return await axios({
        url: api_url + "/" + project_id + "/faq_kb/exportjson/" + id_faq_kb + "?globals=" + globals,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        method: 'GET'
      }).then((resbody) => {
        winston.debug("(ChatbotService) forking private chatbot " + resbody.data.name)
        let chatbot = resbody.data;
        return chatbot;
      }).catch((err) => {
        winston.error('(ChatbotService) FAQ_KB EXPORTJSON ERROR ' + err);
        throw err;
      })

    // public bot
    } else {

      return await axios({
        url: chatbot_templates_api_url + "/" + id_faq_kb,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }).then((resbody) => {
        winston.debug("(ChatbotService) forking public chatbot " + resbody.data.name);
        let chatbot = resbody.data;
        return chatbot
      }).catch((err) => {
        winston.error('(ChatbotService) FAQ_KB CHATBOT TEMPLATES ERROR ' + err);
        throw err;
      })
    }

  }

  async createBot(api_url, token, chatbot, project_id) {

    winston.debug("(ChatbotService) createBot");

    return await axios({
      url: api_url + '/' + project_id + '/faq_kb/',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: chatbot,
      method: 'POST'
    }).then((resbody) => {
      winston.debug("(ChatbotService) createBot resbody: ", resbody.data);
      return resbody.data;
    }).catch((err) => {
      winston.error("(ChatbotService) CREATE NEW CHATBOT ERROR " + err);
      throw err;
    })

  }

  async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
  
    winston.debug("(ChatbotService) importFaqs");

    return await axios({
      url: api_url + '/' + project_id + '/faq_kb/importjson/' + id_faq_kb + "?intentsOnly=true",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: chatbot,
      method: 'POST'
    }).then((resbody) => {
      winston.debug("(ChatbotService) importFaqs resbody: ", resbody.data);
      return resbody.data;
    }).catch((err) => {
      winston.error("(ChatbotService) IMPORT FAQS ERROR " + err);
      throw err;
    })
  }

  async setModified(chatbot_id, modified) {
    return Faq_kb.findByIdAndUpdate(chatbot_id, { modified: modified }).then((faqKb) => {
        winston.debug("(ChatbotService) set chatbot to modified response: ", faqKb);
        return true;
      }).catch((err) => {
        return Promise.reject(err);
      });
  }
}

module.exports = { ChatbotService }