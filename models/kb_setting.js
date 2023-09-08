var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var KBSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Number,
    required: false,
    default: -1
  }
})

var KBSettingSchema = new Schema({
  id_project: {
    type: String,
    required: true,
    index: true
  },
  gptkey: {
    type: String,
    //required: true
  },
  maxKbsNumber: {
    type: Number,
    default: 3
  },
  maxPagesNumber: {
    type: Number,
    default: 1000
  },
  kbs: [ KBSchema ]
});


module.exports = mongoose.model('KBSettings', KBSettingSchema);
// module.exports = mongoose.model('KB', KBSchema)
