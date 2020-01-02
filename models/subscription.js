var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');

var winston = require('../config/winston');

var SubscriptionSchema = new Schema({
  event: {
    type: String,
    required: true,
    index: true
  },
  target: {
    type: String,
    required: true,
    index: true
  },
  secret: {
    type: String,
    required: true,
    default: uuidv4(),
    select: false
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);


var subscription = mongoose.model('subscription', SubscriptionSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  subscription.syncIndexes();
  winston.info("subscription syncIndexes")
}

module.exports = subscription;
