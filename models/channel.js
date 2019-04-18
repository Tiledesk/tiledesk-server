var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ChannelSchema = new Schema({
  name: { //ex: chat21
    type: String,
    required: true
  }
},{ _id : false });

module.exports = mongoose.model('channel', ChannelSchema);
