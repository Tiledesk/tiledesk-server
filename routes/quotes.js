var express = require('express');
var router = express.Router();
const { QuoteManager } = require('../services/QuoteManager');


router.get('/', async (req, res) => {

    let date = req.body.date;

    let obj = { createdAt: new Date() };
    if (date) {
        obj.createdAt = new Date(date)
    }

    let cache = req.app.get('redis_client');

    let qm = new QuoteManager({ project: req.project, tdCache: cache })
    let quotes = await qm.getAllQuotes(obj);

    winston.debug("quotes: ", quotes);
    res.status(200).send({ message: 'ok', quotes: quotes });

})

router.get('/:type', async (req, res) => {

    let type = req.params.type;
    let obj = { createdAt: new Date() };

    let cache = req.app.get('redis_client');

    let qm = new QuoteManager({ project: req.project, tdCache: cache })
    let isAvailable = await qm.checkQuote(obj, type);

    winston.debug("is " + type + " available: ", isAvailable);
    res.status(200).send({ isAvailable: isAvailable })
    
})

module.exports = router;