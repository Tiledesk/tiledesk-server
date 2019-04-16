var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProfileSchema = new Schema({
  name: {
    type: String,
    default: 'free',
    index: true
  },
  trialDays: {
    type: Number,
    default: 30
  },
}
,{ _id : false });

module.exports = mongoose.model('profile', ProfileSchema);
