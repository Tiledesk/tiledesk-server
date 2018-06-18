var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  _id: Schema.Types.ObjectId,

  name: {
    type: String,
    required: true
  },
  activeOperatingHours: {
    type: Boolean,
  },
  operatingHours: {
    type: Object,
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('project', ProjectSchema);
