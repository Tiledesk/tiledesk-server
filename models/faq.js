var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var FaqSchema = new Schema({
  id_faq_kb: {
    type: String,
    index: true
    // required: true
    // type: Schema.Types.ObjectId,
    // ref: 'faq_kb'
  },
  intent: {
    type: String,
    required: false
  },
  question: {
    type: String,
    required: true 
  },
  answer: {
    type: String,
    required: true
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
  }
},{
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


FaqSchema.index({question: 'text', answer: 'text'},
 {"name":"faq_fulltext","default_language": "italian","language_override": "language", weights: {question: 10,answer: 1}}); // schema level

 var faq = mongoose.model('faq', FaqSchema);

 faq.on('index', function(error) {
  // "_id index cannot be sparse"
  winston.debug('index', error);
});

if (process.env.MONGOOSE_SYNCINDEX) {
  faq.syncIndexes();
  winston.info("faq syncIndexes")
}


module.exports = faq;
