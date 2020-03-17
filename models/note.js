var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var NoteSchema = new Schema({
  
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

 var Note = mongoose.model('note', NoteSchema);


module.exports = Note;
