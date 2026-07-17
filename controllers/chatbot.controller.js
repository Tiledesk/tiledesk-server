const Chatbot = require("../models/faq_kb");
const faqService = require("../services/faqService");
const AppError = require("../utils/AppError");
const intentsController = require("./intents.controller");
const botEvent = require("../event/botEvent");
const winston = require("../config/winston");

const IMPORT_OVERRIDE_FIELDS = [
  "webhook_enabled",
  "webhook_url",
  "language",
  "name",
  "description",
  "type",
  "subtype"
];

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
      intents: intents,
      subagents: subagents
    })
  }

  _rewriteRulesParticipants(attributes, chatbot_id) {
    if (!attributes?.rules?.length) {
      return attributes;
    }
    for (const rule of attributes.rules) {
      if (rule.do?.[0]?.message?.participants?.[0]) {
        rule.do[0].message.participants[0] = "bot_" + chatbot_id;
      }
    }
    return attributes;
  }

  _buildSubagentPayload(subagentJson, parent_id) {
    return {
      name: subagentJson.name,
      description: subagentJson.description,
      type: subagentJson.type || "tilebot",
      subtype: "subagent",
      language: subagentJson.language,
      webhook_url: subagentJson.webhook_url,
      webhook_enabled: subagentJson.webhook_enabled,
      attributes: subagentJson.attributes,
      parent_id: parent_id.toString(),
      template: "empty"
    };
  }

  async findSubagents(chatbot_id, id_project) {
    try {
      const subagents = await Chatbot
            .find({ id_project: id_project, parent_id: chatbot_id })
            .sort({ createdAt: -1 })
            .lean().exec();
      return subagents;
    } catch (err) {
      winston.error("(ChatbotController) findSubagents error: ", err);
      throw new AppError(500, `Error finding subagents with id ${chatbot_id}`);
    }

  }

  async deleteSubagents(parent_id, id_project) {
    const subagents = await this.findSubagents(parent_id, id_project);
    await Promise.all(subagents.map(async (subagent) => {
      await intentsController.deleteByChatbotId(subagent._id);
      await Chatbot.deleteOne({ _id: subagent._id, id_project: id_project });
    }));
  }
  
  async getChatbot(chatbot_id, id_project) {
    let chatbot;
    try {
      chatbot = await Chatbot.findOne({ _id: chatbot_id, id_project: id_project });
    } catch (err) {
      winston.error("(ChatbotController) getChatbot error: ", err);
      throw new AppError(500, `Error finding chatbot with id ${chatbot_id}`);
    }
    if (!chatbot) {
      throw new AppError(404, `Chatbot not found with id ${chatbot_id} for project ${id_project}`);
    }
    return chatbot;
  }

  async getChatbotById(chatbot_id) {
    let chatbot;
    try {
      chatbot = await Chatbot.findById(chatbot_id);
    } catch (err) {
      winston.error("(ChatbotController) getChatbotById error: ", err);
      throw new AppError(500, `Error finding chatbot with id ${chatbot_id}`);
    }
    if (!chatbot) {
      throw new AppError(404, `Chatbot not found with id ${chatbot_id}`);
    }
    return chatbot;
  }

  async _importIntents(chatbot_id, id_project, user_id, intents, overwrite) {
    if (!intents?.length) {
      return;
    }
    if (overwrite) {
      await intentsController.upsertMany(chatbot_id, id_project, user_id, intents);
    } else {
      await intentsController.createMany(
        chatbot_id,
        id_project,
        user_id,
        intents,
        { skipDuplicates: true }
      );
    }
  }

  async _createSubagent(id_project, user_id, payload) {
    let subagent;
    try {
      subagent = await faqService.create(id_project, user_id, payload);
    } catch (err) {
      winston.error("(ChatbotController) create subagent error: ", err);
      throw new AppError(400, "Error creating subagent");
    }

    if (payload.attributes) {
      this._rewriteRulesParticipants(payload.attributes, subagent._id);
      subagent = await this.updatedChatbot(subagent._id, id_project, { attributes: payload.attributes });
    }

    return subagent;
  }

  async _updateSubagent(subagent, payload, id_project) {
    for (const field of IMPORT_OVERRIDE_FIELDS) {
      if (payload[field] !== undefined && payload[field] !== null) {
        subagent[field] = payload[field];
      }
    }

    if (payload.attributes) {
      this._rewriteRulesParticipants(payload.attributes, subagent._id);
      subagent.attributes = payload.attributes;
    }

    try {
      subagent = await Chatbot.findByIdAndUpdate(subagent._id, subagent, { new: true });
    } catch (err) {
      winston.error("(ChatbotController) update subagent error: ", err);
      throw new AppError(400, "Error updating subagent");
    }

    botEvent.emit("faqbot.update", subagent);
    return subagent;
  }

  async _importSubagents(parent, subagentsJson, id_project, user_id, replace, overwrite) {
    if (replace) {
      await this.deleteSubagents(parent._id, id_project);
    }

    if (!subagentsJson?.length) {
      return;
    }

    for (const subagentJson of subagentsJson) {
      const payload = this._buildSubagentPayload(subagentJson, parent._id);
      let subagent = await Chatbot.findOne({
        id_project: id_project,
        parent_id: parent._id.toString(),
        name: subagentJson.name
      });

      if (overwrite) {
        if (subagent) {
          subagent = await this._updateSubagent(subagent, payload, id_project);
        } else {
          subagent = await this._createSubagent(id_project, user_id, payload);
        }
      } else if (!subagent) {
        subagent = await this._createSubagent(id_project, user_id, payload);
      } else {
        winston.debug("Skip existing subagent with name: " + subagentJson.name);
      }

      if (subagent) {
        await this._importIntents(
          subagent._id,
          id_project,
          user_id,
          subagentJson.intents,
          overwrite
        );
      }
    }
  }

  async import(json, id_project, chatbot_id, create, replace, overwrite, user_id) {
    let chatbot;

    if (create) {
      json.template = "empty";
      try {
        chatbot = await faqService.create(id_project, user_id, json);
      } catch (err) {
        winston.error("(ChatbotController) import create error: ", err);
        throw new AppError(400, "Error creating new chatbot");
      }

      if (json.attributes) {
        this._rewriteRulesParticipants(json.attributes, chatbot._id);
        chatbot = await this.updatedChatbot(chatbot._id, id_project, { attributes: json.attributes });
      }
    } else {
      if (!chatbot_id) {
        throw new AppError(400, "With replace or overwrite option a id_faq_kb must be provided");
      }

      chatbot = await this.getChatbot(chatbot_id, id_project);

      for (const field of IMPORT_OVERRIDE_FIELDS) {
        if (json[field]) {
          chatbot[field] = json[field];
        }
      }

      if (json.attributes) {
        this._rewriteRulesParticipants(json.attributes, chatbot._id);
        chatbot.attributes = json.attributes;
      }

      try {
        chatbot = await Chatbot.findByIdAndUpdate(chatbot._id, chatbot, { new: true });
      } catch (err) {
        winston.error("(ChatbotController) import update error: ", err);
        throw new AppError(400, "Error updating chatbot");
      }
      if (!chatbot) {
        throw new AppError(404, `Chatbot not found with id ${chatbot_id}`);
      }

      botEvent.emit("faqbot.update", chatbot);
    }

    if (replace) {
      await intentsController.deleteByChatbotId(chatbot._id);
    }

    await this._importIntents(chatbot._id, id_project, user_id, json.intents, overwrite);
    await this._importSubagents(chatbot, json.subagents, id_project, user_id, replace, overwrite);

    return chatbot;
  }

  async updatedChatbot(chatbot_id, id_project, update) {
    let chatbot;
    try {
      chatbot = await Chatbot.findOneAndUpdate({ _id: chatbot_id, id_project: id_project }, update, { new: true });
    } catch (err) {
      winston.error("(ChatbotController) updatedChatbot error: ", err);
      throw new AppError(500, `Error updating chatbot with id ${chatbot_id}`);
    }
    if (!chatbot) {
      throw new AppError(404, `Chatbot not found with id ${chatbot_id} for project ${id_project}`);
    }
    return chatbot;
  }

}

const chatbotController = new ChatbotController();
module.exports = chatbotController;
