var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var PresenceSchema = new Schema({
  status: {
    type: String,
    default: 'offline',  //online
    required: true,
    index: true
  },
  changedAt: {
    type: Date,
    default: new Date()
  },
}
,{ _id : false });


module.exports = PresenceSchema;
