var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ProjectUserSchema = require("../models/project_user").schema;
var MessageSchema = require("../models/message").schema;





var RequestSchema = new Schema({
  request_id: {
    type: String,
    required: false
  },
  requester_id: {
    type: String,
    required: true
  },
  requester_fullname: {
    type: String,
    required: false
  },
  first_text: {
    type: String,
    required: true
  },
  // membersCount: {
  //   type: Number,
  //   required: false,
  //   default:0
  // },
  support_status: {
    type: Number,
    required: false,
    default: 100
  }, 


  participants: {
    type: Array,
    required: false
  },

  departmentid: {
    type: Schema.Types.ObjectId,
    ref: 'department'
    // required: true
  },



  first_message: MessageSchema,
  
  //rating
  rating: {
    type: Number,
    required: false,
  },
  rating_message: {
    type: String,
    required: false,
  }, 


  // all the agents of the project or the department at the request time 
  agents: [ProjectUserSchema],
  
  // all the available agents of the project or the department at the request time
  available_agents: [ProjectUserSchema],

  assigned_operator_id: {
    type: Schema.Types.ObjectId,
    ref: 'user'
    // required: true
  },


  // others
  sourcePage: {
    type: String,
    required: false
  },
  language: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },




  id_project: {
    type: String,
    required: true
  },

  createdBy: {
    type: String,
    required: true
  },

},{
  timestamps: true
}
);

RequestSchema.statics.filterAvailableOperators = function filterAvailableOperators(project_users) {
  var project_users_available = project_users.filter(function (projectUser) {
    if (projectUser.user_available == true) {

      return true;
    }

  });
  console.log('++ AVAILABLE PROJECT USERS ', project_users_available)

  return project_users_available;
}

RequestSchema.index({ createdAt: 1, type: -1 }); // schema level
RequestSchema.index({ id_project: 1, type: -1 }); // schema level


module.exports = mongoose.model('request', RequestSchema);
