var Project_user = require("../models/project_user");
var Group = require("../models/group");
var RoleConstants = require("../models/roleConstants");


class RecipientEmailUtil {

    iterateProjectUser(project_users) {
        let arr = [];
        if (project_users && project_users.length>0) {
            project_users.forEach(project_user => {
                if (project_user.id_user && project_user.id_user.email) {
                    // tonew = tonew + project_user.id_user.email + ", ";
                    arr.push(project_user.id_user.email)
                } 
            });
        }
        return arr;
    }

    async process(to, projectid) {
     
      if (to.startsWith('@')) {     //mention
        // console.log("startsWith", to);

        let project_users = await Project_user.find({ id_project: projectid,  role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN]}, status: "active"} ).populate('id_user').exec();

        let tonewArr = this.iterateProjectUser(project_users);

        let tonew = tonewArr.toString();
        // console.log("tonew mention", tonew);  
        return tonew; 
                       


      }
      if (to.indexOf('@')==-1) {   //group
        // console.log("indexOf-1", to);
        let tonewArr = []
        let group = await Group.findOne({name: to, id_project: projectid}).exec();
        if (group) {
            // console.log("group", group);  
            let project_users = await Project_user.find({ id_project: projectid, id_user: { $in : group.members}, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" }).populate('id_user').exec();       
            // console.log("project_users", project_users);  
            tonewArr = this.iterateProjectUser(project_users);
        }
        let tonew = tonewArr.toString();
        // console.log("tonew group", tonew);  
        return tonew; 

      }
    //   console.log("to.indexOf('@')",to.indexOf('@'));
      if (to.indexOf('@')>0) {   //standard email
        // console.log("indexOf>0", to);
        // console.log("tonew standard", to);  
         
        return to;
      }
      
    }
  }
  
  var recipientEmailUtil = new RecipientEmailUtil();

  
  module.exports = recipientEmailUtil;  