const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
});

// Update the updated_at field before saving
UnansweredQuestionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('UnansweredQuestion', UnansweredQuestionSchema); 