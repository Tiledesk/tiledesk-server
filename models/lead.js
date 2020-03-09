var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

/*
Leads are useful for representing logged-out users of your application. 
As soon as a visitor starts a conversation with you, or replies to a visitor auto message, they become a lead. 
You can follow up with leads via email if they share their email address with you.
*/

var LeadSchema = new Schema({
  
  lead_id: { 
    type: String,
    required: true,
    index: true
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
  },
  status: {
    type: Number,
    required: false,
    default: 100,
    index: true
  }, 
},{
  timestamps: true
}
);

LeadSchema.index({fullname: 'text', email: 'text'},
 {"name":"lead_fulltext","default_language": "italian","language_override": "dummy"}); // schema level


 var lead = mongoose.model('lead', LeadSchema);

 if (process.env.MONGOOSE_SYNCINDEX) {
  lead.syncIndexes();
  winston.info("lead syncIndexes")
}

module.exports = lead;
