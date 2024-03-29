var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var KBSchema = new Schema({
  id_project: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: false
  },
  source: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: false
  },
  content: {
    type: String,
    required: false
  },
  namespace: {
    type: String,
    required: false
  },
  status: {
    type: Number,
    required: false
  }
}, {
  timestamps: true
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
  kbs: [KBSchema]
});

KBSchema.index({ createdAt: -1, updatedAt: -1 })


//module.exports = mongoose.model('KBSettings', KBSettingSchema);
const KBSettings = mongoose.model('KBSettings', KBSettingSchema);
const KB = mongoose.model('KB', KBSchema)

module.exports = {
  KBSettings: KBSettings,
  KB: KB
}

