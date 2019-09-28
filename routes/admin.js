const fs = require('fs');

var express = require('express');

var router = express.Router();
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token');
var roleChecker = require('../middleware/has-role');


router.get('/', function (req, res) {
    res.render('admin-get', { title: 'Hey', message: 'Hello there!'})
});

router.post('/', function (req, res) {
       
    console.log(req.body.FIREBASE_PRIVATE_KEY);
    var env = `
    FIREBASE_PRIVATE_KEY=${req.body.FIREBASE_PRIVATE_KEY}
    FIREBASE_CLIENT_EMAIL=${req.body.FIREBASE_CLIENT_EMAIL}
    FIREBASE_PROJECT_ID=${req.body.FIREBASE_PROJECT_ID}
    FIREBASE_APIKEY=${req.body.FIREBASE_APIKEY}
    FIREBASE_AUTHDOMAIN=${req.body.FIREBASE_AUTHDOMAIN}
    FIREBASE_DATABASEURL=${req.body.FIREBASE_DATABASEURL}
    FIREBASE_MESSAGINGSENDERID=${req.body.FIREBASE_MESSAGINGSENDERID}
    CHAT21_ENABLED=${req.body.CHAT21_ENABLED}
    CHAT21_URL=${req.body.CHAT21_URL}
    CHAT21_APPID=${req.body.CHAT21_APPID}
    CHAT21_ADMIN_TOKEN=${req.body.CHAT21_ADMIN_TOKEN}
    `;
    fs.writeFile(__dirname+"/..confenv/.env",env, function(err) {

        if(err) {
            return console.log(err);
        }
    
        console.log("The env file was saved!");
        res.end()
    }); 

    
  });

  module.exports = router;
