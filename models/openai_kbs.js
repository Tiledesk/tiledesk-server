let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let OpenaiKbsSchema = new Schema({
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
  gptkey: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


module.exports = mongoose.model('OpenaiKbs', OpenaiKbsSchema);
