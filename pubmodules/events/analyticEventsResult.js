let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// let winston = require('../../config/winston');

let AnalyticEventsResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'events' }
);

let analyticEventsResult= mongoose.model('analyticEventsResultSchema', AnalyticEventsResultSchema);



module.exports = analyticEventsResult;
