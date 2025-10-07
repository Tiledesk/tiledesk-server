let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// let uuid = require('node-uuid');
// require('mongoose-uuid2')(mongoose);
// let UUID = mongoose.Types.UUID;

// let id = mongoose.Types.ObjectId();

let BotSchema = new Schema({
  // bot_id: { 
  //   type: UUID,
  //   default: uuid.v4 
  // },
  fullname: {
    type: String,
    required: true
  },
  id_faq_kb: {
    type: String,
    // required: true
  },
  id_project: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('bot', BotSchema);
