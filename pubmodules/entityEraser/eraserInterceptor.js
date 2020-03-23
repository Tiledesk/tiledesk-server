
const authEvent = require('../../event/authEvent');
const projectEvent = require('../../event/projectEvent');
var winston = require('../../config/winston');
var Project = require("../../models/project");
var Project_user = require("../../models/project_user");
var RoleConstants = require("../../models/roleConstants");

class EntityInterceptor {

 


    listen() {

        var that = this;
        winston.info("EntityInterceptor listener start ");
        

        authEvent.on('user.delete',  function(data) {          

            var userid = data.user.id;
            var query = { id_user: userid,  role: { $in : [RoleConstants.OWNER]} } ;

            winston.debug("query: ", query);

                setImmediate(() => {
                    Project_user.find(query).populate('id_user')
                        .exec(function (err, project_users) {
                         if (project_users && project_users.length>0) {
                             project_users.forEach(pu => {                                 
                                 Project.findByIdAndUpdate({_id: pu.id_project}, {status:0}, { new: true, upsert: true }, function (err, project) {
                                    if (err) {
                                      winston.error('Error deleting project ', err);
                                    }
                                    winston.info('Deleted project with id: '+project.id);
                                    projectEvent.emit('project.delete', project );
                                  });
                             });
                         }
                        });
                      
                    
                });
        });
        

       

    }


    
}

var entityInterceptor = new EntityInterceptor();
module.exports = entityInterceptor;