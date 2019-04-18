var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var uuid = require('node-uuid');
// require('mongoose-uuid2')(mongoose);
// var UUID = mongoose.Types.UUID;

// var id = mongoose.Types.ObjectId();

var BotSchema = new Schema({
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
