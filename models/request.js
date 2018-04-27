var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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
  // recipient: {
  //   type: String,
  //   required: true
  // },
  // recipientFullname: {
  //   type: String,
  //   required: false
  // },
  
  // type: {
  //   type: String,
  //   required: false
  // },

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
  departmentId: {
    type: String,
    required: false
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
  }
},{
  timestamps: true
}
);

module.exports = mongoose.model('request', RequestSchema);
