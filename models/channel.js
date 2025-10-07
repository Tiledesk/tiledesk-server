let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let ChannelSchema = new Schema({
  name: { //ex: chat21
    type: String,
    required: true
  }
},{ _id : false });

let channel = mongoose.model('channel', ChannelSchema);;

if (process.env.MONGOOSE_SYNCINDEX) {
  channel.syncIndexes();
  winston.verbose("channel syncIndexes")
}


module.exports = channel;
