var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var AnalyticMessagesResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'messages' }
);

var analyticMessagesResult= mongoose.model('analyticMessagesResultSchema', AnalyticMessagesResultSchema);



module.exports = analyticMessagesResult;
