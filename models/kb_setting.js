var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
let expireAfterSeconds = process.env.UNANSWERED_QUESTION_EXPIRATION_TIME || 7 * 24 * 60 * 60; // 7 days

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
  },
  host: {
    type: String,
    required: false
  },
  port: {
    type: Number,
    required: false
  },
  deployment: {
    type: String,
    required: false
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
  hybrid: {
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
  },
  refresh_rate: {
    type: String,
    required: false
  },
  last_refresh: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
})

const UnansweredQuestionSchema = new Schema({
  id_project: {
    type: String,
    required: true,
    index: true
  },
  namespace: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
},{
  timestamps: true
});

// Add TTL index to automatically delete documents after 30 days
UnansweredQuestionSchema.index({ created_at: 1 }, { expireAfterSeconds: expireAfterSeconds }); // 30 days

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
KBSchema.index({ namespace: 1, type: 1 })


// DEPRECATED
const KBSettings = mongoose.model('KBSettings', KBSettingSchema); 
const Engine = mongoose.model('Engine', EngineSchema)
const Namespace = mongoose.model('Namespace', NamespaceSchema)
const KB = mongoose.model('KB', KBSchema)
const UnansweredQuestion = mongoose.model('UnansweredQuestion', UnansweredQuestionSchema)


module.exports = {
  KBSettings: KBSettings,
  Namespace: Namespace,
  Engine: Engine,
  KB: KB,
  UnansweredQuestion: UnansweredQuestion
}
