var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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

module.exports = mongoose.model('requester', RequesterSchema);;
