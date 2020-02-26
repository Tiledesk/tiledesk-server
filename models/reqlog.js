var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/database');

var winston = require('../config/winston');
var dbUrl = process.env.MONGODB_LOGS_URI || config.databaselogs || process.env.MONGODB_URI;
winston.info('ReqLogSchema dbUrl: '+dbUrl);

var conn      = mongoose.createConnection(dbUrl, { "autoIndex": true });	
// var conn      = mongoose.connect(dbUrl, { "useNewUrlParser": true, "autoIndex": true });



// db.getCollection('reqlogs').aggregate([ {$group:{_id:{id_project:"$id_project"},  "count":{$sum:1}}},{$sort:{"count":-1}}])
// db.getCollection('projects').find({"_id":ObjectId("5afeaf94404bff0014098f54")})

var ReqLogSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  ip: {
    type: String,
    index: true 
  },
  host: {
    type: String,
    index: true 
  },
  origin: {
    type: String,
    index: true 
  },
  id_project: {
    type: String,
    index: true
    //required: true
  }
}, {
    timestamps: true
  }
);

module.exports = conn.model('reqLog', ReqLogSchema);
