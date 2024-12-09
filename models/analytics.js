var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnalyticsSchema = new Schema({
  id_project: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
    //default: () => new Date().setHours(0, 0, 0, 0)
  },
  keys: {
    type: Object,
    required: true
  }
}, {
  timestamps: true
})


const Analytics = mongoose.model('Analytics', AnalyticsSchema)
module.exports = Analytics

