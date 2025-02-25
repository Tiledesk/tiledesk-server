const mongoose = require('mongoose');

const WebhookSchema = mongoose.Schema({
  id_project: {
    type: String,
    required: true
  },
  chatbot_id: {
    type: String,
    required: true
  },
  block_id: {
    type: String,
    required: true,
  },
  async: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
})


const Webhook = mongoose.model("Webhook", WebhookSchema);

module.exports = { Webhook };