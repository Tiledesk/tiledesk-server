var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var LeadConstants = require('./leadConstants');
var TagSchema = require("../models/tag");
var defaultFullTextLanguage = process.env.DEFAULT_FULLTEXT_INDEX_LANGUAGE || "none";


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
  phone: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  note: {
    type: String,
    required: false
  },
  streetAddress: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  region: {
    type: String,
    required: false
  },
  zipcode: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  // tags: [TagSchema],
  tags: [{
    type: String
  }],
  // aggiungi location e togli flat fields
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
    default: LeadConstants.NORMAL,  
    index: true
  }, 
  properties: {
    type: Object,
  },
},{
  timestamps: true
}
);

// https://docs.mongodb.com/manual/core/index-text/
// https://docs.mongodb.com/manual/tutorial/specify-language-for-text-index/
// https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages
LeadSchema.index({fullname: 'text', email: 'text'},
 {"name":"lead_fulltext","default_language": defaultFullTextLanguage,"language_override": "dummy"}); // schema level

  // suggested by atlas
LeadSchema.index({status: 1, id_project: 1, createdAt: -1});



 var lead = mongoose.model('lead', LeadSchema);

 if (process.env.MONGOOSE_SYNCINDEX) {
  lead.syncIndexes();
  winston.info("lead syncIndexes")
}

module.exports = lead;
