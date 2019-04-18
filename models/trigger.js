var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var TriggerSchema = new Schema({
  key: { //ex: request.create
    type: String,
    required: true,
    index:true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
});

module.exports = mongoose.model('trigger', TriggerSchema);
