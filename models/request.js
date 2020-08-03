var mongoose = require('mongoose');
// mongoose.set("debug", true);
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Channel = require('../models/channel');
var winston = require('../config/winston');
var RequestConstants = require("../models/requestConstants");

var ProjectUserSchema = require("../models/project_user").schema;
var RequestStatus = require("../models/requestStatus");

var NoteSchema = require("../models/note").schema;
var TagSchema = require("../models/tag");

//https://github.com/Automattic/mongoose/issues/5924
mongoose.plugin(schema => { schema.options.usePushEach = true });




var RequestSchema = new Schema({

  request_id: {
    type: String,
    required: true,
    index: true
  },

  requester: {
    type: Schema.Types.ObjectId,
    ref: 'project_user',
    required: false, //ENABLEIT,
    index: true
  },


  // ==== REQUESTER_ID====

  lead: {
    type: Schema.Types.ObjectId,
    ref: 'lead',
    required: false
  },
  // requester_id: { //rename to "lead"  field of type objectid and update mongodb column and data 
  //   type: String,
  //   required: true,
  //   index: true,
  //   // get: v => {
  //   //   if (ObjectId.isValid(v)){
  //   //     console.log("ciaoooo ok");
  //   //     return v;
  //   //   }else {
  //   //     console.log("ciaoooo ko");
  //   //     return null;
  //   //   }
       
  //   // }


  //   // type: Schema.Types.ObjectId,
  //   // ref: 'lead'
  // },

  subject: {
    type: String
  },
  first_text: {
    type: String,
    required: true
  },

  status: {
    type: Number,
    required: false,
    default: RequestConstants.UNSERVED,
    index: true
  }, 


  preflight: {
    type: Boolean,
    default: false,
    index:true
  },

  hasBot: {
    type: Boolean,
    default: false,
    index:true
  },

  // The admin the conversation is currently assigned to.
// Note nobody_admin indicates the conversation is assigned to Nobody.
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'project_user'
  },

  participants: {  //TODO trasformare in objectid di tipo project_user
    type: Array,
    required: false,
    index: true,
  },

  participantsAgents: {  
    type: Array,
    required: false,
    index: true,
  },
  participantsBots: {  
    type: Array,
    required: false,
    index: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'department',
    index: true
    // required: true
  },

  transcript: {
    type: String
  },

  //timestamp when the agent reply the first time to a visitor
  // documenta
  first_response_at: {
    type: Date,
    index: true
  },

  //timestamp when the agent reply the first time to a visitor
  assigned_at: {
    type: Date,
    index: true
  },

  // Wait Time (Average and Longest): The average and longest times visitors have been waiting for their chats to be served.
  // Wait time is calculated as duration between the first visitor message in the chat and the first agent message. Wait time will be 0 for agent initiated or trigger initiated chats.
  waiting_time: {
    type: Number,
    index: true
  },



  //Integer The number of conversation parts in this conversation.

  
  // messages_count: {
  //   type: Number,
  //   default: 0
  // },

  closed_at: {
    type: Date
  },

  tags: [TagSchema],

  notes: [NoteSchema],

  rating: {
    type: Number,
    required: false,
  },
  rating_message: {
    type: String,
    required: false,
  }, 


  // all the agents of the project or the department at the request creation time 
  // TODO renameit
  agents:  {
    type: [ProjectUserSchema],
    select: true
  },
  // TODO select false???  ma serve alla dashboard

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
    required: true,
    index: true
  },

  createdBy: {
    type: String,
    required: true
  },

}, {
  timestamps: true,
  toObject: { virtuals: true }, //IMPORTANT FOR trigger used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}

);


// Backcompatibility
RequestSchema.virtual('requester_id').get(function () {
  if (this.lead) {
    return this.lead._id;
  }else {
    return null;
  }
});


RequestSchema.virtual('participatingAgents', {
  ref: 'user', // The model to use
  localField: 'participantsAgents',
  foreignField: '_id', // is equal to `foreignField`
  justOne: false,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});




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



 // TODO serve????? Nico dice di no. io lo uso solo per trigger fai una cosa + semplice ese hasAvailableAgent = true o false
 RequestSchema.virtual('availableAgentsCount').get(function () {
  var project_users_available = this.agents.filter(function (projectUser) {
    if (projectUser.user_available == true) {
      return true;
    }
  });
  winston.debug('++ AVAILABLE PROJECT USERS count ', project_users_available)

  if (project_users_available && project_users_available.length>0){
    return project_users_available.length;
  }else {
    return 0;
  }

});

// RequestSchema.virtual('availableAgents').get(function () {
//     var project_users_available = this.agents.filter(function (projectUser) {
//       if (projectUser.user_available == true) {
//         return true;
//       }
//     });
//     winston.debug('++ AVAILABLE PROJECT USERS ', project_users_available)

//     if (project_users_available && project_users_available.length>0){
//       return project_users_available;
//     }else {
//       return [];
//     }

// });

// TODO FIND BOT
// RequestSchema.methods.findParticipantsObj = function(cb) {
//   return new Promise(function (resolve, reject) {
//     return Promise.all([mongoose.model('user').find({_id: { $in : this.participants } }), mongoose.model('faq_kb').find({_id: { $in : this.participants } })]).then(function(results){
//       return resolve(results);
//     });
//   });
// };


// RequestSchema.virtual('botid').get(function () {
  
//   if ( this.participants == null) {
//     return null;
// }

// var participants = this.participants;
// winston.debug("participants", participants);

// var botIdTmp;

// if (participants) {
//   participants.forEach(function(participant) { 
//     //winston.debug("participant", participant);
//     // bot_HERE
//     if (participant.indexOf("bot_")> -1) {
//       botIdTmp = participant.replace("bot_","");
//       //winston.debug("botIdTmp", botIdTmp);
//       //break;        
//     }
//   });
//   winston.info("botIdTmp:"+ botIdTmp);
//   return botIdTmp;
// }else {
//   return null;
// }
// });



RequestSchema.virtual('participatingBots', {
  ref: 'faq_kb', // The model to use
  localField: "participantsBots",  
  foreignField: '_id', // is equal to `foreignField`
  justOne: false,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});


RequestSchema.method("getBotId", function () {
      
      
  if ( this.participants == null) {
      return null;
  }

  var participants = this.participants;
  winston.debug("participants", participants);

  var botIdTmp;
  
  if (participants) {
    participants.forEach(function(participant) { 
      //winston.debug("participant", participant);
      // bot_HERE
      if (participant.indexOf("bot_")> -1) {
        botIdTmp = participant.replace("bot_","");
        //winston.debug("botIdTmp", botIdTmp);
        //break;        
      }
    });
  
    return botIdTmp;
  }else {
    return null;
  }

});

// https://docs.mongodb.com/manual/indexes/
// For a single-field index and sort operations, the sort order (i.e. ascending or descending) of the index key does not matter because MongoDB can traverse the index in either direction.
RequestSchema.index({ createdAt: -1 }); // schema level
RequestSchema.index({ updatedAt: -1 }); // schema level
RequestSchema.index({ id_project: 1 }); // schema level
// https://stackoverflow.com/questions/27179664/error-when-using-a-text-index-on-mongodb/27180032
RequestSchema.index({ id_project: 1, request_id: 1 }); // query for websocket

// RequestSchema.index({ requester_fullname: 'text', transcript: 'text', rating_message: 'text'},
RequestSchema.index({transcript: 'text', rating_message: 'text'},
 {"name":"request_fulltext","default_language": "italian","language_override": "dummy"}); // schema level

//  let query = {id_project: operatorSelectedEvent.id_project, participants: { $exists: true, $ne: [] }};
RequestSchema.index({ id_project: 1, participants: 1}); 

//  https://docs.mongodb.com/manual/core/index-compound/ The order of the fields listed in a compound index is important. The index will contain references to documents sorted first by the values of the item field and, within each value of the item field, sorted by values of the stock field. See Sort Order for more information
RequestSchema.index({ id_project: 1, status: 1, updatedAt: -1 }); // query for websocket
RequestSchema.index({ id_project: 1, status: 1, preflight:1, updatedAt: -1 }); // query for websocket

//   cannot index parallel arrays [agents] [participants] {"driv
// RequestSchema.index({ id_project: 1, status: 1, preflight:1, participants:1, "agents.id_user":1, updatedAt: -1 }); //NN LO APPLICA
 
// RequestSchema.index({ id_project: 1, status: 1, preflight:1, agents.id_user:1, updatedAt: -1 }); // query for websocket
// https://docs.mongodb.com/manual/core/index-multikey/#compound-multikey-indexes You cannot create a compound multikey index if more than one to-be-indexed field of a document is an array. For example, consider a collection that contains the following document:


// Attention. https://docs.mongodb.com/manual/core/index-compound/ If you have a collection that has both a compound index and an index on its prefix (e.g. { a: 1, b: 1 } and { a: 1 }), if neither index has a sparse or unique constraint, then you can remove the index on the prefix (e.g. { a: 1 }). MongoDB will use the compound index in all of the situations that it would have used the prefix index.


var request =  mongoose.model('request', RequestSchema);
if (process.env.MONGOOSE_SYNCINDEX) {
  request.syncIndexes();
  winston.info("message syncIndexes")

}

module.exports =request
