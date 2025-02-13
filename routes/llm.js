var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
let Integration = require('../models/integrations');
const aiService = require('../services/aiService');

router.post('/preview', async (req, res) => {

    let id_project = req.projectid;
    let body = req.body;
    let key;

    if (!body.llm) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'llm'" });
    }

    let integration = await Integration.findOne({ id_project: id_project, name: body.llm }).catch((err) => {
        winston.error("Error finding integration with name: ", body.llm);
        return res.status(500).send({ success: false, error: "Error finding integration for " + body.llm});
    })

    if (!integration) {
        winston.verbose("Integration for " + body.llm + " not found.")
        return res.status(404).send({ success: false, error: "Integration for " + body.llm + " not found."})
    }

    if (!integration?.value?.apikey) {
        return res.status(422).send({ success: false, error: "The key provided for " + body.llm + " is not valid or undefined." })
    }

    key = integration.value.apikey;

    let json = {
        question: body.question,
        llm: body.llm,
        model: body.model,
        llm_key: key,
        temperature: body.temperature,
        max_tokens: body.max_tokens
    }

    if (body.context) {
        json.system_context = body.context;
    }

    aiService.askllm(json).then((response) => {
        winston.verbose("Askllm response: ", response);
        res.status(200).send(response.data)
    }).catch((err) => {
        if (err.response?.data?.detail[0]) {
            res.status(400).send({ success: false, error: err.response.data.detail[0]?.msg, detail: err.response.data.detail });
        } else if (err.response?.data?.detail?.answer) {
            res.status(400).send({ success: false, error: err.response.data.detail.answer, detail: err.response.data.detail });
        } else if (err.response?.data) {
            res.status(500).send({ success: false, error: err.response.data });
        } else {
            res.status(500).send({ success: false, error: err });
        }
    })

})

module.exports = router;
