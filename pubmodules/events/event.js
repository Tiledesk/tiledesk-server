var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../../config/winston');


var EventSchema = new Schema({
  
  name: { 
    type: String,
    required: true,
    index: true
  },
  attributes: {
    type: Object,
  },
  project_user: {
    type: Schema.Types.ObjectId,
    ref: 'project_user',
    index: true,
    required: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  // id_user: {
  //   type: String,
  //   required: true,
  //   index: true
  // },
  createdBy: {
    type: String,
    required: true,
    index: true
  },
},{
  timestamps: true
}
);


var event = mongoose.model('event', EventSchema);


module.exports = event;
