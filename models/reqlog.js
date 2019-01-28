var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReqLogSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  ip: {
    type: String,
    index: true 
  },
  id_project: {
    type: String,
    index: true
    //required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('reqLog', ReqLogSchema);
