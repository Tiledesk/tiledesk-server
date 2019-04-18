var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ConditionSchema = new Schema({
  fact: { //ex: request.firsttext
    type: String,
    required: true
  },
  operator: { //use ref to OperatorSchema
    type: String,
    required: true
  },
  value: {
    type: Object,
    required: true
  },
});
// var ScripConditionSchema = ConditionSchema.discriminator('script',
//   new mongoose.Schema({script: String}));

module.exports = mongoose.model('triggerCondition', ConditionSchema);
