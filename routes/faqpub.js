var express = require('express');
var router = express.Router();
var Faq = require("../models/faq");
var winston = require('../config/winston');




router.get('/', function (req, res, next) {
  var query = {};

  winston.debug("GET ALL FAQ OF THE BOT ID (req.query): ", req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  if (req.query.text) {
    winston.debug("GET FAQ req.projectid", req.projectid);

    // query.$text = req.query.text;
    query.$text = { "$search": req.query.text };
    query.id_project = req.projectid
  }

  winston.debug("GET FAQ query", query);

  // query.$text = {"$search": "question"};

  // TODO ORDER BY SCORE
  // return Faq.find(query,  {score: { $meta: "textScore" } }) 
  // .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score

  
  return Faq.find(query).
    populate({path:'faq_kb'}).//, match: { trashed: { $in: [null, false] } }}).
    exec(function (err, faq) {
      winston.debug("GET FAQ ", faq);

      if (err) {
        winston.error('GET FAQ err ', err)
        return next(err)
      };
      winston.debug('GET FAQ  ', faq)
      res.json(faq);

    });

  // Faq.find(query, function (err, faq) {
  //   if (err) {
  //     winston.debug('GET FAQ err ', err)
  //     return next(err)
  //   };
  //   winston.debug('GET FAQ  ', faq)
  //   res.json(faq);
  // });

});




module.exports = router;