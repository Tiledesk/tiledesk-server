var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
let isCommunity = false;
if (process.env.COMMUNITY_VERSION === true || process.env.COMMUNITY_VERSION === 'true') {
  isCommunity = true;
}

var ProfileSchema = new Schema({
  name: {
    type: String,
    default: function() {
      return (isCommunity) ? 'Custom' : 'Sandbox';
    },
    index: true
  },
  trialDays: {
    type: Number,
    default: 14
  },
  agents: {
    type: Number,
    default: function() {
      return (isCommunity) ? 5 : 0;
    }
  },
  type: {
    type: String,
    default: function() {
      return (isCommunity) ? 'payment' : 'free';
    }
  },
  quotes: {
    type: Object
  },
  customization: {
    type: Object,
    default: function() {
      if (isCommunity) {
        return {
          copilot: true,
          webhook: true,
          voice: true,
          voice_twilio: true,
          widgetUnbranding: true,
          smtpSettings: true,
          knowledgeBases: true,
          reindex: true,
          whatsapp: true,
          messanger: true,
          telegram: true,
          chatbot: true
        };
      }
      return undefined;
    }
  },
  subStart: {
    type: Date,
    default: function() {
      if (isCommunity) {
        return new Date();
      }
      return undefined;
    }
  },
  subEnd: {
    type: Date,
    default: function() {
      if (isCommunity) {
        // Set date to 31 December 2099
        return new Date('2099-12-31T23:59:59.999Z');
      }
      return undefined;
    }
  },
  subscriptionId:  {
    type: String,
  },
  extra1:  {
    type: String,
  },
  extra2:  {
    type: String,
  },
  extra3:  {
    type: String,
  },
  subscription_creation_date: {
    type: Date,
  },
  last_stripe_event:  {
    type: String,
  },

}
,{ _id : false });

var profile =mongoose.model('profile', ProfileSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  profile.syncIndexes();
  winston.verbose("profile syncIndexes")
}


module.exports = profile;
