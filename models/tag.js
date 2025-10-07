let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let TagSchema = new Schema({
  
  tag: {
    type: String,
    required: true,
    index: true
  },  
  color: {
    type: String,
    required: false,
    index: false
  },  
  attributes: {
    type: Object,
  },
}
);


module.exports = TagSchema;
