let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');
let ProjectUserSchema = require("../models/project_user").schema;
let DepartmentSchema = require("../models/department").schema;
let LeadSchema = require("../models/lead").schema;

let RequestSnapshotSchema = new Schema({
  
  requester: {
    type: ProjectUserSchema,  
  },
  lead: {
    type: LeadSchema,    
  },
  department: {
    type: DepartmentSchema,       
  },
  agents:  {
    type: [ProjectUserSchema],
    // select: true
    select: false
  },
  // participatingAgents
  availableAgentsCount: {
    type: Number,
    index:true
  }
  // participatingBots
},{ _id : false }
);


module.exports = RequestSnapshotSchema;
