var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var aclConstants = require('../models/aclConstants');

const DEFAULT_ACL_PERMISSIONS = process.env.DEFAULT_ACL_PERMISSIONS;
winston.info("Default ACL permissions is " + DEFAULT_ACL_PERMISSIONS);

var defaultUserPermission = aclConstants.ACL_PERMISSION.READ_WRIITE_DELETE;

if (DEFAULT_ACL_PERMISSIONS && DEFAULT_ACL_PERMISSIONS.length>2) {
  defaultUserPermission = parseInt(DEFAULT_ACL_PERMISSIONS.substring(0,3));
}
winston.info("Default ACL user permissions is " + defaultUserPermission);

var defaultGroupPermission = aclConstants.ACL_PERMISSION.READ_WRIITE_DELETE;

if (DEFAULT_ACL_PERMISSIONS && DEFAULT_ACL_PERMISSIONS.length>4) {
  defaultGroupPermission = parseInt(DEFAULT_ACL_PERMISSIONS.substring(3,6));
}
winston.info("Default ACL group permissions is " + defaultGroupPermission);


var defaultOtherPermission = aclConstants.ACL_PERMISSION.NOTHING;

if (DEFAULT_ACL_PERMISSIONS && DEFAULT_ACL_PERMISSIONS.length>7) {
  defaultOtherPermission = parseInt(DEFAULT_ACL_PERMISSIONS.substring(6,9));
}
winston.info("Default ACL other permissions is " + defaultOtherPermission);


var AclSchema = new Schema({
  
  user: {
    type: Number,
    required: true,
    index: false,
    default: defaultUserPermission
  },  
  group: {
    type: Number,
    required: true,
    index: false,
    default: defaultGroupPermission
  },  
  other: {
    type: Number,
    required: true,
    index: false,
    default: defaultOtherPermission
  }
}, { _id : false });


// User (or user owner)
// Group (or owner group)
// Other (everyone else)




module.exports = AclSchema;
