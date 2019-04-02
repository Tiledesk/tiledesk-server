var Project_user = require("../models/project_user");


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

        // console.log("HasRole");
        return function(req, res, next) {
          //console.log("req.projectuser", req.projectuser);
          //console.log("req.user", req.user);
          //console.log("role", role);
      
          Project_user.find({ id_user: req.user.id, id_project: req.params.projectid }).
            exec(function (err, project_user) {
              if (err) {
                winston.error(err);
                return next(err);
              }
              
              req.projectuser = project_user;
             // console.log("req.projectuser", req.projectuser);
      
              if (req.projectuser && req.projectuser.length>0) {
                
                var userRole = project_user[0].role;
                // console.log("userRole", userRole);
      
                if (!role) {
                  next();
                }else {
      
                  var hierarchicalRoles = that.ROLES[userRole];
                  // console.log("hierarchicalRoles", hierarchicalRoles);
      
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


