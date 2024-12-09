var mongoose = require('mongoose');
// mongoose.set("debug", true);
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Channel = require('../models/channel');
var winston = require('../config/winston');
var RequestConstants = require("../models/requestConstants");
var ChannelConstants = require("../models/channelConstants");

var ProjectUserSchema = require("../models/project_user").schema;
var RequestStatus = require("../models/requestStatus");
var LeadSchema = require("../models/lead").schema; //it's not used but i you run test like (mocha departmentService.js) it throws this not blocking exception: error: error getting requestSchema hasn't been registered for model "lead".
var NoteSchema = require("../models/note").schema;
var TagSchema = require("../models/tag");
var LocationSchema = require("../models/location");
var RequestSnapshotSchema = require("../models/requestSnapshot");

var defaultFullTextLanguage = process.env.DEFAULT_FULLTEXT_INDEX_LANGUAGE || "none";
winston.info("Request defaultFullTextLanguage: "+ defaultFullTextLanguage);

const disableTicketIdSequence = process.env.DISABLE_TICKET_ID_SEQUENCE || false;
winston.info("Request disableTicketIdSequence: "+ disableTicketIdSequence);

// var autoIncrement = require('mongoose-auto-increment');

//https://github.com/Automattic/mongoose/issues/5924
mongoose.plugin(schema => { schema.options.usePushEach = true });

const AutoIncrement = require('mongoose-sequence')(mongoose);



var RequestSchema = new Schema({

  // find duplicate
  /*
  db.getCollection('requests').aggregate( {"$group" : { "_id": "$request_id", "count": { "$sum": 1 } } },
    {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } }, 
    {"$sort": {"count" : -1} },
    {"$project": {"request_id" : "$_id", "_id" : 0} })
*/

  request_id: {
    type: String,
    required: true,
    index: true,
    unique: true        

  },

  // TODO attiva solo condizionalmente per performance
  ticket_id: {
    type: Number,
    // required: true,
    index: true
  },
// The user who is asking for support through a ticket is the requester. For most businesses that use Tiledesk Support, the requester is a customer, but requesters can also be agents in your Tiledesk Support instance.  requester: {
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'project_user',
    required: false, //ENABLEIT,
    // index: true //unused
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
    default: RequestConstants.UNASSIGNED,
    // index: true //unused
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
  
  priority: {
    type: String,
    index: true,
    default: "medium" //translate on client side
  },

  followers: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'project_user' }],

  participantsAgents: {  
    type: Array,
    required: false,
    // index: true, //i think unused
  },
  participantsBots: {  
    type: Array,
    required: false,
    // index: true, //i think unused
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
  // First reply time is the time between ticket creation and the first public comment from an agent, displayed in minutes. Some qualifications include:
  first_response_at: {
    type: Date,
    // index: true // unused
  },

  //timestamp when the agent reply the first time to a visitor
  assigned_at: {
    type: Date,
    // index: true //unused
  },

  // Wait Time (Average and Longest): The average and longest times visitors have been waiting for their chats to be served.
  // Wait time is calculated as duration between the first visitor message in the chat and the first agent message. Wait time will be 0 for agent initiated or trigger initiated chats.
  waiting_time: {
    type: Number,
    // index: true // why?
  },



  //Integer The number of conversation parts in this conversation.

  
  // messages_count: {
  //   type: Number,
  //   default: 0
  // },

  closed_at: { 
    type: Date
  },
  closed_by: { 
    type: String
  },
  duration: {
    type: Number
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
  snapshot: {
    type: RequestSnapshotSchema,
    select: true,
    //index: false,
    // includeIndices: false,
    excludeIndexes: true //testa bene

    // select: false
  }, 


  // all the agents of the project or the department at the request creation time 
  // TODO renameit
  /*
  agents:  {
    type: [ProjectUserSchema],
    select: true
  },
  */
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


  
  channel: { //inbound. Channel used by the requester(visitor or user) to communicate with Tiledesk. If widget-> channel is chat21, if Whatsapp-> channel is Whatsapp, etc..
    type: Channel.schema,
    default: function() {
      return new Channel({name: 'chat21'});
    }
  },
  channelOutbound: { //outbound. Channel used to send the messages generated by the requester and internally (internal bot or info messages)  to the agents. This is chat21. Fare diagramma come foglio
    // CANCELLA: Channel used by the messages generated by the Tiledesk(internal bots or info messages)to communicate to the requester. This is chat21
    type: Channel.schema,
    default: function() {
      return new Channel({name: 'chat21'});
    }
  },

  attributes: {
    type: Object,
    required: false
  },
  location: LocationSchema,
  auto_close: {
    type: Number,
    index: true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  smartAssignment: {
    type: Boolean,
    default: function() {
      // winston.info("smartAssignment default this.channel.name:" + this.channel.name);
      if (this.channel && (this.channel.name===ChannelConstants.FORM || this.channel.name===ChannelConstants.EMAIL )) {
        // winston.info("smartAssignment default return false");
        return false;
      }else {
        // winston.info("smartAssignment default return true");
        return true;
      }
    },
    index: true
  },
  workingStatus: { //new, pending, open
    type: String,
    required: false,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  draft: {
    type: Boolean,
    required: false,
    index: true
  }

}, {
  timestamps: true,
  toObject: { virtuals: true }, //IMPORTANT FOR trigger used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}

);

if (!disableTicketIdSequence) {
  winston.info("AutoIncrement plugin enabled");
  RequestSchema.plugin(AutoIncrement, {id: 'ticket_seq', inc_field: 'ticket_id', reference_fields: ['id_project'], disable_hooks:false });
}



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
 /* CAMBIA TRIGGER PRIMA DI PUBBLICARE
 RequestSchema.virtual('availableAgentsCount').get(function () {
  // if (this.agents && this.agents.length>0  // I uncomment  winston.debug("project_user", project_user); of the requestNotification.js row 252 this.agents doesn't have .filter method??
  //   // &&  this.agents.filter
  //   ) {

    var project_users_available = this.snapshot.agents.filter(function (projectUser) {
      // var project_users_available = this.agents.filter(function (projectUser) {
      if (projectUser.user_available == true) {
        return true;
      }
    });
    // ATTENTION DO NOT PRINT INTO A VIRTUAL 
    // winston.debug('++ AVAILABLE PROJECT USERS count ', project_users_available)

    // if (project_users_available && project_users_available.length>0){
      return project_users_available.length;
    // }else {
    //   return 0;
    // }
  // } else {
  //   return 0;  
  // }

});
*/

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
      // botprefix
      if (participant.indexOf("bot_")> -1) {
        // botprefix
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
RequestSchema.index({ id_project: 1, request_id: 1 }
  // , { unique: true }
  ); // query for websocket

// https://docs.mongodb.com/manual/core/index-text/
// https://docs.mongodb.com/manual/tutorial/specify-language-for-text-index/
// https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages

//TODO cambiare dummy con language? attento che il codice deve essere compatibile


RequestSchema.index({transcript: 'text', rating_message: 'text', subject: 'text', "tags.tag": 'text', "notes.text": 'text', "snapshot.lead.email": 'text', "snapshot.lead.fullname": 'text' },  
 {"name":"request_fulltext","default_language": defaultFullTextLanguage,"language_override": "dummy"}); // schema level

//  let query = {id_project: operatorSelectedEvent.id_project, participants: { $exists: true, $ne: [] }};
RequestSchema.index({ id_project: 1, participants: 1}); 

//  https://docs.mongodb.com/manual/core/index-compound/ The order of the fields listed in a compound index is important. The index will contain references to documents sorted first by the values of the item field and, within each value of the item field, sorted by values of the stock field. See Sort Order for more information
RequestSchema.index({ id_project: 1, status: 1, updatedAt: -1 }); // query for websocket
RequestSchema.index({ id_project: 1, status: 1, preflight:1, updatedAt: -1 }); // query for websocket
RequestSchema.index({ id_project: 1, preflight:1, updatedAt: -1 }); // used query ws (topic.endsWith('/requests'))

RequestSchema.index({ hasBot: 1, createdAt: 1 }); // suggested by atlas


// suggested by atlas
RequestSchema.index({ lead: 1, id_project: 1, participants: 1, preflight: 1, createdAt: -1 });
// suggested by atlas
RequestSchema.index({ lead: 1, id_project: 1, preflight: 1, createdAt: -1 });

// suggested by atlas
RequestSchema.index({ lead: 1, "snapshot.agents.id_user": 1, id_project: 1, preflight: 1, createdAt: -1 });


// suggested by atlas
RequestSchema.index({ id_project: 1, ticket_id: 1 });

// suggested by atlas
RequestSchema.index({ id_project: 1, createdAt: 1, preflight: 1});

//suggested by atlas profiler. Used by auto closing requests
RequestSchema.index({ hasBot: 1, status: 1, createdAt: 1});

// suggested by atlas
RequestSchema.index({ "channel.name": 1, id_project: 1, preflight: 1, "snapshot.requester.uuid_user": 1, createdAt: - 1, status: 1 })
RequestSchema.index({ id_project: 1, preflight: 1, "snapshot.agents.id_user": 1, updatedAt: -1, draft: 1, status: 1 })
RequestSchema.index({ id_project: 1, participants: 1, preflight: 1, updatedAt: -1, draft: 1, status: 1 })
RequestSchema.index({ id_project: 1, preflight: 1, updatedAt: -1, draft: 1, status: 1 })
RequestSchema.index({ id_project: 1, preflight: 1, "snapshot.requester.uuid_user": 1, createdAt: -1, status: 1 })
RequestSchema.index({ department: 1, id_project: 1, participants: 1, preflight: 1, createdAt: -1, status: 1 })
RequestSchema.index({ id_project: 1, preflight: 1, createdAt: -1, status: 1 });
RequestSchema.index({ id_project: 1, preflight: 1, createdAt: 1 })
RequestSchema.index({ participants: 1, id_project: 1, createdAt: -1, status: 1 })
RequestSchema.index({ id_project: 1, "snapshot.lead.email": 1, createdAt: -1, status: 1 })
RequestSchema.index({ id_project: 1, createdAt: -1, status: 1 })

// ERROR DURING DEPLOY OF 2.10.27
//RequestSchema.index({ id_project: 1, participants: 1, "snapshot.agents.id_user": 1, createdAt: -1, status: 1 })

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
