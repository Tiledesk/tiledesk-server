var express = require('express');
var router = express.Router();
var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var request = require('request');
var multer = require('multer')
var upload = multer()
const faqBotEvent = require('../event/faqBotEvent');
var winston = require('../config/winston');

var parsecsv = require("fast-csv");
csv = require('csv-express');
csv.separator = ';';




router.get('/', function (req, res, next) {
  var query = {};

  console.log("GET ALL FAQ OF THE BOT ID (req.query): ", req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  if (req.query.text) {
    console.log("GET FAQ req.projectid", req.projectid);

    // query.$text = req.query.text;
    query.$text = { "$search": req.query.text };
    query.id_project = req.projectid
  }

  console.log("GET FAQ query", query);

  // query.$text = {"$search": "question"};

  return Faq.find(query).
    populate({path:'faq_kb'}).//, match: { trashed: { $in: [null, false] } }}).
    exec(function (err, faq) {
      console.log("GET FAQ ", faq);

      if (err) {
        console.log('GET FAQ err ', err)
        return next(err)
      };
      console.log('GET FAQ  ', faq)
      res.json(faq);

    });

  // Faq.find(query, function (err, faq) {
  //   if (err) {
  //     console.log('GET FAQ err ', err)
  //     return next(err)
  //   };
  //   console.log('GET FAQ  ', faq)
  //   res.json(faq);
  // });

});




module.exports = router;