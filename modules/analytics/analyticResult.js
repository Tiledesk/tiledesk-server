var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// mongoose.set('debug', true);

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

module.exports = mongoose.model('analyticResult', AnalyticResultSchema);
