var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProfileSchema = new Schema({
  name: {
    type: String,
    default: 'free',
    index: true
  },
  trialDays: {
    type: Number,
    default: 30
  },
  agents: {
    type: Number,
    default: 0 //??
  },
  type: {
    type: String,
    default: 'free',
  },
  subStart: {
    type: Date,
  },
  subEnd: {
    type: Date,
  },
  subscriptionId:  {
    type: String,
  },
  last_stripe_event:  {
    type: String,
  },

}
,{ _id : false });

module.exports = mongoose.model('profile', ProfileSchema);
