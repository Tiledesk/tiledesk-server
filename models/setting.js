let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');
let config = require('../config/database');

let pjson = require('../package.json');
// console.log(pjson.version);

let SettingSchema = new Schema({
  
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



let setting =  mongoose.model('Setting', SettingSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  setting.syncIndexes();
  winston.verbose("setting syncIndexes")
}


module.exports = setting;
