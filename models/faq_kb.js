var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Faq_kbSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  url: { 
    type: String,
    // required: true
  },
  id_project: {
    type: String,
    required: true
  },
  kbkey_remote: {
    type: String,
  },  
  //
  external: {
    type: Boolean,
    default: false
  },
  trashed: {
    type: Boolean,
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('faq_kb', Faq_kbSchema);
