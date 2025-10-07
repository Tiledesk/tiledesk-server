let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let RequesterSchema = new Schema({
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
let requester = mongoose.model('requester', RequesterSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  requester.syncIndexes();
  winston.verbose("requester syncIndexes")
}

module.exports = requester;
