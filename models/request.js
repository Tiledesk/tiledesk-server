var mongoose = require('mongoose');
// mongoose.set("debug", true);
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Channel = require('../models/channel');
var ObjectId = require('mongoose').Types.ObjectId;
var winston = require('../config/winston');

var ProjectUserSchema = require("../models/project_user").schema;
var NoteSchema = require("../models/note").schema;
// var Requester = require('../models/requester');

// var MessageSchema = require("../models/message").schema;

//https://github.com/Automattic/mongoose/issues/5924
mongoose.plugin(schema => { schema.options.usePushEach = true });


// var diffHistory = require('mongoose-diff-history/diffHistory');


var RequestSchema = new Schema({

  request_id: {
    type: String,
    required: false,
    index: true
  },

  requester: {
    type: Schema.Types.ObjectId,
    ref: 'project_user',
    required: false, //ENABLEIT,
    index: true
  },

  // requester: {
  //   type: Schema.Types.ObjectId,
  //   // required: true,
  //   required: false,
  //   // Instead of a hardcoded model name in `ref`, `refPath` means Mongoose
  //   // will look at the `onModel` property to find the right model.
  //   refPath: 'requesterModel'
  // },
  // requesterModel: {
  //   type: String,
  //   // required: true,
  //   required: false,

  //   default: 'lead',
  //   enum: ['user', 'lead']
  // },



  // requester: {
  //   type: Requester.schema,
  //   required: true,
  //   // default: function() {
  //   //   return new Requester({name: 'chat21'});
  //   // }
  // },



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
    default: 100,
    index: true
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
    // set: function(v) {
    //   console.log("sdsadsadsadsadsadasda", v)
    //   // console.log("sdsadsadsadsadsadasda2", this)
    //   this.participantsAgents = [];
    //   this.participantsBots = [];
    //   if (v) {
    //     v.forEach(participant =>  { 
    //       console.log("sdsadsadsadsadsadasda participant ", participant)     
    //       if (participant.indexOf("bot_")== -1) {
    //         this.participantsAgents.push(participant);
    //         console.log("sdsadsadsadsadsadasda participant2 ", participant) 
    //       }else {
    //         this.participantsBots.push(participant);
    //       }
    //     });  
    //   }
    //   console.log("sdsadsadsadsadsadasda return ", v)
    //   return v;
    // }
  },

  department: {
    type: Schema.Types.ObjectId,
    ref: 'department',
    index: true
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
  //TODO delete this
  messages_count: {
    type: Number,
    default: 0
  },

  closed_at: {
    type: Date
  },

  //tags List A list of tags associated with the conversation.
  tags: {
    type: Array,
    required: false
  },
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
  // renameit
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
    required: true,
    index: true
  },

  createdBy: {
    type: String,
    required: true
  },

},{
  timestamps: true,
  toObject: { virtuals: true }, //IMPORTANT FOR trigger used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}
);

// // https://mongoosejs.com/docs/api.html#query_Query-populate
// RequestSchema.virtual('lead', {
//   ref: 'lead', // The model to use
//   localField: 'requester_id', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//   justOne: true,
//   // options: { getters: true }
//   //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
// });


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
  // localField: 'participants', // Find people where `localField`
  // localField: 'participantsAgents',
  localField: function() {
    this.participantsAgents = [];
    // console.log("this",this);
    // console.log("this.participants",this.participants);
    // console.log("this._id",this._id);
    if (this.participants && this.participants.length>0) {
      this.participants.forEach(participant => {      
        // console.log("participant",participant);
        // console.log(" typeof participant", typeof participant);
        
        //if (participant && participant.indexOf != undefined && participant.indexOf("bot_")== -1) {
          if (participant.indexOf("bot_") === -1) {
            // console.log("participant added",participant);
            this.participantsAgents.push(participant);
            // console.log("this.participantsAgents",this.participantsAgents);
          }
      });     
    }
    // console.log("participantsAgents",this);
    return "participantsAgents";
  
  },
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


// TODO not used
// RequestSchema.virtual('assignedOperatorId').get(function () {
//   if (this.participants && this.participants.lenght>0) {
//     return this.participants[0];
//   }else {
//     return null;
//   }
// });


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

// TODO FIND BOT
// RequestSchema.methods.findParticipantsObj = function(cb) {
//   return new Promise(function (resolve, reject) {
//     return Promise.all([mongoose.model('user').find({_id: { $in : this.participants } }), mongoose.model('faq_kb').find({_id: { $in : this.participants } })]).then(function(results){
//       return resolve(results);
//     });
//   });
// };


/*
TODO UNCOMMET
// RequestSchema.virtual('participatingBots').get(function () {
//   return mongoose.model('faq_kb').find({_id: { $in : this.getBotId() } });
// });



*/

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
  // localField: "participantsBots",
  localField: function() {
    this.participantsBots = [];
    if (this.participants && this.participants.length>0) {
      this.participants.forEach(participant => {      
        if (participant.indexOf("bot_")> -1) {
          this.participantsBots.push(participant.replace("bot_",""));
        }
      });      
    }
    return "participantsBots";
  },
  foreignField: '_id', // is equal to `foreignField`
  justOne: false,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

/*
// RequestSchema.methods.getBot = function(cb) {
//   return mongoose.model('faq_kb').find({_id: { $in : this.getBotId() } });
// };
*/

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


RequestSchema.index({ createdAt: 1, type: -1 }); // schema level
RequestSchema.index({ id_project: 1, type: -1 }); // schema level
// https://stackoverflow.com/questions/27179664/error-when-using-a-text-index-on-mongodb/27180032

// RequestSchema.index({ requester_fullname: 'text', transcript: 'text', rating_message: 'text'},
RequestSchema.index({transcript: 'text', rating_message: 'text'},
 {"name":"fulltext","default_language": "italian","language_override": "dummy"}); // schema level


 RequestSchema.index({ id_project: 1, status: 1, updatedAt: 1 }); // query for websocket

 //
//RequestSchema.index({name: 'transcript_fulltext', 'transcript': 'text'},);

// RequestSchema.plugin(diffHistory.plugin);

var request =  mongoose.model('request', RequestSchema);
if (process.env.MONGOOSE_SYNCINDEX) {
  request.syncIndexes();
  winston.info("message syncIndexes")

}

module.exports =request
