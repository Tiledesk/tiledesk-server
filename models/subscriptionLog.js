var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var SubscriptionLogSchema = new Schema({
  event: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  response: {
    type: String,
  },
  jsonRequest:{
    type: String,
  },
  body: {
    type: String,
  },
  err: {
    type: String,
  },
  id_project: {
    type: String,
    required: true,
     index:true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('subscriptionLog', SubscriptionLogSchema);
