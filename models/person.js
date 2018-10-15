var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//not in use
var PersonSchema = new Schema({
  firstname: {
    type: String,
    // required: true
  },
  lastname: {
    type: String,
    // required: true
  },
  userid: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('person', PersonSchema);
