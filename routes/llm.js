var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
let Integration = require('../models/integrations');

router.post('/preview', async (req, res) => {

    let id_project = req.projectid;
    let body = req.body;
    let llm = body.llm;
    let key;

    if (!llm) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'llm'" });
    }

    let integration = await Integration.findOne({ id_project: id_project, name: llm }).catch((err) => {
        winston.error("Error finding integration with name: ", llm);
        return res.status(500).send({ success: false, error: "Error finding integration for " + llm});
    })

    if (!integration) {
        winston.verbose("Integration for " + llm + " not found.")
        return res.status(404).send({ success: false, error: "Integration for " + llm + " not found."})
    }

    if (!integration?.value?.apikey) {
        return res.status(422).send({ success: false, error: "The key provided for " + llm + " is not valid or undefined." })
    }

    key = integration.value.apikey;

    res.status(200).send("ok");

})
