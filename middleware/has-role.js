var Project_user = require("../models/project_user");
var winston = require('../config/winston');


class RoleChecker {
    

    
    constructor() {

        this.ROLES =  {
            "guest": ["guest"],
            "user":  ["guest","user"],
            "agent": ["guest","user","agent"],
            "admin": ["guest","user","agent", "admin",],
            "owner": ["guest","user","agent", "admin", "owner"],
        }
    }
      
      
       hasRole(role) {
           
        var that = this;

        // winston.debug("HasRole");
        return function(req, res, next) {
          
          // winston.debug("req.originalUrl" + req.originalUrl);
          // winston.debug("req.params" + JSON.stringify(req.params));
         // winston.info("req.params.projectid: " + req.params.projectid);
        //  winston.info("req.user.id: " + req.user.id);

          // winston.info("req.projectuser: " + req.projectuser);
          //winston.debug("req.user", req.user);
          //winston.debug("role", role);
      
          Project_user.find({ id_user: req.user.id, id_project: req.params.projectid }).
            exec(function (err, project_user) {
              if (err) {
                winston.error(err);
                return next(err);
              }
              //winston.info("project_user: ", JSON.stringify(project_user));
              
              
      
              if (project_user && project_user.length>0) {
                
                req.projectuser = project_user[0];
              // winston.debug("req.projectuser", req.projectuser);

                var userRole = project_user[0].role;
                // winston.debug("userRole", userRole);
      
                if (!role) {
                  next();
                }else {
      
                  var hierarchicalRoles = that.ROLES[userRole];
                  // winston.debug("hierarchicalRoles", hierarchicalRoles);
      
                  if ( hierarchicalRoles.includes(role)) {
                    next();
                  }else {
                    res.status(403).send({success: false, msg: 'you dont have the required role.'});
                  }
                }
              } else {
              
                // if (req.user) equals super admin next()
                res.status(403).send({success: false, msg: 'you dont belongs to the project.'});
              }
      
          });
      
        }
        
      }


      hasRoleAsPromise(role, user_id, projectid) {
           
        var that = this;

        return new Promise(function (resolve, reject) {              
      
          Project_user.find({ id_user: user_id, id_project: projectid }).
            exec(function (err, project_users) {
              if (err) {
                winston.error(err);
                return reject(err);
              }

      
              if (project_users && project_users.length>0) {
                
                var project_user= project_users[0];

                var userRole = project_user.role;
                // winston.debug("userRole", userRole);
      
                if (!role) {
                  resolve(project_user);
                }else {
      
                  var hierarchicalRoles = that.ROLES[userRole];
                  // winston.debug("hierarchicalRoles", hierarchicalRoles);
      
                  if ( hierarchicalRoles.includes(role)) {
                    resolve(project_user);
                  }else {
                    reject({success: false, msg: 'you dont have the required role.'});
                  }
                }
              } else {
              
                // if (req.user) equals super admin next()
                reject({success: false, msg: 'you dont belongs to the project.'});
              }
      
          });
      
        });
      
    }

}


var roleChecker = new RoleChecker();
module.exports = roleChecker;


