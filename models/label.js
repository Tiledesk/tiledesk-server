var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var LabelSchema = new Schema({
  
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

 var label = mongoose.model('label', LabelSchema);


module.exports = label;
