let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let PropertySchema = new Schema({
  
  label: {
    type: String,
    required: true,
  },  
  name: {
    type: String,
    required: true,
    index: true
  },  
  type: {
    type: String,
    required: true,
    default: "text",
    index: true
  },  
  status: {
    type: Number,
    required: true,
    default: 100, 
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  }
  },{
    timestamps: true
  }
);

let property = mongoose.model('property', PropertySchema);

 if (process.env.MONGOOSE_SYNCINDEX) {
  property.syncIndexes();
  winston.verbose("property syncIndexes")
}

module.exports = property;
