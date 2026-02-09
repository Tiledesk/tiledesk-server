var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// mongoose.set('debug', true);
var winston = require('../config/winston');
let config = require('../config/database');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

var readPreference = process.env.ANALYTICS_READ_PREFERENCE ||  "primary";
winston.info("Annalytics readPreference: " + readPreference);

var conn = mongoose.createConnection(databaseUri, { "autoIndex": true, readPreference: readPreference});	


var AnalyticResultSchema = new Schema({
  // _id: {
  //   type: String,
  //   required: true
  // },
  count: {
    type: Number,
     required: true
  }}, { collection: 'requests' }
);

var analyticResult= conn.model('analyticResult', AnalyticResultSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  analyticResult.syncIndexes();
  winston.verbose("analyticResult syncIndexes")
}


module.exports = analyticResult;
