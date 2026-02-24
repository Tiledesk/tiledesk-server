var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var GroupMemberSchema = new Schema({
  
  group_id: {
    type: String,
    required: true
  },  
  percentage: {
    type: Number,
    required: true,
  }
}
);


module.exports = GroupMemberSchema;
