var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');
var winston = require('../config/winston');

var Faq_kbSchema = new Schema({
  name: {
    type: String,
    required: true,
    index:true
  },
  description: {
    type: String,
    // index:true
  },
  url: { 
    type: String,
    // required: true
  },
  webhook_url: {
    type: String,
    // required: true
  },
  webhook_enabled: { 
    type: Boolean,
    required: false,
    default: false,
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  // kbkey_remote: { //serve?
  //   type: String,
  // },  
  type: {
    type: String,
    default: 'internal',
    index: true
  },
  // external: {
  //   type: Boolean,
  //   default: false
  // },
  trashed: {
    type: Boolean,
    index: true
  },
  secret: {
    type: String,
    required: true,
    default: uuidv4(),
    select: false
  },
  language: {
    type: String,
    required: false,
    default: 'en'
    // index: true
  },
  attributes: {
    type: Object,
  },
  createdBy: {
    type: String,
    required: true
  },
  public: {
    type: Boolean,
    required: false,
    default: false
  }
},{
  timestamps: true
}
);

Faq_kbSchema.virtual('fullName').get(function () {
  // winston.debug("faq_kb fullName virtual called");
  return (this.name);
});

var faq_kb = mongoose.model('faq_kb', Faq_kbSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  faq_kb.syncIndexes();
  winston.info("faq_kb syncIndexes")
}



module.exports = faq_kb
