let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let AnalyticProject_UsersResultSchema = new Schema({
  count: {
    type: Number,
     required: true
  }}, { collection: 'project_users' }
);

let analyticProject_UsersResult= mongoose.model('analyticProject_UsersResult', AnalyticProject_UsersResultSchema);



module.exports = analyticProject_UsersResult;
