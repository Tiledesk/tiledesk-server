let express = require('express');
let router = express.Router();
let winston = require('../config/winston');
const { Webhook } = require('../models/webhook');
const webhookService = require('../services/webhookService');

router.get('/', async (req, res) => {

    let id_project = req.projectid;
    let payload = req.body;
    let params = req.query;
    let request_id = req.query.request_id;
    payload.request_id = request_id;
    payload.webhook_query_params = params;

    let webhooks = await Webhook.find({ id_project: id_project, copilot: true }).catch((err) => {
        winston.error("Error finding copilot webhooks: ", err);
        return res.status(500).send({ success: false, error: err });
    })

    let promises = webhooks.map((w) => 
        webhookService.run(w, payload)
            .then((response) => {
                return response;
            }).catch((err) => {
                winston.error("Error running webhook: ", err);
                console.log("err.data", err.data);
                return;
            })
    )

    Promise.all(promises).then((results) => {
        console.log("result: ", results);
        let result = results.filter(r => r)
        return res.status(200).send(result);
    }).catch((err) => {
        // Should never executed - check it
        console.error("promise all error: ", err);
        return res.status(500).send({ success: false, error: err });
    })

})

router.post('/', async (req, res) => {

    let id_project = req.projectid;
    let payload = req.body;
    let params = req.query;
    let request_id = req.query.request_id;
    payload.request_id = request_id;
    payload.webhook_query_params = params;

    let webhooks = await Webhook.find({ id_project: id_project, copilot: true }).catch((err) => {
        winston.error("Error finding copilot webhooks: ", err);
        return res.status(500).send({ success: false, error: err });
    })

    let promises = webhooks.map((w) => 
        webhookService.run(w, payload)
            .then((response) => {
                return response;
            }).catch((err) => {
                winston.error("Error running webhook: ", err);
                return null;
            })
    )

    Promise.all(promises).then((result) => {
        return res.status(200).send(result);
    }).catch((err) => {
        return res.status(500).send({ success: false, error: err });
    })

})

module.exports = router;