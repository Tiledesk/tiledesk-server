const faqBotEvent = require('../event/faqBotEvent');
const Faq_kb = require('../models/faq_kb');
const Faq = require('../models/faq');
var winston = require('../config/winston');
const axios = require("axios").default;


let chatbot_training_api_url = "http://34.65.210.38/model/train"

class TrainingService {



    train(eventName, faq) {

        Faq_kb.findById(faq.id_faq_kb, (err, faq_kb) => {
            winston.debug("faq_kb: ", faq_kb)

            if (faq_kb.intentsEngine !== 'tiledesk-ai') {
                winston.info("intentsEngine: off")
                return null;
            }

            winston.info("intentsEngine: on")
            Faq.find({ id_faq_kb: faq.id_faq_kb }, (err, faqs) => {

                if (err) {
                    winston.error("[Training] find all error: ", err);
                } else {

                    let json = {
                        "configuration": {
                            "language": faq_kb.language,
                            "pipeline": [""]
                        },
                        "model": faq_kb._id,
                        "nlu": []
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

        faqBotEvent.on('faq.create', (faq) => {
            setImmediate(() => {
                trainingService.train('faq.create', faq);
            })
        })

        faqBotEvent.on('faq.update', (faq) => {
            winston.debug("--> event faq: ", faq);
            setImmediate(() => {
                trainingService.train('faq.update', faq);
            })
        })

        faqBotEvent.on('faq.delete', (faq) => {
            console.log("--> event faq: ", faq);
            setImmediate(() => {
                trainingService.train('faq.delete', faq);
            })
        })


    }

}

var trainingService = new TrainingService();

module.exports = trainingService;