var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var GroupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: Array, "default": []
    // required: true
  },
  id_project: {
    type: String,
    // required: true
  },
  trashed: {
    type: Boolean,
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

// var Group = mongoose.model('Group', GroupSchema);

// GroupSchema.statics.findByProjectId = function (projectId, callback) {
//   group.find({ "id_project": projectId, trashed: false }, function (err, groups) {
//     console.log('GROUP MODEL - FIND BY PROJECT ID - ERR ', err)
//     callback(err, groups);
//   });
// };

module.exports = mongoose.model('group', GroupSchema);

// GroupSchema.statics.findByProjectId = function (projectId, callback) {
//   group.find({ "id_project": projectId, trashed: false }, function (err, groups) {
//     console.log('GROUP MODEL - FIND BY PROJECT ID - ERR ', err)
//     callback(err, groups);
//   });
// };

// RETURN ONLY THE GROUP WITH TRASHED = FALSE
// GroupSchema.statics.findByProjectId = function (projectId, callback) {
//   console.log('-1')
//   console.log('GROUP MODEL - FIND BY PROJECT ID');

//   GroupSchema.find({ "id_project": projectId, trashed: false }, function (err, groups) {
//     console.log('-3');
    
//     callback(err, groups);
//   });
// };
