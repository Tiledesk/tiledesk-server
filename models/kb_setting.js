var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var EngineSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  apikey: {
    type: String,
    required: false
  },
  vector_size: {
    type: Number,
    required: true
  },
  index_name: {
    type: String,
    required: true
  }
}, {
  _id: false  // This is schema is always used as an embedded object inside NamespaceSchema
})

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
  },
  engine: {
    type: EngineSchema,
    required: false
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
  },
  scrape_type: {
    type: Number,
    required: false
  },
  scrape_options: {
    type: Object,
    required: false,
    default: undefined,
    tags_to_extract: {
      type: Array,
      required: false
    },
    unwanted_tags: {
      type: Array,
      required: false
    },
    unwanted_classnames: {
      type: Array,
      required: false
    }
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
KBSchema.index({ id_project: 1, namespace: 1, updatedAt: -1 })


// DEPRECATED
const KBSettings = mongoose.model('KBSettings', KBSettingSchema); 
const Engine = mongoose.model('Engine', EngineSchema)
const Namespace = mongoose.model('Namespace', NamespaceSchema)
const KB = mongoose.model('KB', KBSchema)

// module.exports = {
//   KBSettings: KBSettings,
//   KB: KB
// }

module.exports = {
  KBSettings: KBSettings,
  Namespace: Namespace,
  Engine: Engine,
  KB: KB
}
