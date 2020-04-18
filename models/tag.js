var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var TagSchema = new Schema({
  
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
