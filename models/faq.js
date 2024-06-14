var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var { nanoid } = require("nanoid");
const uuidv4 = require('uuid/v4');

var defaultFullTextLanguage = process.env.DEFAULT_FULLTEXT_INDEX_LANGUAGE || "none";

var FaqSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  id_faq_kb: {
    type: String,
    index: true
  },
  intent_id: {
    type: String,
    required: false,
    index: true,
    default: function () {
      return uuidv4();
    }
  },
  intent_display_name: { //documentare
    type: String,
    required: false,
    index: true,
    default: function () {
      return nanoid(6);
    }
  },
  question: {
    type: String,
    required: false
  },

  webhook_enabled: { //usa questo
    type: Boolean,
    required: false,
    default: false,
  },
  answer: {
    type: String,
    //required: true
    required: false
  },
  reply: {
    type: Object,
    required: false,
  },
  enabled: {
    type: Boolean,
    required: false,
    default: true,
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  topic: {
    type: String,
    default: "default",
    index: true
    // required: true
  },
  status: {
    type: String,
    default: "live",
    index: true
    // required: true
  },
  language: {
    type: String,
    required: false,
    index: true
  },

  //   "stats":{  
  //     "conversation_count":2,
  //     "all_done_count":0,
  //     "wait_for_team_count":2
  //  }

  createdBy: {
    type: String,
    required: true
  },
  form: {
    type: Object,
    required: false
  },
  actions: {
    type: Array,
    required: false
  },
  attributes: {
    type: Object,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}
);

FaqSchema.virtual('faq_kb', {
  ref: 'faq_kb', // The model to use
  localField: 'id_faq_kb', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  justOne: false,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

FaqSchema.index({ id_project: 1, id_faq_kb: 1, question: 1 });

// https://docs.mongodb.com/manual/core/index-text/
// https://docs.mongodb.com/manual/tutorial/specify-language-for-text-index/
// https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages

// In testing...
// FaqSchema.index({ question: "text", answer: "text" }, { weights: { question: 5, answer: 3 } })

// FaqSchema.statics = {
//   searchPartial: function (q, callback) {
//     return this.find({
//       $or: [
//         { "question": new RegExp(q, "gi") },
//         { "answer": new RegExp(q, "gi") },
//       ]
//     }, callback)
//   },

//   searchFull: function (q, callback) {
//     return this.find({
//       $text: { $search: q, $caseSensitive: false }
//     }, callback)
//   },

//   searchFull: function (q, callback) {
//     return this.find({
//       $text: { $search: q, $caseSensitive: false }
//     }, callback)
//   },

//   search: function (q, callback) {
//     this.searchFull(q, (err, data) => {
//       if (err) return callback(err, data);
//       if (!err && data.length) return callback(err, data);
//       if (!err && data.length === 0) return this.searchPartial(q, callback);
//     });
//   },

// }

FaqSchema.index({ question: 'text' },
  { "name": "faq_fulltext", "default_language": defaultFullTextLanguage, "language_override": "language" }); // schema level

//  FaqSchema.index({question: 'text', answer: 'text'},
//  {"name":"faq_fulltext","default_language": defaultFqullTextLanguage,"language_override": "language", weights: {question: 10,answer: 1}}); // schema level


FaqSchema.index({ id_project: 1, id_faq_kb: 1, intent_display_name: 1 }, { unique: true });
FaqSchema.index({ id_project: 1, id_faq_kb: 1, intent_id: 1 }, { unique: true });

FaqSchema.index(
  { "actions.namespace": -1 },
  { partialFilterExpression: { "actions.namespace": { $exists: true } } }
);


var faq = mongoose.model('faq', FaqSchema);

faq.on('index', function (error) {
  // "_id index cannot be sparse"
  winston.debug('index', error);
});

if (process.env.MONGOOSE_SYNCINDEX) {
  faq.syncIndexes();
  winston.info("faq syncIndexes")
}


module.exports = faq;
