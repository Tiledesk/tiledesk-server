let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let NoteSchema = new Schema({
  
  text: {
    type: String,
    required: true,
    index: true
  },    
  attributes: {
    type: Object,
  },
  // id_project: {
  //   type: String,
  //   required: true,
  //   index: true
  // },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

 let Note = mongoose.model('note', NoteSchema);


module.exports = Note;
