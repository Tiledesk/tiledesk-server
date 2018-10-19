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
  publicKey: {
    type: String,
    select: false
  },
  privateKey: {
    type: String,
    select: false
  },
  jwtSecret: {
    type: String,
    select: false
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
