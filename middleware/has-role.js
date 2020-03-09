var Project_user = require("../models/project_user");
var Faq_kb = require("../models/faq_kb");
var Subscription = require("../models/subscription");
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
      
    isType(type) {        
      var that = this;   
      // winston.info("isType",isType);
        return function(req, res, next) {
          if (that.isTypeAsFunction(type)) {
            return next();
          } else {
            winston.error('isType type not supported.');
            return next({success: false, msg: 'type not supported.'});
          }
        }
      }

    // isType(type) {           
    //   // winston.info("isType",isType);
    //     return function(req, res, next) {
    //       winston.info("isType:"+type);
    //       winston.info("req.user", req.user);
    //       // winston.info(" req.user instanceof"+ req.user instanceof Faq_kb);
         
    //       if (type=='subscription' && req.user instanceof Faq_kb){

    //       } else if (type=='bot' && req.user instanceof Faq_kb){
    //         winston.info("is bot");
    //         return next();
    //       } else {
    //         // res.status(403).send({success: false, msg: 'type not supported.'});
    //         winston.error('isType type not supported.');
    //         return next({success: false, msg: 'type not supported.'});
    //       }
    //     }
    //   }


      isTypeAsFunction(type, user) {                 
            winston.debug("isType:"+type);
            winston.debug("user", user);
           //TODO Check if belongs to project
            if (type=='subscription' && user instanceof Subscription){
              winston.debug("isTypeAsFunction is subscription");
              return true
            } else if (type=='bot' && user instanceof Faq_kb){
              winston.debug("isTypeAsFunction is bot");
              return true
            } else {
              winston.debug("isTypeAsFunction is false");
              return false;
            }
       }


      isTypesAsFunction(types, user) {                 
        winston.debug("isTypes:"+types);
        winston.debug("user", user);
        var isType = false;
        var BreakException = {};

        if (types && types.length>0) {
          try {
            types.forEach(type => {
              winston.debug("type:"+type);
              isType = this.isTypeAsFunction(type, user);
              winston.debug("isType:"+ isType);
              if (isType==true) {
                throw BreakException; //https://stackoverflow.com/questions/2641347/short-circuit-array-foreach-like-calling-break
              }
            });

          } catch (e) {
            if (e !== BreakException) throw e;
          }
        }

        return isType;
      }    
        
  
      

      hasRole(role) {
        return this.hasRoleOrTypes(role);
      }

       hasRoleOrTypes(role, types) {
           
        var that = this;

        // winston.debug("HasRole");
        return function(req, res, next) {
          
          // winston.debug("req.originalUrl" + req.originalUrl);
          // winston.debug("req.params" + JSON.stringify(req.params));

        // same route doesnt contains projectid so you can't use that
          // winston.debug("req.params.projectid: " + req.params.projectid);
          if (!req.params.projectid) {
            return res.status(400).send({success: false, msg: 'req.params.projectid is not defined.'});
          }


        //  winston.info("req.user._id: " + req.user._id);

          // winston.info("req.projectuser: " + req.projectuser);
          //winston.debug("req.user", req.user);
          //winston.debug("role", role);
      

          // console.log("QUIIIIIIIIIIIIIIIIIIIIIII",type);
          if (types && types.length>0) {
            // console.log("QUIIIIIIIIIIIIIIIIIIIIIII");
            var checkRes = that.isTypesAsFunction(types, req.user);
            winston.debug("checkRes: " + checkRes);

            if (checkRes) {
             return next();
            }            
            // return that.isType(type)(req,res,next);
            // console.log("typers",typers);
          }

          // if (!req.user._id) {
          //   res.status(403).send({success: false, msg: 'req.user._id not defined.'});
          // }
          winston.debug("hasRoleOrType req.user._id " +req.user._id);
          // project_user_qui_importante

          // JWT_HERE
          var query = { id_project: req.params.projectid, id_user: req.user._id};
          if (req.user.sub && (req.user.sub=="userexternal" || req.user.sub=="guest")) {
            query = { id_project: req.params.projectid, uuid_user: req.user._id};
          }
          winston.debug("hasRoleOrType query " + JSON.stringify(query));

          Project_user.find(query).
            exec(function (err, project_user) {
              if (err) {
                winston.error("Error getting project_user for hasrole",err);
                return next(err);
              }
              winston.debug("project_user: ", JSON.stringify(project_user));
              
              
      
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
      
                  if ( hierarchicalRoles && hierarchicalRoles.includes(role)) {
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

// unused
      hasRoleAsPromise(role, user_id, projectid) {
           
        var that = this;

        return new Promise(function (resolve, reject) {              
          // project_user_qui_importante

           // JWT_HERE
          var query = { id_project: req.params.projectid, id_user: req.user._id};
          if (req.user.sub && (req.user.sub=="userexternal" || req.user.sub=="guest")) {
            query = { id_project: req.params.projectid, uuid_user: req.user._id};
          }

          Project_user.find(query).
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


