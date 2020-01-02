var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var RequesterSchema = new Schema({
  ref: {
    type: Schema.Types.ObjectId,
    // ref: 'department',
    // required: true
  },
  type : {
    type: String,
    // required: true
  }
});
var requester = mongoose.model('requester', RequesterSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  requester.syncIndexes();
  winston.info("requester syncIndexes")
}

module.exports = requester;
