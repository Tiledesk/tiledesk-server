var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var RoleSchema = new Schema({
  name: { 
    type: String,
    required: true,
    index:true
  },
  permissions: [String],
//   permissions: {
//     type: String,
//     required: true
// },
  id_project: {
    type: String,
    required: true,
    index: true
  },

});
var role = mongoose.model('role', RoleSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  role.syncIndexes();
  winston.verbose("role syncIndexes")
}

module.exports = role;
