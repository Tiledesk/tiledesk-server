let winston = require('../config/winston');


class MongooseCache {

    constructor(mongoose, option) {
        winston.info("exec");
       
        mongoose.Query.prototype.cache = function (ttl, customKey) {
            console.log("redisssscache1");       
            return this;
        }      
    }

}



// let mongooseCache = new MongooseCache();
// module.exports = mongooseCache;

module.exports = MongooseCache;
