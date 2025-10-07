let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../../config/winston');


let EventSchema = new Schema({
  
  name: { 
    type: String,
    required: true,
    index: true
  },
  attributes: {
    type: Object,
  },
  // TODO FALLO EMBED per performance
  project_user: {
    type: Schema.Types.ObjectId,
    ref: 'project_user',
    index: true,
    required: false
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    default: "stardard",
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

EventSchema.index({ id_project: 1, name: 1, createdAt: -1 });

let event = mongoose.model('event', EventSchema);


module.exports = event;
