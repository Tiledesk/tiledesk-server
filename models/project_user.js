'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var Department = require("../models/department");
var winston = require('../config/winston');



  var Project_userSchema = new Schema({
    id_project: {
      type: Schema.Types.ObjectId,
      ref: 'project',
      index: true
      // required: true
    },
    id_user: {      
      type: Schema.Types.ObjectId,
      ref: 'user',
      index: true
    },
    uuid_user: {
      type: String,
      index: true
      // required: true
    },
    role: {
      type: String,
      index: true
      // required: true
    },
    user_available: {
      type: Boolean,
      default: true,
      index: true
      // required: true
    },
    attributes: {
      type: Object,
    },
    max_served_chat: {
      type: Number,
    },
    number_assigned_requests: {
      type: Number,
      default:0,
      index: true
    },
    last_ip: {
        type: String,
    },
    createdBy: {
      type: String,
      required: true
    }
  }, {
      timestamps: true,
      toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
    }
  );

 
  Project_userSchema.virtual('events', {
    ref: 'event', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'project_user', // is equal to `foreignField`
    justOne: false,
    // options: { getters: true }
    options: { sort: { createdAt: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

// Project_userSchema.statics.busy = function(project_max_served_chat) {

//   var maxServedChat=undefined;
//   if (project_max_served_chat && project_max_served_chat> -1) {
//     maxServedChat = project_max_served_chat;
//   }

//   if (this.max_served_chat && this.max_served_chat>-1 && this.max_served_chat > maxServedChat) {
//     maxServedChat = this.max_served_chat;
//   }

//   winston.info("maxServedChat: "+maxServedChat);

//   if (maxServedChat && this.number_assigned_requests >= maxServedChat) {
//     return true;
//   }else {
//     return false;
//   }
// }



// Project_userSchema.virtual('numRequests', {
//   ref: 'request', // The model to use
//   localField: 'id_user', // Find people where `localField`
//   foreignField: 'participants', // is equal to `foreignField`
//   count: true // And only get the number of docs
// });

  // Project_userSchema.methods = {
  //     toStringTest : function() {
  //     return role;
  //     }
  // };

  // Project_userSchema.statics = {
  //   getSchema : function () {
  //     return Project_userSchema;
  //     },
  //       findByProjectId : function (projectid, callback) {
  //       projectUserModel.find({ id_project: projectid }, callback);
  //       },
  //     findByDepartmentAndProjectId : function (departmentId, projectid, callback) {
  //       let query = { _id: departmentId, id_project: projectid };
  //       winston.debug("query", query);

  //       Department.findOne(query, function (err, department) {
  //         winston.debug("department", department);

  //         if (!department){
  //           winston.debug("no dep", department);
  //         }

  //         if (department.id_group) {

  //           Group.findOne({ _id: department.id_group }, function (err, group) {
  //             if (err) {
  //               winston.debug('-- > Error getting group', err)
  //               return next(err);
  //             }
  //             if (group) {
  //               winston.debug('group: ', group);
  //               winston.debug('group.members: ', group.members);
  //               this.find({ id_project: projectid, id_user: group.members }, callback);
  //             }else {
  //               this.findByProjectId( projectid, callback);
  //             }
        
  //         });
  //       }else {
  //         // var projectUserModel = mongoose.model('project_user', Project_userSchema);

  //         winston.debug("this", this);
  //         this.find({}, callback);
  //       }
  //     });
  //     }
  // };

  // Project_userSchema.index({ id_project: 1, uuid_user: 1 }, { unique: true }); 



  // var query = { id_project: req.params.projectid, id_user: req.user._id};
  // if (req.user.sub && (req.user.sub=="userexternal" || req.user.sub=="guest")) {
  //   query = { id_project: req.params.projectid, uuid_user: req.user._id};
  // }
  Project_userSchema.index({ id_project: 1, id_user: 1 }); 
  Project_userSchema.index({ id_project: 1, uuid_user: 1 }); 
  
  // Project_user.find({ id_project: projectid, role: { $in : role }
  Project_userSchema.index({ id_project: 1, role: 1 }); 
  // Project_user.find({ id_project: projectid, id_user: { $in : group[0].members}, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]} })
  Project_userSchema.index({ id_project: 1, id_user:1, role: 1 }); 

  module.exports = mongoose.model('project_user', Project_userSchema);;

