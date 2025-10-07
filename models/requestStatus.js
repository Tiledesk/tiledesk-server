let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');


let RequestStatusSchema = new Schema({ 
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
