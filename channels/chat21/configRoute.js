var express = require('express');
var router = express.Router();
// var Setting = require("../models/setting");



router.get('/', function (req, res) {
  console.log('Config');
  
    var config = {};

    if (process.env.FIREBASE_APIKEY) {
      config.apiKey = process.env.FIREBASE_APIKEY;
    }

    if (process.env.FIREBASE_AUTHDOMAIN) {
      config.authDomain = process.env.FIREBASE_AUTHDOMAIN;
    }

    if (process.env.FIREBASE_DATABASEURL) {
      config.databaseURL = process.env.FIREBASE_DATABASEURL;
    }

    if (process.env.FIREBASE_PROJECT_ID) {
      config.projectId = process.env.FIREBASE_PROJECT_ID;
    }

    if (process.env.FIREBASE_STORAGEBUCKET) {
      config.storageBucket = process.env.FIREBASE_STORAGEBUCKET;
    }

    if (process.env.FIREBASE_MESSAGINGSENDERID) {
      config.messagingSenderId = process.env.FIREBASE_MESSAGINGSENDERID;
    }
  
    if (process.env.CHAT21_URL) {
      config.chat21ApiUrl = process.env.CHAT21_URL;
    }
  
  
     
    res.json(config);
  
});





module.exports = router;
