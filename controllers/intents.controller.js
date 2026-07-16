const Intent = require("../models/faq");

class IntentsController {

    constructor() {}

    async getIntents(chatbot_id) {
        try {
            const intents = await Intent.find({ id_faq_kb: chatbot_id });
            return intents;
        } catch (err) {
            winston.error("Error finding intents with chatbot id " + chatbot_id);
            throw { status: 500, message: `Error finding intents with chatbot id ${chatbot_id}` };
        }
    }
}

const intentsController = new IntentsController();
module.exports = intentsController;