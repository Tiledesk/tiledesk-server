let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let AnalyticsSchema = new Schema({
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

