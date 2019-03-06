var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivitySchema = new Schema({
  
  actor: { 
    type: String,
    required: true,
    index: true
  },
  verb: {
    type: String,
    required: true,
    index: true
  },

  actionObj: {
    type: String,
    required: false
  },
  target: {
    type: String,
    required: true,
    index: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('activity', ActivitySchema);
