var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const { MessageLog } = require('../models/whatsappLog');
const { Transaction } = require('../models/transaction');
const logsService = require('../services/logsService');
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken")

const jwtSecret = process.env.CHAT21_JWT_SECRET || "tokenKey";

router.get('/', function (req, res, next) {
    winston.info("logs", req.body);
    return res.status(200).send({ success: true });
});


router.post('/', function (req, res, next) {
    winston.info("logs", req.body);
    return res.status(200).send({ success: true });
});

router.get('/whatsapp', async (req, res) => {

    let project_id = req.projectid;

    Transaction.find({ id_project: project_id, broadcast: { $in: [null, true] } }, (err, transactions) => {
        if (err) {
            winston.error("Error find transactions for project_id: " + project_id);
            return res.status(400).send({ success: false, message: "Unable to find transaction for project_id " + project_id });
        }

        winston.verbose("Transactions: ", transactions);

        res.status(200).send(transactions);
    })

})


router.get('/whatsapp/:transaction_id', async (req, res) => {

    let project_id = req.projectid;

    let transaction_id = req.params.transaction_id;
    winston.info("Get logs for whatsapp transaction_id " + transaction_id);

    MessageLog.find({ id_project: project_id, transaction_id: transaction_id }).lean().exec((err, logs) => {
        if (err) {
            winston.error("Error find logs for transaction_id " + transaction_id);
            return res.status(400).send({ success: false, message: "Unable to find logs for transaction_id " + transaction_id })
        }

        winston.verbose("Logs found: ", logs);

        let clearLogs = logs.map(({ _id, __v, ...keepAttrs }) => keepAttrs)
        winston.verbose("clearLogs: ", clearLogs)

        res.status(200).send(clearLogs);
    })

})

router.get('/whatsapp/user/:phone_number', async (req, res) => {

    const { id_project, phone_number } = req.query;
    console.log("id_project: ", id_project);
    console.log("phone_number: ", phone_number);

    let query = { id_project: id_project, "json_message.to": phone_number };
    console.log("query: ", query);

    MessageLog.find(query).lean().exec((err, logs) => {
        if (err) {
            winston.error("Error find logs for phone_number " + phone_number);
            return res.status(400).send({ success: false, message: "Unable to find logs for phone_number " + phone_number })
        }
        console.log("logs: ", logs);
        winston.verbose("Logs found: ", logs);

        let clearLogs = logs.map(({ _id, __v, ...keepAttrs }) => keepAttrs)
        winston.verbose("clearLogs: ", clearLogs)
        console.log("clearLogs: ", clearLogs);
        res.status(200).send(clearLogs);
    })

})

router.post('/whatsapp', async (req, res) => {

    winston.info("save following log: ", req.body);

    let log = new MessageLog({
        id_project: req.body.id_project,
        json_message: req.body.json_message,
        transaction_id: req.body.transaction_id,
        message_id: req.body.message_id,
        status: req.body.status,
        status_code: req.body.status_code,
        error: req.body.error
    });

    log.save((err, savedLog) => {
        if (err) {
            winston.error("Unable to save log: ", err);
            return res.status(400).send(err);
        }

        winston.info("savedLog: ", savedLog);
        res.status(200).send(savedLog);
    })
})


router.get('/flows/:id', async (req, res) => {
    const id = req.params.id;
    const { timestamp, direction, logLevel, type } = req.query;

    if (!id) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'id'." });
    }

    // Determine if we're searching by request_id or webhook_id
    const isWebhook = type === 'webhook';
    const queryField = isWebhook ? 'webhook_id' : 'request_id';

    let method;

    if (!timestamp) {
        method = logsService.getLastRows(id, 20, logLevel, queryField);
    } else if (direction === 'prev') {
        method = logsService.getOlderRows(id, 10, logLevel, new Date(timestamp), queryField);
    } else if (direction === 'next') {
        method = logsService.getNewerRows(id, 10, logLevel, new Date(timestamp), queryField);
    } else {
        return res.status(400).send({ success: false, error: "Missing or invalid 'direction' parameter. Use 'prev' or 'next'."});
    }

    method.then((logs) => {
        res.status(200).send(logs);
    }).catch((err) => {
        res.status(500).send({ success: false, error: "Error fetching logs: " + err.message });
    });
});


router.get('/flows/auth/:request_id', async (req, res) => {

    const request_id = req.params.request_id;
    const appid = "tilechat";

    const scope = [
        `rabbitmq.read:*/*/apps.${appid}.logs.${request_id}.*`,
        `rabbitmq.write:*/*/apps.${appid}.logs.${request_id}.*`,
        `rabbitmq.configure:*/*/*`
    ]

    const now = Math.round(new Date().getTime() / 1000);
    const exp = now + 60 * 60 * 24 * 30;

    var payload = {
        "jti": uuidv4(),
        "sub": request_id,
        scope: scope,
        "client_id": request_id,
        "cid": request_id,
        "azp": request_id,
        "user_id": request_id,
        "app_id": appid,
        "iat": now,
        "exp": exp,
        "aud": [
            "rabbitmq",
            request_id
        ],
        "kid": "tiledesk-key",
    }

    var token = jwt.sign(
        payload,
        jwtSecret,
        {
            "algorithm": "HS256"
        }
    );

    const result = {
        request_id: request_id,
        token: token
    }

    return res.status(200).send(result);

}) 


module.exports = router;
