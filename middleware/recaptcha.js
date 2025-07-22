var winston = require('../config/winston');

var Recaptcha = require('express-recaptcha').RecaptchaV3;

const recaptcha_key = process.env.RECAPTCHA_KEY;
const recaptcha_secret = process.env.RECAPTCHA_SECRET;

winston.info("Recaptcha key: " + recaptcha_key + " and secret: " + recaptcha_secret );
var recaptcha = new Recaptcha(recaptcha_key, recaptcha_secret)

let RECAPTCHA_ENABLED =  false;

if (process.env.RECAPTCHA_ENABLED === true || process.env.RECAPTCHA_ENABLED ==="true") {
    RECAPTCHA_ENABLED = true;
}

module.exports = 
    function(req,res,next){ 
        if (RECAPTCHA_ENABLED==false) {
            return next();
        } 

        recaptcha.verify(req, function (error, data) {
            if (!error) {
              winston.debug("Signup recaptcha ok");
              next();
                // success code
            } else {
              winston.error("Signup recaptcha ko: "+ error);
            //   next({status:"Signup recaptcha ko"});
                res.status(403).send({success: false, msg: 'Recaptcha error.'});

                // error code
            }
        })
       
}
