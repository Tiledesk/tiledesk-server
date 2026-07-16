const Chatbot = require("../models/faq_kb");

class ChatbotController {

  constructor() { }

  canAccess(chatbot, id_project) {
    const isPublic = chatbot.public === true;
    const isOwner = chatbot.id_project === id_project;
    if (!isPublic && !isOwner) {
      return false
    }
    return true;
  }

  export(chatbot, intents, intentsOnly, subagents) {

    if (intentsOnly) {
      return JSON.stringify({ intents: intents });
    }

    return JSON.stringify({
      webhook_enabled: chatbot.webhook_enabled,
      webhook_url: chatbot.webhook_url,
      language: chatbot.language,
      name: chatbot.name,
      slug: chatbot.slug,
      type: chatbot.type,
      subtype: chatbot.subtype,
      description: chatbot.description,
      attributes: chatbot.attributes,
      intents: chatbot.intents,
      subagents: subagents
    })
  }

  async findSubagents(chatbot_id, id_project) {
    try {
      const subagents = await Chatbot
            .find({ id_project: id_project, parent_id: chatbot_id })
            .sort({ createdAt: -1 })
            .lean().exec();
      return subagents;
    } catch (err) {
      winston.error("Error finding subagents with id " + chatbot_id);
      throw { status: 500, message: `Error finding subagents with id ${chatbot_id}` };
    }

  }
  
  async getChatbot(chatbot_id, id_project) {
    try {
      const chatbot = await Chatbot.findOne({ _id: chatbot_id, id_project: id_project  });
      if (!chatbot) {
        throw new Error({ status: 404, message: `Chatbot not found with id ${chatbot_id} for project ${id_project}` });
      }
      return chatbot;
    } catch (err) {
      winston.error("Error finding chatbot with id " + chatbot_id);
      throw { status: 500, message: `Error finding chatbot with id ${chatbot_id}` };
    }
  }

  async getChatbotById(chatbot_id) {
    try {
      const chatbot = await Chatbot.findById(chatbot_id );
      if (!chatbot) {
        throw new Error({ status: 404, message: `Chatbot not found with id ${chatbot_id}` });
      }
      return chatbot;
    } catch (err) {
      winston.error("Error finding chatbot with id " + chatbot_id);
      throw { status: 500, message: `Error finding chatbot with id ${chatbot_id}` };
    }
  }

  

  

  



}

const chatbotController = new ChatbotController();
module.exports = chatbotController;