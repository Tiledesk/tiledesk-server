let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let config = require('../config/database');


let winston = require('../config/winston');

let dbUrl = process.env.MONGODB_LOGS_URI || config.databaselogs || process.env.MONGODB_URI;
winston.info('VisitorCounterSchema dbUrl: '+dbUrl);

// mongoose.set('useFindAndModify', false); //??
// mongoose.set('useCreateIndex', true);
// mongoose.set('useUnifiedTopology', true); 

let conn      = mongoose.createConnection(dbUrl, { "autoIndex": true });	
// let conn      = mongoose.connect(dbUrl, { "useNewUrlParser": true, "autoIndex": true });

// db.getCollection('reqlogs').aggregate([ {$group:{_id:{id_project:"$id_project"},  "count":{$sum:1}}},{$sort:{"count":-1}}])
// db.getCollection('projects').find({"_id":ObjectId("5afeaf94404bff0014098f54")})

let RouterLoggerSchema = new Schema({
  url: {
    type: String,
    index: true 
  },
  fullurl: {
    type: String,
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

let routerLogger = conn.model('router_logger', RouterLoggerSchema);



module.exports = routerLogger;
