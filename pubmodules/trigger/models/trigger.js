let mongoose = require('mongoose');
let Schema = mongoose.Schema;
// let TriggerEventSchema = require('./triggerEvent').schema;

// let ConditionSchema = require('./triggerCondition').schema;
// let ActionSchema = require('./triggerAction').schema;



let TriggerConditionSchema = new Schema({
  key: { //ex: request.firsttext
    type: String,
    required: true
  },
  fact: { //ex: request.firsttext
    type: String,
    required: true
  },
  path: { 
    type: String,
    required: false
  },
  operator: { //use ref to OperatorSchema
    type: String,
    required: true
  },
  // type: { unused
  //   type: String,
  //   required: false
  // },
  value: {
    type: Object,
    required: true
  },
},{ _id : false });


let ConditionsSchema = new Schema({
  all: [TriggerConditionSchema],
  any: [TriggerConditionSchema]
});




let ActionSchema = new Schema({
  key: { //ex: message.send
      type: String,
      required: true,
      index:true
    },
  parameters: {
      type: Object,
      required: false
  },
  // name: {
  //   type: String,
  //   required: true
  // },
  // description: {
  //   type: String,
  //   required: false
  // },

  script: {  //use ref
    type: String,
    required: false
  },
});




let TriggerEventSchema = new Schema({
  key: { //ex: request.create
    type: String,
    required: true,
    index:true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
});



let TriggerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  delay:  {
    type: Number,
    select: true
  },
  // triggers: [TriggerSchema],
  trigger: TriggerEventSchema,
  conditions: ConditionsSchema,
  actions: [ActionSchema],
  enabled: {
    type:Boolean,
    required:true,
    default:false,
    index:true
  },
  id_project: {
    type: String,
    required: true,
    index:true
  },
  code: {
    type: String,
    select: true
  },
  type: {
    type: String, //internal per new_conversation e invite bot
    select: true
  },
  version: {
    type: Number,
    select: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);


// let query = {id_project: event.id_project, enabled:true, 'trigger.key':eventKey};
TriggerSchema.index({ id_project: 1, "trigger.key":1, enabled:1 }); 

module.exports = mongoose.model('trigger', TriggerSchema);
