var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DepartmentSchema = new Schema({
  // _id: Schema.Types.ObjectId,
  id_bot: {
    type: String,
    // required: true
  },
  routing: {
    type: String,
    default:"pooled"
    // required: true
  },
  name: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true
  },
  default: {
    type: Boolean,
    default:false
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('department', DepartmentSchema);
