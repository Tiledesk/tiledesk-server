var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Project_userSchema = new Schema({
  // id_project: {
  //   type: String,
  //   // required: true
  // },
  _id: Schema.Types.ObjectId,
  id_project: {
    type: Schema.Types.ObjectId,
    ref: 'project'
    // required: true
  },
  id_user: {
    // type: String,
    // required: true
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  role: {
    type: String,
    // required: true
  },
  user_available: {
    type: Boolean,
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('project_user', Project_userSchema);
