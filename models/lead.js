var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LeadSchema = new Schema({
  
  lead_id: { 
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  id_project: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('lead', LeadSchema);
