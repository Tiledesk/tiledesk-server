var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/database');

var conn      = mongoose.createConnection(process.env.MONGODB_LOGS_URI || config.databaselogs, { "autoIndex": true });

var ReqLogSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  ip: {
    type: String,
    index: true 
  },
  id_project: {
    type: String,
    index: true
    //required: true
  }
}, {
    timestamps: true
  }
);

module.exports = conn.model('reqLog', ReqLogSchema);
