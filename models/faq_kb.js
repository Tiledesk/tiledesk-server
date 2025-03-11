var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');
var winston = require('../config/winston');
const { stringify } = require('uuid');

var defaultFullTextLanguage = process.env.DEFAULT_FULLTEXT_INDEX_LANGUAGE || "none";


var Faq_kbSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    // index:true
  },
  url: {
    type: String,
    // required: true
  },
  webhook_url: {
    type: String,
    // required: true
  },
  webhook_enabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  // kbkey_remote: { //serve?
  //   type: String,
  // },  
  type: {
    type: String,
    default: 'internal',
    index: true
  },
  subtype: {
    type: String,
    default: function() {
      return this.type === 'tilebot' ? 'chatbot' : undefined;
    },
    index: true
  },
  // external: {
  //   type: Boolean,
  //   default: false
  // },
  trashed: {
    type: Boolean,
    index: true
  },
  secret: {
    type: String,
    required: true,
    default: uuidv4(),
    select: false
  },
  language: {
    type: String,
    required: false,
    default: 'en'
    // index: true
  },
  attributes: {
    type: Object,
  },
  createdBy: {
    type: String,
    required: true
  },
  public: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  certified: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  mainCategory: {
    type: String,
    required: false
  },
  intentsEngine: {
    type: String,
    required: false,
    default: 'none'
  },
  tags: [{
    type: String
  }],
  score: {
    type: Number,
    required: false,
    index: true,
    default: 0
  },
  publishedBy: {
    type: String,
  },
  publishedAt: {
    type: Date
  },
  trained: {
    type: Boolean,
    default: true
  },
  short_description: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: false
  },
  certifiedTags: {
    type: Array,
    required: false
  },
  agents_available: {
    type: Boolean,
    required: false,
    default: function () {
      return this.isNew ? false : undefined;
    },
  },
  slug: {
    type: String,
    required: false,
    index: true
  }
},{
  timestamps: true
});


Faq_kbSchema.pre("save", async function (next) {
  // Check if the document is new and if the slug has not been set manually
  if (this.isNew && !this.slug) {
    const baseSlug = generateSlug(this.name);
    let uniqueSlug = baseSlug;

    const existingCount = await mongoose.model("faq_kb").countDocuments({
      id_project: this.id_project,
      slug: { $regex: `^${baseSlug}(?:-\\d+)?$` }
    });

    if (existingCount > 0) {
      uniqueSlug = `${baseSlug}-${existingCount}`;
    }

    this.slug = uniqueSlug;
  }

  next();
});

Faq_kbSchema.virtual('fullName').get(function () {
  // winston.debug("faq_kb fullName virtual called");
  return (this.name);
});

Faq_kbSchema.index({certified: 1, public: 1}); //suggested by atlas


Faq_kbSchema.index(
  {name: 'text', description: 'text', "tags": 'text'},  
  {"name":"faqkb_fulltext","default_language": defaultFullTextLanguage,"language_override": "language"}); // schema level

Faq_kbSchema.index(
  { id_project: 1, slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $exists: true } } }
);


var faq_kb = mongoose.model('faq_kb', Faq_kbSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  faq_kb.syncIndexes();
  winston.verbose("faq_kb syncIndexes")
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD") // Normalize characters with accents
    .replace(/[\u0300-\u036f]/g, "") // Removes diacritics (e.g. à becomes a)
    .replace(/[^a-z0-9\s-_]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replaces spaces with dashes
    .replace(/_/g, "-")
    .replace(/-+/g, "-"); // Removes consecutive hyphens
}

module.exports = faq_kb
