var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var GroupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: Array, "default": [],
    index: true
    // required: true
  },
  id_project: {
    type: String,
    index: true
    // required: true
  },
  trashed: {
    type: Boolean,
    index: true
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
//     winston.debug('GROUP MODEL - FIND BY PROJECT ID - ERR ', err)
//     callback(err, groups);
//   });
// };

module.exports = mongoose.model('group', GroupSchema);

// GroupSchema.statics.findByProjectId = function (projectId, callback) {
//   group.find({ "id_project": projectId, trashed: false }, function (err, groups) {
//     winston.debug('GROUP MODEL - FIND BY PROJECT ID - ERR ', err)
//     callback(err, groups);
//   });
// };

// RETURN ONLY THE GROUP WITH TRASHED = FALSE
// GroupSchema.statics.findByProjectId = function (projectId, callback) {
//   winston.debug('-1')
//   winston.debug('GROUP MODEL - FIND BY PROJECT ID');

//   GroupSchema.find({ "id_project": projectId, trashed: false }, function (err, groups) {
//     winston.debug('-3');
    
//     callback(err, groups);
//   });
// };
