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

// chatApi.CHAT_MESSAGE_STATUS = {
//   FAILED : -100,
//   SENDING : 0,
//   SENT : 100, //saved into sender timeline
//   DELIVERED : 150, //delivered to recipient timeline
//   RECEIVED : 200, //received from the recipient client
//   RETURN_RECEIPT: 250, //return receipt from the recipient client
//   SEEN : 300 //seen

// }

module.exports = mongoose.model('message', MessageSchema);
