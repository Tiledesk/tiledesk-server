var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PendingInvitation = new Schema({
  
  email: {
    type: String,
    // required: true
  },
  id_project: {
    type: String,
    // required: true
  },
  role: {
    type: String,
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('pending-invitation', PendingInvitation);
