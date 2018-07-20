'use strict';

var Project_user = require("../models/project_user");

var Department = require("../models/department");
var Group = require("../models/group");

module.exports.findByDepartmentAndProjectId = function (departmentId, projectid, callback) {
  let query = { _id: departmentId, id_project: projectid };
  console.log("query", query);

  Department.findOne(query, function (err, department) {
    console.log("department", department);

    if (!department) {
      console.log("no dep", department);
    }

    if (department.id_group) {
      console.log("department with group");

      Group.findOne({ _id: department.id_group }, function (err, group) {
        if (err) {
          console.log('-- > Error getting group', err)
          return next(err);
        }
        if (group) {
          console.log('group: ', group);
          console.log('group.members: ', group.members);
          Project_user.find({ id_project: projectid, id_user: group.members }, callback);
        } else {
          Project_user.findByProjectId(projectid, callback);
        }

      });
    } else {
      console.log("department with no group");
      console.log("this", this);
      Project_user.find({ id_project: projectid }, function (err, project_users) {

      });
    }
  });
}
