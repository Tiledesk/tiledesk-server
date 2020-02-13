var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');
var winston = require('../config/winston');

var Faq_kbSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  url: { 
    type: String,
    // required: true
  },
  webhookUrl: { 
    type: String,
    // required: true
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

Faq_kbSchema.virtual('fullName').get(function () {
  return (this.name);
});

var faq_kb = mongoose.model('faq_kb', Faq_kbSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  faq_kb.syncIndexes();
  winston.info("faq_kb syncIndexes")
}



module.exports = faq_kb
