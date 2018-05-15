var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var GroupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: Array, "default": []
    // required: true
  },
    id_project: {
    type: String,
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('group', GroupSchema);
