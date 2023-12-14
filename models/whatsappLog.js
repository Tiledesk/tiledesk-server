const mongoose = require('mongoose');

const MessageLogSchema = mongoose.Schema({
  json_message: {
    type: Object,
    required: true
  },
  transaction_id: {
    type: String,
    required: true
  },
  message_id: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true
  },
  status_code: {
    type: Number,
    required: true
  },
  error: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})


const MessageLog = mongoose.model("MessageLog", MessageLogSchema);  

module.exports = { MessageLog };