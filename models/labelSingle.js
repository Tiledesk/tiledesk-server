var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var LabelSingleSchema = new Schema({
  
  lang: { 
    type: String,
    required: true,
    index: true
  },
  key: { 
    type: String,
    required: true,
    index: true
  },
  message: { 
    type: String,
    required: true,
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
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

 var label = mongoose.model('label', LabelSingleSchema);


module.exports = label;
