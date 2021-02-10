var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var ProjectUserSchema = require("../models/project_user").schema;
var DepartmentSchema = require("../models/department").schema;
var LeadSchema = require("../models/lead").schema;

var RequestSnapshotSchema = new Schema({
  
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
    select: true
  },
  // participatingAgents
  // availableAgentsCount
  // participatingBots
},{ _id : false }
);


module.exports = RequestSnapshotSchema;
