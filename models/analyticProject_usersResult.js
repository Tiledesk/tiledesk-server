var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var AnalyticProject_UsersResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'project_users' }
);

var analyticProject_UsersResult= mongoose.model('analyticProject_UsersResult', AnalyticProject_UsersResultSchema);



module.exports = analyticProject_UsersResult;
