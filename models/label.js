let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let LabelEntrySchema = new Schema({
  lang: { 
    type: String,
    required: true,
    index:true
  },
  data: {
    type: Object,
    required: true
  },
  category: {
    type: String,
    required: false,
    index: true
  },
  default: {   
    type: Boolean,
    // required: false,
    // get: v => {
    //   console.log("v",v)
    //   if (v) {
    //     return v;
    //   } else {
    //     return false;
    //   }
    // },
    required: true,
    default: false,
    index: true
  },
});

let LabelSchema = new Schema({
  
  data: { 
    //type: Array,
    type: [LabelEntrySchema],
    required: true,
    //index: true
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

 let label = mongoose.model('label', LabelSchema);


module.exports = label;
