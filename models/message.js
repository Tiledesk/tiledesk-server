var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Channel = require('../models/channel');
var MessageConstants = require('../models/messageConstants');
var defaultFullTextLanguage = process.env.DEFAULT_FULLTEXT_INDEX_LANGUAGE || "none";

var MessageSchema = new Schema({
  // messageId: {
  //   type: String,
  //   required: true,
  //   // unique: true???
  //   index: true
  // },
  sender: {
    type: String,
    required: true,
    index: true
  },
  senderFullname: {
    type: String,
    required: false,
    default: "Guest" // guest_here
  },
  recipient: {
    type: String,
    required: true,
    index: true
  },
  recipientFullname: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    default: 'text',
    index: true
  },
  channel_type: {
    type: String,
    required: true,
    default: MessageConstants.CHANNEL_TYPE.GROUP,
    index: true
  },
  text: {
    type: String,
    // required: function() {
    //   if (this.type === "text") {
    //     return true;
    //   }else {
    //     return false;
    //   }
    // }
  },
  language: { //ISO 639-1 (Two letter codes) https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages
    type: String,
    required: false,
    index:true
  },
  channel: {
    type: Channel.schema,
    default: function() {
      return new Channel({name: 'chat21'});
    }
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


MessageSchema.index({ recipient: 1, createdAt:1 }); 
MessageSchema.index({ id_project: 1, recipient:1, createdAt: 1 });
MessageSchema.index({ recipient: 1, updatedAt:1 }); 
MessageSchema.index({ id_project: 1, recipient:1, updatedAt: 1 });
MessageSchema.index({ id_project: 1, "attributes._answerid": 1 });



// https://docs.mongodb.com/manual/core/index-text/
// https://docs.mongodb.com/manual/tutorial/specify-language-for-text-index/
// https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages
//TODO cambiare dummy con language? attento che il codice deve essere compatibile
MessageSchema.index({text: 'text'},
 {"name":"message_fulltext","default_language": defaultFullTextLanguage, "language_override": "dummy"}); // schema level


var message = mongoose.model('message', MessageSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  message.syncIndexes();
  winston.info("message syncIndexes")
}

module.exports = message;
