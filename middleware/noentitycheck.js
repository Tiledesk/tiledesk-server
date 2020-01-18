var winston = require('../config/winston');



module.exports = 
    function(req,res,next){ 
        winston.debug("before disablePassportEntityCheck=true");
        req.disablePassportEntityCheck = true;
        winston.debug("disablePassportEntityCheck=true"); 
        next();
}