let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let winston = require('../config/winston');

let PendingInvitation = new Schema({
  
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


let pending= mongoose.model('pending-invitation', PendingInvitation);


if (process.env.MONGOOSE_SYNCINDEX) {
  pending.syncIndexes();
  winston.verbose("pending syncIndexes")
}

module.exports = pending;
