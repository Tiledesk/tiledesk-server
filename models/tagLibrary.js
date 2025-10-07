let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let TagSchema = require('./tag');



let TagLibrarySchema = new Schema({
  ...TagSchema.obj,
  // tag: {
  //   type: String,
  //   required: true,
  //   index: true
  // },  
  // color: {
  //   type: String,
  //   required: false,
  //   index: false
  // },  
  // attributes: {
  //   type: Object,
  // },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);

TagLibrarySchema.index({ id_project: 1, tag: 1 }, { unique: true }); 


 let Tag = mongoose.model('tag', TagLibrarySchema);


module.exports = Tag;
