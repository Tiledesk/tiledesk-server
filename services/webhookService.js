const faq_kb = require("../models/faq_kb");
const httpUtil = require("../utils/httpUtil");
const uuidv4 = require('uuid/v4');
var jwt = require('jsonwebtoken');

const port = process.env.PORT || '3000';
let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/";;
if (process.env.TILEBOT_ENDPOINT) {
    TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/"
}
winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

class WebhookService {

    async run(webhook) {

        return new Promise(async (resolve, reject) => {

            let chatbot = await faq_kb.findById(webhook.chatbot_id).select("+secret").catch((err) => {
                winston.error("Error finding chatbot ", err);
                reject(err);
            })

            if (!chatbot) {
                winston.verbose("Chatbot not found with id " + webhook.chatbot_id);
                reject("Chatbot not found with id " + webhook.chatbot_id);
            }

            let token = await this.generateChatbotToken(chatbot);

            let url = TILEBOT_ENDPOINT + 'block/' + webhook.id_project + "/" + webhook.chatbot_id + "/" + webhook.block_id;
            winston.info("Webhook chatbot URL: ", url);

            payload.async = webhook.async;
            payload.token = token;

            if (process.env.NODE_ENV === 'test') {
                resolve(true);
            }

            let response = await httpUtil.post(url, payload).catch((err) => {
                winston.error("Error calling webhook on post: ", err);
                reject(err);
            })
            
            resolve(response.data);
        })
    }

    async generateChatbotToken(chatbot) {
        let signOptions = {
          issuer: 'https://tiledesk.com',
          subject: 'bot',
          audience: 'https://tiledesk.com/bots/' + chatbot._id,
          jwtid: uuidv4()
        };
      
        let botPayload = chatbot.toObject();
        let botSecret = botPayload.secret;
      
        var bot_token = jwt.sign(botPayload, botSecret, signOptions);
        return bot_token;
      }
}

let webhookService = new WebhookService();

module.exports = webhookService;