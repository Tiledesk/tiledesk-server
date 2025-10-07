let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let PresenceSchema = new Schema({
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
