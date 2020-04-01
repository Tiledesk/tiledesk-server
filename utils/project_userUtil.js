
class ProjectUserUtil {

    isBusy(project_user, project_max_served_chat) {
       
        // console.log("project",project);
        // var project_max_served_chat  = project && project.settings && project.settings.max_agent_served_chat;
        // var project_max_served_chat  = 0;

        var maxServedChat=undefined;
        console.log("project_max_served_chat:", project_max_served_chat);
        if (project_max_served_chat == undefined) {
            return false;
        }

        if (project_max_served_chat!=undefined && project_max_served_chat> -1) {
            maxServedChat = project_max_served_chat;
        }

        if (project_user.max_served_chat!=undefined && project_user.max_served_chat>-1 && project_user.max_served_chat > maxServedChat) {
            maxServedChat = project_user.max_served_chat;
        }

        console.log("maxServedChat: "+maxServedChat);
        console.log("project_user.id: "+project_user.id);
        console.log("project_user.number_assigned_requests: "+project_user.number_assigned_requests);

        if (maxServedChat!=undefined && project_user.number_assigned_requests >= maxServedChat) {
            return true;
        }else {
            return false;
        }
    }

}

 var projectUserUtil = new ProjectUserUtil();

 module.exports = projectUserUtil;
 