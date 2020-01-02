var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var ChannelSchema = new Schema({
  name: { //ex: chat21
    type: String,
    required: true
  }
},{ _id : false });

var channel = mongoose.model('channel', ChannelSchema);;

if (process.env.MONGOOSE_SYNCINDEX) {
  channel.syncIndexes();
  winston.info("channel syncIndexes")
}


module.exports = channel;
