var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');


var RequestStatusSchema = new Schema({ 
  closed : {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  preflight : {
    type: Boolean,
    required: true,
    default: false,
    index: true
  }
});


module.exports = RequestStatusSchema;
