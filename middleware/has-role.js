var Project_user = require("../models/project_user");
var winston = require('../config/winston');


class RoleChecker {
    

    
    constructor() {

        this.ROLES =  {
            "agent": ["agent"],
            "admin": ["agent", "admin"],
            "owner": ["agent", "admin", "owner"],
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
              
              req.projectuser = project_user;
             // winston.debug("req.projectuser", req.projectuser);
      
              if (req.projectuser && req.projectuser.length>0) {
                
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
              }else {
              
                // if (req.user) equals super admin next()
                res.status(403).send({success: false, msg: 'you dont belongs to the project.'});
              }
      
          });
      
        }
        
      }

}


var roleChecker = new RoleChecker();
module.exports = roleChecker;


