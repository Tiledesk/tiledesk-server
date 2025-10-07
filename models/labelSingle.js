let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let LabelSingleSchema = new Schema({
  
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

 let label = mongoose.model('label', LabelSingleSchema);


module.exports = label;
