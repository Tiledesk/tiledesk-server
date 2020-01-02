var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// mongoose.set('debug', true);
var winston = require('../config/winston');

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

var analyticResult= mongoose.model('analyticResult', AnalyticResultSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  analyticResult.syncIndexes();
  winston.info("analyticResult syncIndexes")
}


module.exports = analyticResult;
