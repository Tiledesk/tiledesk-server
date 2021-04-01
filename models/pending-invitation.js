var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var winston = require('../config/winston');

var PendingInvitation = new Schema({
  
  email: {
    type: String,
    index:true
    // required: true
  },
  id_project: {
    type: String,
    index:true
    // required: true
  },
  role: {
    type: String,
    // required: true
  },

  // TODO initial status (available,unavailable) 
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);


var pending= mongoose.model('pending-invitation', PendingInvitation);


if (process.env.MONGOOSE_SYNCINDEX) {
  pending.syncIndexes();
  winston.info("pending syncIndexes")
}

module.exports = pending;
