var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TriggerSchema = require('../models/trigger').schema;

var ConditionSchema = require('../models/condition').schema;

// https://api-v2.tidio.co/bots/491188?api_token=d4x6li5jziku9fgs7e13q8f5vhygjoy3&project_public_key=rrjhuda3bosuvqthrledugqlwsvbej9m
// {
//   "status":true,
//   "value":{
//      "id":491188,
//      "name":"New automation",
//      "enabled":0,
//      "projectPublicKey":"rrjhuda3bosuvqthrledugqlwsvbej9m",
//      "color":"sapphire",
//      "firstTrigger":"onConversationStart",
//      "template":null,
//      "sandbox":0,
//      "nodes":[
//         {
//            "id":3051706,
//            "dbNodeId":3051706,
//            "type":"onConversationStart",
//            "payload":{
//               "id":3,
//               "x":10219,
//               "y":866.1000061035156,
//               "connections":{
//                  "bottom":[
//                     {
//                        "nodeId":2,
//                        "direction":"from"
//                     }
//                  ]
//               },
//               "display_name":"prova",
//               "disabled":false,
//               "position":0
//            }
//         },
//         {
//            "id":3051707,
//            "dbNodeId":3051707,
//            "type":"sendChatMessagesToVisitor",
//            "payload":{
//               "id":2,
//               "x":10523,
//               "y":996.1000061035156,
//               "connections":{
//                  "top":[
//                     {
//                        "nodeId":4,
//                        "direction":"to"
//                     }
//                  ],
//                  "left":[
//                     {
//                        "nodeId":3,
//                        "direction":"to"
//                     }
//                  ]
//               },
//               "messages":[
//                  {
//                     "content":"ciao bello\n\n",
//                     "type":"text"
//                  }
//               ]
//            }
//         },
//         {
//            "id":3051708,
//            "dbNodeId":3051708,
//            "type":"onRecurringVisitor",
//            "payload":{
//               "id":4,
//               "x":10307,
//               "y":804.1000061035156,
//               "connections":{
//                  "bottom":[
//                     {
//                        "nodeId":2,
//                        "direction":"from"
//                     }
//                  ]
//               },
//               "frequency":"once24"
//            }
//         }
//      ],
//      "edges":[
//         {
//            "from_node_id":3051706,
//            "to_node_id":3051707
//         },
//         {
//            "from_node_id":3051708,
//            "to_node_id":3051707
//         }
//      ]
//   }
// }

// {
//   "id":491188,
//   "name":"New automation",
//   "project_public_key":"rrjhuda3bosuvqthrledugqlwsvbej9m",
//   "enabled":0,
//   "offline_disabled":0,
//   "triggered":0,
//   "first_trigger":"onConversationStart",
//   "color":"sapphire",
//   "template":null,
//   "sandbox":0,
//   "created_at":"2019-04-08 13:33:43",
//   "updated_at":"2019-04-08 13:33:44",
//   "send_messages_during_conversation":0,
//   "triggers":[
//      {
//         "id":3051706,
//         "chat_bot_id":491188,
//         "payload":{
//            "id":3,
//            "x":10219,
//            "y":866.1000061035156,
//            "connections":{
//               "bottom":[
//                  {
//                     "nodeId":2,
//                     "direction":"from"
//                  }
//               ]
//            },
//            "display_name":"prova",
//            "disabled":false,
//            "position":0
//         },
//         "type":"onConversationStart",
//         "created_at":"2019-04-08 13:36:12",
//         "updated_at":"2019-04-08 13:36:12"
//      },
//      {
//         "id":3051708,
//         "chat_bot_id":491188,
//         "payload":{
//            "id":4,
//            "x":10307,
//            "y":804.1000061035156,
//            "connections":{
//               "bottom":[
//                  {
//                     "nodeId":2,
//                     "direction":"from"
//                  }
//               ]
//            },
//            "frequency":"once24"
//         },
//         "type":"onRecurringVisitor",
//         "created_at":"2019-04-08 13:36:12",
//         "updated_at":"2019-04-08 13:36:12"
//      }
//   ],
//   "sendsMessages":true,
//   "usingShopifyIntegration":false
// }





// var TriggerSchema = new Schema({
//   key: { //ex: request.create
//     type: String,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String,
//     required: false
//   },
// });





// var ConditionSchema = new Schema({
//   field: { //ex: request.firsttext
//     type: String,
//     required: true
//   },
//   operator: { //use ref to OperatorSchema
//     type: String,
//     required: true
//   },
//   value: {
//     type: Object,
//     required: true
//   },
// });
// // var ScripConditionSchema = ConditionSchema.discriminator('script',
// //   new mongoose.Schema({script: String}));



var ConditionsSchema = new Schema({
  all: [ConditionSchema],
  any: [ConditionSchema]
});



var ActionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  script: {  //use ref
    type: String,
    required: false
  },
});

var BotSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  // triggers: [TriggerSchema],
  trigger: TriggerSchema,
  contitions: ConditionsSchema,
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
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('bot', BotSchema);
