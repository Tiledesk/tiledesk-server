
class ProjectUserUtil {

    isBusy(project_user, project_max_assigned_chat) {
       
        // console.log("project",project);
        // var project_max_assigned_chat  = project && project.settings && project.settings.max_agent_assigned_chat;
        // var project_max_assigned_chat  = 0;

        var maxAssignedChat=undefined;
        // console.log("project_max_assigned_chat:", project_max_assigned_chat);
        if (project_max_assigned_chat == undefined) {
            return false;
        }

        if (project_max_assigned_chat!=undefined && project_max_assigned_chat> -1) {
            maxAssignedChat = project_max_assigned_chat;
        }

        if (project_user.max_assigned_chat!=undefined && project_user.max_assigned_chat>-1 && project_user.max_assigned_chat > maxAssignedChat) {
            maxAssignedChat = project_user.max_assigned_chat;
        }

        // console.log("maxAssignedChat: "+maxAssignedChat);
        // console.log("project_user.id: "+project_user.id);
        // console.log("project_user.number_assigned_requests: "+project_user.number_assigned_requests);

        if (maxAssignedChat!=undefined && project_user.number_assigned_requests >= maxAssignedChat) {
            return true;
        }else {
            return false;
        }
    }

}

 var projectUserUtil = new ProjectUserUtil();

 module.exports = projectUserUtil;
 