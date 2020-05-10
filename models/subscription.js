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
  global: {
    type: Boolean,
    default: false,
    select: false,
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
// Subscription.find({event:event, $or:[{id_project: id_project}, {global: true}]})
SubscriptionSchema.index({ event: 1, id_project: 1, global: 1  }); 

SubscriptionSchema.index({ id_project: 1, event: 1, target: 1  }, { unique: true }); 

var subscription = mongoose.model('subscription', SubscriptionSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  subscription.syncIndexes();
  winston.info("subscription syncIndexes")
}

module.exports = subscription;
