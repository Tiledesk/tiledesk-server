var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LeadSchema = new Schema({
  
  lead_id: { 
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    index: true
  },
  attributes: {
    type: Object,
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  // auth: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'auth',
  //   //required: true
  // },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

LeadSchema.index({fullname: 'text', email: 'text'},
 {"name":"fulltext","default_language": "italian","language_override": "dummy"}); // schema level

module.exports = mongoose.model('lead', LeadSchema);
