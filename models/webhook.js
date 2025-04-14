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
  name: {
    type: String,
    required: false
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
  },
  copilot: {
    type: Boolean,
    required: false
  },
  enabled: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
WebhookSchema.index({ id_project: 1, chatbot_id: 1}, { unique: true })
WebhookSchema.index({ id_project: 1, webhook_id: 1}, { unique: true })

// Middlewares
WebhookSchema.pre("save", async function (next) {
  if (this.isNew) {

    try {
      const chatbot = await mongoose.model("faq_kb").findById(this.chatbot_id);
      if (chatbot) {
        this.name = chatbot.name + "-webhook";
      }

      next();

    } catch(error) {
      next(error);
    }
  }
});


const Webhook = mongoose.model("Webhook", WebhookSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  Webhook.syncIndexes();
  winston.verbose("Webhook syncIndexes");
}

module.exports = { Webhook };