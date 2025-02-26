const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

const WebhookSchema = mongoose.Schema({
  webhook_id: {
    type: String,
    default: () => nanoid(),
    unique: true,
    required: true
  },
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