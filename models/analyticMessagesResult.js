let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let AnalyticMessagesResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'messages' }
);

let analyticMessagesResult= mongoose.model('analyticMessagesResultSchema', AnalyticMessagesResultSchema);



module.exports = analyticMessagesResult;
