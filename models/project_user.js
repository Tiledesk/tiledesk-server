'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var Department = require("../models/department");


// module.exports = function() {


  var Project_userSchema = new Schema({
    // id_project: {
    //   type: String,
    //   // required: true
    // },
    // _id: Schema.Types.ObjectId,
    id_project: {
      type: Schema.Types.ObjectId,
      ref: 'project'
      // required: true
    },
    id_user: {
      // type: String,
      // required: true
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      // required: true
    },
    user_available: {
      type: Boolean,
      // required: true
    },
    createdBy: {
      type: String,
      required: true
    }
  }, {
      timestamps: true
    }
  );

 


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
  //       console.log("query", query);

  //       Department.findOne(query, function (err, department) {
  //         console.log("department", department);

  //         if (!department){
  //           console.log("no dep", department);
  //         }

  //         if (department.id_group) {

  //           Group.findOne({ _id: department.id_group }, function (err, group) {
  //             if (err) {
  //               console.log('-- > Error getting group', err)
  //               return next(err);
  //             }
  //             if (group) {
  //               console.log('group: ', group);
  //               console.log('group.members: ', group.members);
  //               this.find({ id_project: projectid, id_user: group.members }, callback);
  //             }else {
  //               this.findByProjectId( projectid, callback);
  //             }
        
  //         });
  //       }else {
  //         // var projectUserModel = mongoose.model('project_user', Project_userSchema);

  //         console.log("this", this);
  //         this.find({}, callback);
  //       }
  //     });
  //     }
  // };




  // mongoose.model('project_user', Project_userSchema);;

  module.exports = mongoose.model('project_user', Project_userSchema);;
// }
// return mongoose.model('project_user', Project_userSchema);;
