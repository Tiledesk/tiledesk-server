var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
  text: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('message', MessageSchema);
