var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FaqSchema = new Schema({
  id_faq_kb: {
    type: String,
    // required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: "default"
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);



FaqSchema.index({question: 'text'},
 {"name":"faq_fulltext","default_language": "italian","language_override": "dummy"}); // schema level



module.exports = mongoose.model('faq', FaqSchema);
