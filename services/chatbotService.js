const axios = require("axios").default;
const winston = require('../config/winston');
var Faq_kb = require("../models/faq_kb");

class ChatbotService {

  constructor() {
    
  }


  async getBotById(id_faq_kb, published, api_url, chatbot_templates_api_url, token, project_id) {

    winston.info("[CHATBOT SERVICE] getBotById");

    // private bot
    if (published == "false") {

      return await axios({
        url: api_url + "/" + project_id + "/faq_kb/exportjson/" + id_faq_kb,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        method: 'GET'
      }).then((resbody) => {
        winston.info("(CHATBOT SERVICE) forking private chatbot " + resbody.data.name)
        let chatbot = resbody.data;
        return chatbot;
      }).catch((err) => {
        winston.error('(CHATBOT SERVICE) FAQ_KB EXPORTJSON ERROR ' + err);
        return err;
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
        winston.info("(CHATBOT SERVICE) forking public chatbot " + resbody.data);
        let chatbot = resbody.data;
        return chatbot
      }).catch((err) => {
        winston.error('(CHATBOT SERVICE) FAQ_KB CHATBOT TEMPLATES ERROR ' + err);
        return err;
      })
    }

  }

  async createBot(api_url, token, chatbot, project_id) {

    winston.info("[CHATBOT SERVICE] createBot");

    return await axios({
      url: api_url + '/' + project_id + '/faq_kb/',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: chatbot,
      method: 'POST'
    }).then((resbody) => {
      winston.debug("(CHATBOT SERVICE) createBot resbody: ", resbody.data);
      return resbody.data;
    }).catch((err) => {
      winston.error("(CHATBOT SERVICE) CREATE NEW CHATBOT ERROR " + err);
      return err;
    })

  }

  async importFaqs(api_url, id_faq_kb, token, chatbot, project_id) {
  
    winston.info("[CHATBOT SERVICE] importFaqs");

    return await axios({
      url: api_url + '/' + project_id + '/faq_kb/importjson/' + id_faq_kb + "?intentsOnly=true",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: chatbot,
      method: 'POST'
    }).then((resbody) => {
      winston.debug("(CHATBOT SERVICE) importFaqs resbody: ", resbody.data);
      return resbody.data;
    }).catch((err) => {
      winston.error("(CHATBOT SERVICE) IMPORT FAQS ERROR " + err);
      return err;
    })
  }

}

module.exports = { ChatbotService }