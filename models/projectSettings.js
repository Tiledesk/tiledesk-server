/**
 * Project Settings Schema
 * 
 * This schema defines the structure for project settings, which was previously
 * stored as a generic Object. Using a structured schema provides:
 * - Better validation
 * - Improved maintainability
 * - Clearer documentation
 * - Type safety
 * 
 * The schema is designed to be backward compatible (strict: false) to allow
 * for gradual migration and additional fields that may exist in existing data.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var ChatLimitOn = process.env.SMART_ASSIGNMENT_CHAT_LIMIT_ON_DEFAULT_PROJECT || false;

// Email Config Schema
var EmailConfigSchema = new Schema({
  host: {
    type: String
  },
  port: {
    type: Number
  },
  secure: {
    type: Boolean
  },
  user: {
    type: String
  },
  pass: {
    type: String,
    //select: false // Don't include password in queries by default
  }
}, { _id: false });

// Email Templates Schema
var EmailTemplatesSchema = new Schema({
  assignedRequest: {
    type: String
  },
  assignedEmailMessage: {
    type: String
  },
  pooledRequest: {
    type: String
  },
  pooledEmailMessage: {
    type: String
  },
  newMessage: {
    type: String
  },
  newMessageFollower: {
    type: String
  },
  ticket: {
    type: String
  },
  sendTranscript: {
    type: String
  },
  emailDirect: {
    type: String
  }
}, { _id: false });

// Email Notification Schema
var EmailNotificationSchema = new Schema({
  conversation: {
    assigned: {
      type: Boolean
    },
    pooled: {
      type: Boolean
    }
  }
}, { _id: false });

// Email Schema
var EmailSchema = new Schema({
  from: {
    type: String
  },
  config: {
    type: EmailConfigSchema
  },
  templates: {
    type: EmailTemplatesSchema
  },
  notification: {
    type: EmailNotificationSchema
  },
  autoSendTranscriptToRequester: {
    type: Boolean
  }
}, { _id: false });

// Project Settings Schema
var ProjectSettingsSchema = new Schema({
  // Email settings
  email: {
    type: EmailSchema
  },
  
  // Chat/Assignment settings
  chat_limit_on: {
    type: Boolean,
    default: function() {
      return ChatLimitOn || false;
    }
  },
  max_agent_assigned_chat: {
    type: Number
  },
  reassignment_on: {
    type: Boolean
  },
  reassignment_delay: {
    type: Number
  },
  automatic_unavailable_status_on: {
    type: Boolean
  },
  automatic_idle_chats: {
    type: Boolean // Could also be Number depending on usage
  },
  current_agent_my_chats_only: {
    type: Boolean
  },
  
  // UI/Content settings
  chatbots_attributes_hidden: {
    type: Boolean
  },
  allow_send_emoji: {
    type: Boolean
  },
  allowed_urls: {
    type: Boolean
  },
  allowed_urls_list: {
    type: [String],
    default: undefined // Avoid array defaults to prevent empty array (which would mean no URLs are allowed)
  },
  allowed_upload_extentions: {
    type: [String], // Array of allowed extensions
    default: undefined // Same logic as above
  }
}, {
  _id: false, // No _id for subdocuments
  strict: false // Allow additional fields for backward compatibility
});

module.exports = ProjectSettingsSchema;

