var winston = require('../config/winston');

var Recaptcha = require('express-recaptcha').RecaptchaV3
var recaptcha = new Recaptcha('6Lf1khcpAAAAABMNHJfnJm43vVTxFzXM7ADqDAp5', '6Lf1khcpAAAAAG6t7LuOfl9vThGPFOOJIiAoMIhs')

const RECAPTCHA_ENABLED =  false;

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
              winston.error("Signup recaptcha ko");
            //   next({status:"Signup recaptcha ko"});
                res.status(403).send({success: false, msg: 'Recaptcha error.'});

                // error code
            }
        })
       
}