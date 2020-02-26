var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/database');


var winston = require('../config/winston');
var dbUrl = process.env.MONGODB_LOGS_URI || config.databaselogs || process.env.MONGODB_URI;
winston.info('VisitorCounterSchema dbUrl: '+dbUrl);

var conn      = mongoose.createConnection(dbUrl, { "autoIndex": true });	
// var conn      = mongoose.connect(dbUrl, { "useNewUrlParser": true, "autoIndex": true });

// db.getCollection('reqlogs').aggregate([ {$group:{_id:{id_project:"$id_project"},  "count":{$sum:1}}},{$sort:{"count":-1}}])
// db.getCollection('projects').find({"_id":ObjectId("5afeaf94404bff0014098f54")})

var VisitorCounterSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  totalViews:{
    type:Number,
    default:0,
    index: true 
  },

  // ip: {
  //   type: String,
  //   index: true 
  // },
  // host: {
  //   type: String,
  //   index: true 
  // },
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

var visitor_counter = conn.model('visitor_counter', VisitorCounterSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  visitor_counter.syncIndexes();
  winston.info("visitor_counter syncIndexes")
}


module.exports = visitor_counter;
