var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const { MessageLog } = require('../models/whatsappLog');
const { Transaction } = require('../models/transaction');
const logsService = require('../services/logsService');



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

    // res.stats(200).send({ success: true });
})


router.get('/whatsapp/:transaction_id', async (req, res) => {

    let project_id = req.projectid;

    let transaction_id = req.params.transaction_id;
    winston.info("Get logs for whatsapp transaction_id " + transaction_id);;

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

// IN DEVELOPMENT
router.get('/flows/auth/:request_id', async (req, res) => {

    const scope = [
        `rabbitmq.read:*/*/apps.${appid}.logs.${requestid}.*`,
    ]

    const now = Math.round(new Date().getTime()/1000);
        // console.log("now: ", now)
        const exp = now + 60 * 60 * 24 * 30;

        var payload = {
            "jti": uuidv4(),
            "sub": user._id,
            scope: scope,
            "client_id": user._id, //"rabbit_client", SEMBRA SIA QUESTO LO USER-ID
            "cid": user._id, //"rabbit_client",
            "azp": user._id, //"rabbit_client",
            // "grant_type": "password", //"password", // client_credentials // REMOVED 2
            "user_id": user._id,
            "app_id": appid,
            // "origin": "uaa", // REMOVED 2
            // "user_name": user._id, // REMOVED 2
            // "email": user.email,
            // "auth_time": now, // REMOVED 2
            // "rev_sig": "d5cf8503",
            "iat": now,
            "exp": exp, // IF REMOVED TOKEN NEVER EXPIRES?
            // "iss": "http://localhost:8080/uaa/oauth/token", // REMOVED 2
            // "zid": "uaa", // REMOVED 2
            "aud": [
                "rabbitmq",
                user._id
            ],
            // "jku": "https://localhost:8080/uaa/token_keys", // REMOVED 2
            "kid": "tiledesk-key", //"legacy-token-key",
            "tiledesk_api_roles": "user"
        }
        winston.debug("payload:\n", payload)
        var token = jwt.sign(
            payload,
            jwtSecret,
            {
                "algorithm": "HS256"
            }
        );
        const result = {
            userid: user._id,
            fullname: user.fullName,
            firstname: user.firstname,
            lastname: user.lastname,
            token: token
        }
        return res.status(200).send(result);   

}) 


router.get('/flows/:request_id', async (req, res) => {

    let request_id = req.params.request_id;
    const { timestamp, direction, logLevel } = req.query;

    if (!request_id) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'request_id'." });
    }

    let method;

    if (!timestamp) {
        method = logsService.getLastRows(request_id, 20, logLevel);
    } else if (direction === 'prev') {
        logsService.get
        method = logsService.getOlderRows(request_id, 10, logLevel, new Date(timestamp));
    } else if (direction === 'next') {
        method = logsService.getNewerRows(request_id, 10, logLevel, new Date(timestamp))
    } else {
        return res.status(400).send({ success: false, error: "Missing or invalid 'direction' parameter. Use 'prev' or 'next'."})
    }

    method.then((logs) => {
        res.status(200).send(logs);
    }).catch((err) => {
        res.status(500).send({ success: false, error: "Error fetching logs: " + err.message });
    })

})








module.exports = router;
