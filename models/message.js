var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var MessageSchema = new Schema({
  sender: {
    type: String,
    required: true
  },
  senderFullname: {
    type: String,
    required: false
  },
  recipient: {
    type: String,
    required: true
  },
  // recipientFullname: {
  //   type: String,
  //   required: false
  // },
  type: {
    type: String,
    required: true,
    default: 'text',
  },
  text: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: Number,
    default: 200,  //RECEIVED
    required: true,
    index: true
  },
  attributes: {
    type: Object,
  },
  metadata: {
    type: Object,
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);


MessageSchema.index({ recipient: 1, updatedAt:1 }); // schema level
MessageSchema.index({ id_project: 1, recipient:1, updatedAt: 1 }); // schema level

var message = mongoose.model('message', MessageSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  message.syncIndexes();
  winston.info("message syncIndexes")
}

module.exports = message;
