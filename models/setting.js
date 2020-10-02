var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var config = require('../config/database');

var pjson = require('../package.json');
// console.log(pjson.version);

var SettingSchema = new Schema({
  
  identifier: {
    type: String,
    unique: true,//remove unique on db
    required: true,
    default: "1",
    index: true
  },  
  databaseSchemaVersion: {
    type: Number,
    required: true,
    default: config.schemaVersion
  }, 
  installationVersion: {
    type: String,
    required: false,
    default: pjson.version
  }
}
,{
  timestamps: true
}
);



var setting =  mongoose.model('Setting', SettingSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  setting.syncIndexes();
  winston.info("setting syncIndexes")
}


module.exports = setting;
