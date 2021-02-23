var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var winston = require('../../config/winston');

var AnalyticEventsResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'events' }
);

var analyticEventsResult= mongoose.model('analyticEventsResultSchema', AnalyticEventsResultSchema);



module.exports = analyticEventsResult;
