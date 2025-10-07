let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../../config/winston');


let CannedResponseSchema = new Schema({
  
  title: {
    type: String,
    required: false,
    index: true
  },
  text: {
    type: String,
    required: true,
  },
  shared: {
    type: Boolean,
    required: true
  },
  attributes: {
    type: Object,
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
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


// CannedResponseSchema.index({text: 'text'},
//  {"name":"cannedresponse_fulltext","default_language": "italian","language_override": "dummy"}); // schema level

 let CannedResponse = mongoose.model('cannedResponse', CannedResponseSchema);

 if (process.env.MONGOOSE_SYNCINDEX) {
  CannedResponse.syncIndexes();
  winston.info("CannedResponse syncIndexes")
}

module.exports = CannedResponse;
