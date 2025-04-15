const faq_kb = require("../models/faq_kb");
const httpUtil = require("../utils/httpUtil");
const uuidv4 = require('uuid/v4');
var jwt = require('jsonwebtoken');
var winston = require('../config/winston');
const errorCodes = require("../errorCodes");

const port = process.env.PORT || '3000';
let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/";;
if (process.env.TILEBOT_ENDPOINT) {
    TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/"
}
winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

class WebhookService {

    async run(webhook, payload, dev, redis_client) {

        return new Promise(async (resolve, reject) => {

            winston.verbose("(WebhookService) Run webhook " + webhook.webhook_id);
            let chatbot = await faq_kb.findById(webhook.chatbot_id).select("+secret").catch((err) => {
                winston.error("Error finding chatbot ", err);
                reject(err);
            })

            if (!chatbot) {
                winston.verbose("Chatbot not found with id " + webhook.chatbot_id);
                reject("Chatbot not found with id " + webhook.chatbot_id);
            }

            let chatbot_id
            if (chatbot.url) {
                chatbot_id = chatbot.url.substr(chatbot.url.lastIndexOf("/") + 1)
            }
            if (dev) {
                chatbot_id = webhook.chatbot_id;
                let key = "logs:webhook:" + webhook.id_project + ":" + webhook.webhook_id;
                let value = await redis_client.get(key);
                if (!value) {
                    reject({ success: false, code: errorCodes.WEBHOOK.ERRORS.NO_PRELOADED_DEV_REQUEST, message: "No preloaded dev request"})
                }
                let json_value = JSON.parse(value);
                payload.request_id = json_value.request_id;
            }   

            let token = await this.generateChatbotToken(chatbot);

            let url = TILEBOT_ENDPOINT + 'block/' + webhook.id_project + "/" + chatbot_id + "/" + webhook.block_id;
            winston.info("Webhook chatbot URL: ", url);

            payload.async = webhook.async;
            payload.token = token;

            if (process.env.NODE_ENV === 'test') {
                resolve({ success: true, message: "Webhook disabled in test mode" });
                return;
            }

            await httpUtil.post(url, payload).then((response) => {
                resolve(response.data);
            }).catch((err) => {
                winston.error("Error calling webhook on post: ", err);
                reject(err);
            })

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