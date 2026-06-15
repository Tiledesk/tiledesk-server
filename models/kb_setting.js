let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

const DEFAULT_UNANSWERED_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_ANSWERED_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

function ttlSecondsFromEnv(raw, fallbackSec) {
  if (raw == null || String(raw).trim() === '') return fallbackSec;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallbackSec;
}

let expireAfterSeconds = ttlSecondsFromEnv(
  process.env.UNANSWERED_QUESTION_EXPIRATION_TIME,
  DEFAULT_UNANSWERED_TTL_SEC
);
let expireAnsweredAfterSeconds = ttlSecondsFromEnv(
  process.env.ANSWERED_QUESTION_EXPIRATION_TIME,
  DEFAULT_ANSWERED_TTL_SEC
);

const EMPTY_EMBEDDING_API_KEY = '';

function logEmbeddingApiKeyWriteAttempt(source, attemptedValue, meta = {}) {
  if (attemptedValue === EMPTY_EMBEDDING_API_KEY || attemptedValue == null) {
    return;
  }
  winston.warn('[Namespace.embedding.api_key] non-empty value blocked on ' + source, {
    ...meta,
    attemptedValue,
    stack: new Error().stack
  });
}

function sanitizeEmbeddingApiKeyObject(embedding, source, meta = {}) {
  if (!embedding || typeof embedding !== 'object') {
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(embedding, 'api_key')) {
    return false;
  }
  if (embedding.api_key === EMPTY_EMBEDDING_API_KEY || embedding.api_key == null) {
    embedding.api_key = EMPTY_EMBEDDING_API_KEY;
    return false;
  }
  logEmbeddingApiKeyWriteAttempt(source, embedding.api_key, meta);
  embedding.api_key = EMPTY_EMBEDDING_API_KEY;
  return true;
}

function sanitizeEmbeddingApiKeyUpdate(update, source, meta = {}) {
  if (!update || typeof update !== 'object') {
    return false;
  }

  let changed = false;

  const sanitizeContainer = (container) => {
    if (!container || typeof container !== 'object') {
      return;
    }
    if (sanitizeEmbeddingApiKeyObject(container.embedding, source, meta)) {
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(container, 'embedding.api_key')
      && container['embedding.api_key'] !== EMPTY_EMBEDDING_API_KEY) {
      logEmbeddingApiKeyWriteAttempt(source, container['embedding.api_key'], meta);
      container['embedding.api_key'] = EMPTY_EMBEDDING_API_KEY;
      changed = true;
    }
  };

  sanitizeContainer(update);
  ['$set', '$setOnInsert'].forEach((key) => {
    if (update[key]) {
      sanitizeContainer(update[key]);
    }
  });

  return changed;
}


const EngineSchema = new Schema({
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
    type: String,
    required: false
  },
  deployment: {
    type: String,
    required: false
  },
}, {
  _id: false  // This is schema is always used as an embedded object inside NamespaceSchema
})

const EmbeddingSchema = new Schema({
  provider: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dimension: {
    type: Number,
    reuired: true
  },
  url: {
    type: String,
    required: false
  },
  api_key: {
    type: String,
    required: false,
    default: EMPTY_EMBEDDING_API_KEY,
    set: function (value) {
      logEmbeddingApiKeyWriteAttempt('embedding.api_key setter', value);
      return EMPTY_EMBEDDING_API_KEY;
    }
  }
}, {
  _id: false  // This is schema is always used as an embedded object inside NamespaceSchema
})

const NamespaceSchema = new Schema({
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
    required: true
  },
  embedding: {
    type: EmbeddingSchema,
    required: true
  }
}, {
  timestamps: true
})

NamespaceSchema.pre('save', function (next) {
  if (this.isModified('embedding.api_key')) {
    const attemptedValue = this.get('embedding.api_key');
    logEmbeddingApiKeyWriteAttempt('save', attemptedValue, {
      namespaceId: this.id,
      id_project: this.id_project
    });
    this.set('embedding.api_key', EMPTY_EMBEDDING_API_KEY);
  }
  next();
});

['updateOne', 'updateMany', 'findOneAndUpdate'].forEach((hook) => {
  NamespaceSchema.pre(hook, function (next) {
    const update = this.getUpdate();
    if (sanitizeEmbeddingApiKeyUpdate(update, hook, { query: this.getQuery() })) {
      this.setUpdate(update);
    }
    next();
  });
});

NamespaceSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      sanitizeEmbeddingApiKeyObject(doc.embedding, 'insertMany', {
        namespaceId: doc.id,
        id_project: doc.id_project
      });
    });
  }
  next();
});

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
  sitemap_origin_id: {
    type: String,
    required: false
  },
  sitemap_origin: {
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
  },
  last_error: {
    type: Object,
    required: false
  },
  tags: {
    type: Array,
    default: undefined,
    required: false
  },
  situated_context: {
    type: Boolean,
    default: false,
    required: false
  },
  chunk_regex: {
    type: String,
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
  request_id: {
    type: String,
    required: false,
  },
  sender: {
    type: String,
    required: false,
  }
},{
  timestamps: true
});

const AnsweredQuestionSchema = new Schema({
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
  answer: {
    type: String,
    required: true
  },
  tokens: {
    type: Number,
    required: false
  },
  request_id: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Add TTL index to automatically delete documents
UnansweredQuestionSchema.index({ createdAt: 1 }, { expireAfterSeconds: expireAfterSeconds }); 
UnansweredQuestionSchema.index({ id_project: 1, namespace: 1, createdAt: -1 });
UnansweredQuestionSchema.index({ question: "text" });

AnsweredQuestionSchema.index({ createdAt: 1 }, { expireAfterSeconds: expireAnsweredAfterSeconds });
AnsweredQuestionSchema.index({ id_project: 1, namespace: 1, createdAt: -1 });
AnsweredQuestionSchema.index(
  { question: "text", answer: "text" },
  { weights: { question: 3, answer: 1 } }
);



// DEPRECATED !! - Start
const KBSettingSchema = new Schema({
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
const AnsweredQuestion = mongoose.model('AnsweredQuestion', AnsweredQuestionSchema)


module.exports = {
  KBSettings: KBSettings,
  Namespace: Namespace,
  Engine: Engine,
  KB: KB,
  UnansweredQuestion: UnansweredQuestion,
  AnsweredQuestion: AnsweredQuestion
}
