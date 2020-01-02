var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

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
  subscription_creation_date: {
    type: Date,
  },
  last_stripe_event:  {
    type: String,
  },

}
,{ _id : false });

var profile =mongoose.model('profile', ProfileSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  profile.syncIndexes();
  winston.info("profile syncIndexes")
}


module.exports = profile;
