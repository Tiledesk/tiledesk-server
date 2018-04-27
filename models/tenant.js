var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TenantSchema = new Schema({
    name: {
      type: String,
      required: false
    },
    createdBy: {
      type: String,
      required: true
    }
  },
    {
      timestamps: true
    } 
  );

module.exports = mongoose.model('tenant', TenantSchema);
