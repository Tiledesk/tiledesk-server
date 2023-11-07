var express = require('express');
var router = express.Router();
const { QuoteManager } = require('../services/QuoteManager');
let winston = require('../config/winston');


router.get('/', async (req, res) => {

    let date = req.body.date;

    let obj = { createdAt: new Date() };
    if (date) {
        obj.createdAt = new Date(date)
    }    
    
    let quoteManager = req.app.get('quote_manager');

    // check if project is not null/undefined
    let quotes = await quoteManager.getAllQuotes(req.project, obj);

    console.log("quotes: ", quotes);
    winston.debug("quotes: ", quotes);
    res.status(200).send({ message: 'ok', quotes: quotes});

})

module.exports = router;