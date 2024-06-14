var express = require('express');
var router = express.Router();
const { QuoteManager } = require('../services/QuoteManager');
let winston = require('../config/winston');
const { MODELS_MULTIPLIER } = require('../utils/aiUtils');


router.post('/', async (req, res) => {

    let date = req.body.date;

    let obj = { createdAt: new Date() };
    if (date) {
        obj.createdAt = new Date(date)
    }

    let quoteManager = req.app.get('quote_manager');

    // check if project is not null/undefined
    let quotes = await quoteManager.getAllQuotes(req.project, obj);

    winston.debug("quotes: ", quotes);
    res.status(200).send({ message: 'ok', quotes: quotes });

})

router.get('/:type', async (req, res) => {

    let type = req.params.type;
    let obj = { createdAt: new Date() };

    let quoteManager = req.app.get('quote_manager');
    let isAvailable = await quoteManager.checkQuote(req.project, obj, type);

    winston.debug("is " + type + " available: ", isAvailable);
    res.status(200).send({ isAvailable: isAvailable })

})

router.post('/incr/:type', async (req, res) => {

    let type = req.params.type;
    let data = req.body;

    let quoteManager = req.app.get('quote_manager');

    let multiplier = MODELS_MULTIPLIER[data.model];
    if (!multiplier) {
        multiplier = 1;
        winston.info("No multiplier found for AI model")
    }
    data.multiplier = multiplier;
    data.createdAt = new Date();

    let incremented_key = await quoteManager.incrementTokenCount(req.project, data);
    let quote = await quoteManager.getCurrentQuote(req.project, data, type);    

    res.status(200).send({ message: "value incremented for key " + incremented_key, key: incremented_key, currentQuote: quote });
})

module.exports = router;