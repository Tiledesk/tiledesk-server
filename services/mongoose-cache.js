var winston = require('../config/winston');


class MongooseCache {

    constructor(mongoose, option) {
        winston.info("exec");
       
        mongoose.Query.prototype.cache = function (ttl, customKey) {
            console.log("redisssscache1");       
            return this;
        }      
    }

}



// var mongooseCache = new MongooseCache();
// module.exports = mongooseCache;

module.exports = MongooseCache;
