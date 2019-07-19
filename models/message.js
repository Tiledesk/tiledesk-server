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
    required: true,
    index: true
  },
  status: {
    type: Number,
    default: 200,  //RECEIVED
    required: true,
    index: true
  },
  // first: { //used by bot training feature. use request first_text insteed?
  //   type: Boolean,
  //   default: false
  // },
  attributes: {
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

MessageSchema.index({ recipient: 1, updatedAt:1 }); // schema level
MessageSchema.index({ id_project: 1, recipient:1, updatedAt: 1 }); // schema level


module.exports = mongoose.model('message', MessageSchema);
