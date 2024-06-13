var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var NamespaceSchema = new Schema({
  id_project: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  preview_settings: {
    type: Object,
    required: true
  },
  default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

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


// DEPRECATED !! - Start
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
// DEPRECATED !! - End


KBSchema.index({ createdAt: -1, updatedAt: -1 })

// DEPRECATED
const KBSettings = mongoose.model('KBSettings', KBSettingSchema); 

const Namespace = mongoose.model('Namespace', NamespaceSchema)
const KB = mongoose.model('KB', KBSchema)

// module.exports = {
//   KBSettings: KBSettings,
//   KB: KB
// }

module.exports = {
  KBSettings: KBSettings,
  Namespace: Namespace,
  KB: KB
}
