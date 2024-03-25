var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var ProfileSchema = new Schema({
  name: {
    type: String,
    default: 'Sandbox',
    index: true
  },
  trialDays: {
    type: Number,
    default: 14
  },
  agents: {
    type: Number,
    default: 0 //??
  },
  type: {
    type: String,
    default: 'free',
  },
  quotes: {
    type: Object
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
  extra1:  {
    type: String,
  },
  extra2:  {
    type: String,
  },
  extra3:  {
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
