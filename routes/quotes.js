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

    console.log("QUOTES cache imported")

    let qm = new QuoteManager({ project: req.project, tdCache: cache })
    let quotes = await qm.getAllQuotes(obj);

    console.log("quotes: ", quotes);
    winston.debug("quotes: ", quotes);
    res.status(200).send({ message: 'ok', quotes: quotes});

})

module.exports = router;