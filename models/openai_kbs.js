var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var OpenaiKbsSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },

});


module.exports = mongoose.model('OpenaiKbs', OpenaiKbsSchema);
