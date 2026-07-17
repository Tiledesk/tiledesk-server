const Intent = require("../models/faq");
const AppError = require("../utils/AppError");
const faqBotEvent = require("../event/faqBotEvent");
const winston = require("../config/winston");

const INTENT_FIELDS = [
  "intent_display_name",
  "intent_id",
  "question",
  "answer",
  "reply",
  "form",
  "enabled",
  "webhook_enabled",
  "language",
  "actions",
  "attributes"
];

class IntentsController {

  constructor() { }

  _mapIntent(chatbot_id, id_project, user_id, intent) {
    const mapped = {
      id_faq_kb: chatbot_id,
      id_project,
      createdBy: user_id
    };
    for (const field of INTENT_FIELDS) {
      if (intent[field] !== undefined) {
        mapped[field] = intent[field];
      }
    }
    return mapped;
  }

  async create(chatbot_id, id_project, user_id, intent, { skipDuplicates = false } = {}) {
    try {
      const faq = await Intent.create(
        this._mapIntent(chatbot_id, id_project, user_id, intent)
      );
      faqBotEvent.emit("faq.create", faq);
      return faq;
    } catch (err) {
      if (err.code === 11000) {
        if (skipDuplicates) {
          winston.debug("Skip duplicated intent_display_name");
          return null;
        }
        throw new AppError(409, "Duplicate intent_display_name");
      }
      winston.error("(IntentsController) create error: ", err);
      throw new AppError(500, "Error creating intent");
    }
  }

  async createMany(chatbot_id, id_project, user_id, intents, options) {
    if (!intents?.length) {
      return [];
    }
    const results = await Promise.allSettled(
      intents.map((intent) =>
        this.create(chatbot_id, id_project, user_id, intent, options)
      )
    );
    return results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);
  }

  async upsert(chatbot_id, id_project, user_id, intent) {
    try {
      const savingResult = await Intent.findOneAndUpdate(
        { id_faq_kb: chatbot_id, intent_display_name: intent.intent_display_name },
        this._mapIntent(chatbot_id, id_project, user_id, intent),
        { new: true, upsert: true, rawResult: true }
      );

      if (!savingResult?.value) {
        return null;
      }

      if (savingResult.lastErrorObject?.updatedExisting === true) {
        winston.verbose("updated existing intent");
        faqBotEvent.emit("faq.update", savingResult.value);
      } else {
        winston.verbose("new intent created");
        faqBotEvent.emit("faq.create", savingResult.value);
      }

      return savingResult.value;
    } catch (err) {
      winston.error("(IntentsController) upsert error: ", err);
      throw new AppError(500, "Error upserting intent");
    }
  }

  async upsertMany(chatbot_id, id_project, user_id, intents) {
    if (!intents?.length) {
      return [];
    }
    const results = await Promise.allSettled(
      intents.map((intent) =>
        this.upsert(chatbot_id, id_project, user_id, intent)
      )
    );
    return results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);
  }

  async deleteByChatbotId(chatbot_id) {
    try {
      const result = await Intent.deleteMany({ id_faq_kb: chatbot_id });
      winston.verbose("All faq for chatbot " + chatbot_id + " deleted successfully");
      return result;
    } catch (err) {
      winston.error("(IntentsController) deleteByChatbotId error: ", err);
      throw new AppError(500, `Error deleting intents for chatbot ${chatbot_id}`);
    }
  }

  async getIntents(chatbot_id) {
    try {
      const intents = await Intent
        .find({ id_faq_kb: chatbot_id })
        .lean()
        .exec();
      return intents;
    } catch (err) {
      winston.error("(IntentsController) getIntents error: ", err);
      throw new AppError(500, `Error finding intents with chatbot id ${chatbot_id}`);
    }
  }
}

const intentsController = new IntentsController();
module.exports = intentsController;
