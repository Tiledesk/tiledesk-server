let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// mongoose.set('debug', true);
let winston = require('../config/winston');

let AnalyticResultSchema = new Schema({
  // _id: {
  //   type: String,
  //   required: true
  // },
  count: {
    type: Number,
     required: true
  }}, { collection: 'requests' }
);

let analyticResult= mongoose.model('analyticResult', AnalyticResultSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  analyticResult.syncIndexes();
  winston.verbose("analyticResult syncIndexes")
}


module.exports = analyticResult;
