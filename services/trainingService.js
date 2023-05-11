const faqBotEvent = require('../event/faqBotEvent');
const Faq_kb = require('../models/faq_kb');
const Faq = require('../models/faq');
var winston = require('../config/winston');
const axios = require("axios").default;
var configGlobal = require('../config/global');


let chatbot_training_api_url = "http://34.65.210.38/model/train"

class TrainingService {


    train(eventName, id_faq_kb) {

        Faq_kb.findById(id_faq_kb, (err, faq_kb) => {

            if (err) {
                winston.error("train error: ", err)
                return null;
            }

            if (!faq_kb) {
                winston.error("faq_kb is undefined");
                return null;
            }

            if (faq_kb.intentsEngine !== 'tiledesk-ai') {
                winston.debug("intentsEngine: off")
                return null;
            }

            winston.debug("intentsEngine: on")
            Faq.find({ id_faq_kb: id_faq_kb }, (err, faqs) => {

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

                        // curl -v -X PUT -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin -d '{"trained":false}'  http://localhost:3000/63ed15febb8a5eb3b247fdfd/bots/64551b3422cdfb93ddb1b784
                        "webhook_url":  process.env.API_URL || configGlobal.apiUrl + "/" + faq_kb.id_project + "/bots/" + faq_kb._id+"/training",
                        "token" : process.env.TRAINING_BOT_JWT_TOKEN
                    }

                    faqs.forEach((f) => {
                        if (f.enabled == true) {
                            let intent = {
                                "intent": f.intent_display_name,
                                "examples": []
                            }
                            let questions = f.question.split("\n");
                            intent.examples = questions;
                            json.nlu.push(intent);
                        }
                    })

                    winston.debug("training json: \n" + JSON.stringify(json, null, 2));

                    axios({
                        url: chatbot_training_api_url,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: json,
                        method: 'POST'
                    }).then((resbody) => {
                        winston.info("[Training] resbody: ", resbody.data);
                        return true;
                    }).catch((err) => {
                        winston.error("[Training] error: ", err.response.data);
                    })
                }
            })

        })



    }

    start() {
        winston.info('TrainingService start');

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