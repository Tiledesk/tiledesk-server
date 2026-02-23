const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  phone: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  external_id: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', ContactSchema);
module.exports = Contact;