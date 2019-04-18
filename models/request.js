var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Channel = require('../models/channel');
var ObjectId = require('mongoose').Types.ObjectId;

var ProjectUserSchema = require("../models/project_user").schema;
// var MessageSchema = require("../models/message").schema;

//https://github.com/Automattic/mongoose/issues/5924
mongoose.plugin(schema => { schema.options.usePushEach = true });



var RequestSchema = new Schema({
  request_id: {
    type: String,
    required: false
  },
  requester_id: {
    type: String,
    required: true,
    index: true,
    // get: v => {
    //   if (ObjectId.isValid(v)){
    //     console.log("ciaoooo ok");
    //     return v;
    //   }else {
    //     console.log("ciaoooo ko");
    //     return null;
    //   }
       
    // }


    // type: Schema.Types.ObjectId,
    // ref: 'lead'
  },
  // requester_fullname: {
  //   type: String,
  //   required: false
  // },
  first_text: {
    type: String,
    required: true
  },
  // membersCount: {
  //   type: Number,
  //   required: false,
  //   default:0
  // },
  status: {
    type: Number,
    required: false,
    default: 100,
    index: true
  }, 


  participants: {
    type: Array,
    required: false
  },

  department: {
    type: Schema.Types.ObjectId,
    ref: 'department'
    // required: true
  },



  // first_message: MessageSchema,
  // messages : [{ type: Schema.Types.ObjectId, ref: 'message' }],

  transcript: {
    type: String
  },

  // Wait Time (Average and Longest): The average and longest times visitors have been waiting for their chats to be served.
  // Wait time is calculated as duration between the first visitor message in the chat and the first agent message. Wait time will be 0 for agent initiated or trigger initiated chats.
  waiting_time: {
    type: Number
  },



  //messages_count Integer The number of conversation parts in this conversation.
  //TODO
  messages_count: {
    type: Number,
    default: 0
  },

  closed_at: {
    type: Date
  },

  //tags List A list of tags associated with the conversation.
//TODO
  tags: {
    type: Array,
    required: false
  },

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
  // available_agents: [ProjectUserSchema],

  // assigned_operator_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'user'
  //   // required: true
  // },


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


  
  channel: {
    type: Channel.schema,
    default: function() {
      return new Channel({name: 'chat21'});
    }
  },

  attributes: {
    type: Object,
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
  timestamps: true,
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}
);

// https://mongoosejs.com/docs/api.html#query_Query-populate
RequestSchema.virtual('lead', {
  ref: 'lead', // The model to use
  localField: 'requester_id', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  justOne: true,
  // options: { getters: true }
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});


RequestSchema.virtual('participantsObj', {
  ref: 'User', // The model to use
  localField: 'participants', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  justOne: false,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});


// RequestSchema.post('find', async function(requests) {
//   // winston.debug("requests", requests);
//   for (let request of requests) {
//     //winston.debug("request", request, "is valid", mongoose.Types.ObjectId.isValid(request.requester_id));
//     if (mongoose.Types.ObjectId.isValid(request.requester_id)){
//       await request.populate('lead').execPopulate();
//     }
//   }
// });

// RequestSchema.post('find',  async function(requests) {
//   //  winston.debug("requestsyyyy", requests);
//   for (let request of requests) {
//     // winston.debug("request find", request,  "request.requester_id", request.requester_id, "is valid", mongoose.Types.ObjectId.isValid(request.requester_id));
//     if (mongoose.Types.ObjectId.isValid(request.requester_id)){
//       await request.populate('lead').execPopulate();
//     }
//   }
// });
// RequestSchema.post('findOne',  async function(request) {
//   //winston.debug("requestXXXXX", request);
 
//     winston.debug("request findOne", request, "request.requester_id", request.requester_id, "is valid", mongoose.Types.ObjectId.isValid(request.requester_id));
//     if (mongoose.Types.ObjectId.isValid(request.requester_id)){
//       await request.populate('lead').execPopulate();
//     }

// });



// // work but no multiple where on id-project
// RequestSchema.virtual('messages', {
//   ref: 'message', // The model to use
//   localField: 'request_id', // Find people where `localField`
//   foreignField: 'recipient', // is equal to `foreignField`
//   // localField: ['request_id', 'id_project'], // Find people where `localField`
//   // foreignField: ['recipient', 'id_project'], // is equal to `foreignField`
//   // If `justOne` is true, 'messages' will be a single doc as opposed to
//   // an array. `justOne` is false by default.
//   justOne: false,
//   //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
// });

RequestSchema.virtual('assignedOperatorId').get(function () {
  if (this.participants && this.participants.lenght>0) {
    return this.participants[0];
  }else {
    return null;
  }
});
// RequestSchema.statics.filterAvailableOperators = function filterAvailableOperators(project_users) {
RequestSchema.virtual('availableAgents').get(function () {
  var project_users_available = this.agents.filter(function (projectUser) {
    if (projectUser.user_available == true) {
      return true;
    }
  });
  winston.debug('++ AVAILABLE PROJECT USERS ', project_users_available)

  if (project_users_available && project_users_available.length>0){
    return project_users_available;
  }else {
    return [];
  }
  
});

RequestSchema.index({ createdAt: 1, type: -1 }); // schema level
RequestSchema.index({ id_project: 1, type: -1 }); // schema level
// https://stackoverflow.com/questions/27179664/error-when-using-a-text-index-on-mongodb/27180032

// RequestSchema.index({ requester_fullname: 'text', transcript: 'text', rating_message: 'text'},
RequestSchema.index({transcript: 'text', rating_message: 'text'},
 {"name":"fulltext","default_language": "italian","language_override": "dummy"}); // schema level


 //
//RequestSchema.index({name: 'transcript_fulltext', 'transcript': 'text'},);

module.exports = mongoose.model('request', RequestSchema);
