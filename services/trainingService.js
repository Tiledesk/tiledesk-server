const faqBotEvent = require('../event/faqBotEvent');
const Faq_kb = require('../models/faq_kb');
const Faq = require('../models/faq');
var winston = require('../config/winston');
const axios = require("axios").default;
var configGlobal = require('../config/global');


let training_api_url = process.env.CHATBOT_TRAINING_API_URL || "http://34.65.210.38/model/enqueuetrain";
let token = process.env.TRAINING_BOT_JWT_TOKEN;

class TrainingService {


    async train(eventName, id_faq_kb, webhook_enabled) {

        return new Promise((resolve, reject) => {
            
            Faq_kb.findById(id_faq_kb, (err, faq_kb) => {
    
                if (err) {
                    winston.error("train error: ", err)
                    // return null;
                    reject(null);
                }
    
                if (!faq_kb) {
                    winston.error("faq_kb is undefined");
                    // return null;
                    reject(null);
                }
    
                if (faq_kb.intentsEngine !== 'tiledesk-ai') {
                    winston.debug("intentsEngine: off")
                    // return null;
                    reject(null);
                }
    
                winston.debug("intentsEngine: on")
                Faq.find({ id_faq_kb: id_faq_kb }, async (err, faqs) => {
    
                    if (err) {
                        winston.error("[Training] find all error: ", err);
                    } else {
    
                        let json = {
                            "configuration": {
                                "language": faq_kb.language,
                                "pipeline":["lstm"]
                            },
                            "model": faq_kb._id,
                            "nlu": [],
                            //"webhook_url":  process.env.API_URL || configGlobal.apiUrl + "/" + faq_kb.id_project + "/bots/" + faq_kb._id+"/training",
                            // curl -v -X PUT -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin -d '{"trained":false}'  http://localhost:3000/63ed15febb8a5eb3b247fdfd/bots/64551b3422cdfb93ddb1b784
                        }
    
                        if (webhook_enabled === true) {
                            json.webhook_url = process.env.API_URL || configGlobal.apiUrl + "/" + faq_kb.id_project + "/bots/" + faq_kb._id+"/training"
                        }

                        let index = faqs.findIndex(f => f.intent_display_name === "start");
                        faqs.slice(index);


                        faqs.forEach((f) => {
                            if (f.enabled == true) {
                                let intent = {
                                    "intent": f.intent_display_name,
                                    "examples": []
                                }
                                if (f.question) {
                                    let questions = f.question.split("\n");
                                    intent.examples = questions;
                                    json.nlu.push(intent);
                                } else {
                                    winston.debug("faq question null!")
                                }
                            }
                        })
    
                        winston.info("training json: \n", json);
    
                        await axios({
                            url: training_api_url,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token
                            },
                            data: json,
                            method: 'POST'
                        }).then((resbody) => {
                            winston.debug("[Training] resbody: ", resbody.data);
                            // return true;
                            resolve(resbody.data);
                        }).catch((err) => {
                            winston.error("[Training] error: ", err);
                            // return false;
                            reject(false);
                            // winston.error("[Training] error: ", err);
                        })
                    }
                })
    
            })

        })



    }

    start() {
        winston.info('TrainingService start');

        faqBotEvent.on('faq_train.train', (id_faq_kb, webhook_enabled) => {
            setImmediate(() => {
                trainingService.train('faq_train.train', id_faq_kb, webhook_enabled);
            })
        })

        faqBotEvent.on('faq_train.importedall', (id_faq_kb) => {
            setImmediate(() => {
                trainingService.train('faq.importedall', id_faq_kb);
            })
        })

        faqBotEvent.on('faq_train.create', (id_faq_kb) => {
            setImmediate(() => {
                trainingService.train('faq_train.create', id_faq_kb);
            })
        })

        faqBotEvent.on('faq_train.update', (id_faq_kb) => {
            setImmediate(() => {
                trainingService.train('faq_train.update', id_faq_kb);
            })
        })

        faqBotEvent.on('faq_train.delete', (id_faq_kb) => {
            setImmediate(() => {
                trainingService.train('faq_train.delete', id_faq_kb);
            })
        })


    }

}

var trainingService = new TrainingService();

module.exports = trainingService;