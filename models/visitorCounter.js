var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/database');

//var conn      = mongoose.createConnection(process.env.MONGODB_LOGS_URI | process.env.MONGODB_URI || config.databaselogs, { "autoIndex": true });
var conn      = mongoose.createConnection(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI || config.databaselogs, { "autoIndex": true });


// db.getCollection('reqlogs').aggregate([ {$group:{_id:{id_project:"$id_project"},  "count":{$sum:1}}},{$sort:{"count":-1}}])
// db.getCollection('projects').find({"_id":ObjectId("5afeaf94404bff0014098f54")})

var VisitorCounterSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  totalViews:{type:Number,default:0},

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

module.exports = conn.model('visitor_counter', VisitorCounterSchema);
