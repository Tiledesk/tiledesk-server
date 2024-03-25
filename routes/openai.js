var express = require('express');
var router = express.Router();
var { KBSettings } = require('../models/kb_setting');
var openaiService = require('../services/openaiService');
var winston = require('../config/winston');
const { QuoteManager } = require('../services/QuoteManager');
const { MODEL_MULTIPLIER } = require('../utils/aiUtils');

router.post('/', async (req, res) => {

    let project_id = req.projectid;
    let body = req.body;
    let usePublicKey = false;
    let publicKey = process.env.GPTKEY;
    let gptkey = null;
    let obj = { createdAt: new Date() };
    let quoteManager = req.app.get('quote_manager');

    KBSettings.findOne({ id_project: project_id }, async (err, kbSettings) => {

        if (err) {
            usePublicKey = true;
            gptkey = publicKey;
        }

        if (kbSettings && kbSettings.gptkey) {
            gptkey = kbSettings.gptkey;
        } else {
            usePublicKey = true;
            gptkey = publicKey;
        }

        if (!gptkey) {
            return res.status(400).send({ success: false, message: "Missing gptkey parameter" });
        }

        if (usePublicKey === true) {
            let isAvailable = await quoteManager.checkQuote(req.project, obj, 'tokens');
            if (isAvailable === false) {
                return res.status(403).send("Tokens quota exceeded")
            }
        }
        

        let json = {
            "model": body.model,
            "messages": [
                {
                    "role": "user",
                    "content": body.question
                }
            ],
            "max_tokens": body.max_tokens,
            "temperature": body.temperature
        }

        let message = { role: "", content: "" };
        if (body.context) {
            message.role = "system";
            message.content = body.context;
            json.messages.unshift(message);
        }

        let multiplier = MODEL_MULTIPLIER[json.model];
        if (!multiplier) {
            multiplier = 1;
            winston.info("No multiplier found for AI model")
        }

        openaiService.completions(json, gptkey).then(async (response) => {
            let data = { createdAt: new Date(), tokens: response.data.usage.total_tokens, multiplier: multiplier }
            if (usePublicKey === true) {
                let incremented_key = await quoteManager.incrementTokenCount(req.project, data);
                winston.verbose("Tokens quota incremented for key " + incremented_key);
            }
            res.status(200).send(response.data);

        }).catch((err) => {
            // winston.error("completions error: ", err);
            res.status(500).send(err)
        })
    })
})

router.post('/quotes', async (req, res) => {

    let project = req.project;

    let body = req.body;
    body.createdAt = new Date(body.createdAt);

    let redis_client = req.app.get('redis_client');
    if (!redis_client) {
        return res.status(400).send({ error: "Redis not ready"});
    }

    let quoteManager = req.app.get('quote_manager');

    let incremented_key = await quoteManager.incrementTokenCount(req.project, req.body);
    let quote = await quoteManager.getCurrentQuote(req.project, req.body, 'tokens');
    
    res.status(200).send({ message: "value incremented for key " + incremented_key, key: incremented_key, currentQuote: quote });
})

// router.get('/', async (req, res) => {

//     let project_id = req.projectid;

//     OpenaiKbs.find({ id_project: project_id }, (err, kbs) => {
//         if (err) {
//             console.error("find all kbs error: ", err);
//             return res.status(500).send({ success: false, error: err });
//         } else {
//             return res.status(200).send(kbs);
//         }
//     })
// })

// router.post('/', async (req, res) => {

//     let body = req.body;

//     let new_kbs = new OpenaiKbs({
//         name: body.name,
//         url: body.url,
//         id_project: req.projectid,
//         gptkey: req.body.gptkey
//     })

//     new_kbs.save(function (err, savedKbs) {
//         if (err) {
//             console.error("save new kbs error: ", err);
//             return res.status(500).send({ success: false, error: err});
//         } else {
//             return res.status(200).send(savedKbs);
//         }
//     })
// })

// router.put('/', async (req, res) => {
//     // to be implemented
// })

// router.delete('/:kbs_id', async (req, res) => {
//     let kbs_id = req.params.kbs_id;

//     OpenaiKbs.findOneAndDelete( { _id: kbs_id }, (err, kbDeleted) => {
//         if (err) {
//             console.error("find one and delete kbs error: ", err);
//             return res.status(500).send({ success: false, error: err});
//         } else {
//             return res.status(200).send({ success: true, message: 'Knowledge Base deleted successfully', openai_kb: kbDeleted });
//         }
//     })
// })

module.exports = router;