var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ProjectUserSchema = require("../models/project_user").schema;
// var ProjectUserSchema = require("../models/project_user");


// var newRequest = {};
// newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
// newRequest.requester_id = message.sender;
// newRequest.requester_fullname = message.sender_fullname;
// newRequest.first_text = message.text;
// newRequest.members = group_members;
// newRequest.membersCount = Object.keys(group_members).length;
// newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
// newRequest.app_id = app_id;





var RequestSchema = new Schema({
  requester_id: {
    type: String,
    required: true
  },
  requester_fullname: {
    type: String,
    required: true
  },
  first_text: {
    type: String,
    required: true
  },
  members: {
    type: Object,
    required: false
  },
  membersCount: {
    type: Number,
    required: false,
    default:0
  },
  support_status: {
    type: String,
    required: true,
    default: 0
  }, 


  sender: {
    type: String,
    required: false
  },
  senderFullname: {
    type: String,
    required: false
  },
  recipient: {
    type: String,
    required: false
  },
  recipientFullname: {
    type: String,
    required: false
  },


  id_project: {
    type: String,
    required: true
  },
  id_app: {
    type: String,
    required: true,
    default:"default"
  },
  userAgent: {
    type: String,
    required: false
  },

  departmentid: {
    type: Schema.Types.ObjectId,
    ref: 'department'
    // required: true
  },
  departmentName: {
    type: String,
    required: false
  },
  sourcePage: {
    type: String,
    required: false
  },
  language: {
    type: String,
    required: false
  },
  createdBy: {
    type: String,
    required: true
  },

  
  rating: {
    type: Number,
    required: false,
  },
  rating_message: {
    type: String,
    required: false,
  }, 


  // agents: [{ type: [Project_user], required: false }],
  agents: [ProjectUserSchema],
  
  available_agents: [ProjectUserSchema],

  assigned_operator_id: {
    type: Schema.Types.ObjectId,
    ref: 'user'
    // required: true
  },

  // available_agents: [{ type: [Project_user], required: true }]
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

module.exports = mongoose.model('request', RequestSchema);
