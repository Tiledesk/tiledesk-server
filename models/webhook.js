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

WebhookSchema.index({ id_project: 1, chatbot_id: 1}, { unique: true })

const Webhook = mongoose.model("Webhook", WebhookSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  Webhook.syncIndexes();
  winston.verbose("Webhook syncIndexes");
}

module.exports = { Webhook };