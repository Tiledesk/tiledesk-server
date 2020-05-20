var winston = require('../config/winston');


module.exports = function (mongoose, option) {
    winston.info("Mongoose cache fn initialized");
   
    mongoose.Query.prototype.cache = function (ttl, customKey) {
        winston.debug("Mongoose cache fn cache called");   
        return this;
    }      
}