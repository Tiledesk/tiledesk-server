var Project_user = require("../models/project_user");
var Faq_kb = require("../models/faq_kb");
var Subscription = require("../models/subscription");
var winston = require('../config/winston');

var projectUserService = require("../services/projectUserService");
class RoleChecker {
    

    
    constructor() {
      winston.debug("RoleChecker");

      this.ROLES =  {
            "guest":        ["guest"],
            "user":         ["guest","user"],
            "teammate":     ["guest","user","teammate"],
            "agent":        ["guest","user","teammate","agent"],
            "supervisor":   ["guest","user","teammate","agent","supervisor"],
            "admin":        ["guest","user","teammate","agent", "supervisor", "admin"],
            "owner":        ["guest","user","teammate","agent", "supervisor", "admin", "owner"],
      }
    }
      
    isType(type) {        
      var that = this;   
        winston.debug("isType",isType);
        return function(req, res, next) {
          if (that.isTypeAsFunction(type)) {
            return next();
          } else {
            winston.error('isType type not supported.');
            return next({success: false, msg: 'type not supported.'});
          }
        }
      }



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

              var adminEmail = process.env.ADMIN_EMAIL || "admin@tiledesk.com";

              if (user && user.email && user.email === adminEmail) { //skip has role check 
                return true;
              }
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
        
  
      hasPermission(permission) {
        var that = this;
        return async(req, res, next) => {
          if (!req.params.projectid && !req.projectid) {
            return res.status(400).send({success: false, msg: 'req.params.projectid is not defined.'});
          }

          let projectid = req.params.projectid || req.projectid;

          var project_user = req.projectuser;
          winston.debug("hasPermission project_user hasPermission", project_user);

          if (!project_user) {

            try {
              project_user = await projectUserService.getWithPermissions(req.user._id, projectid, req.user.sub);            
            } catch(err) {
              winston.error("Error getting project_user for hasrole",err);
              return next(err);
            }
            winston.debug("project_user: ", JSON.stringify(project_user));
          }     

          if (project_user) {
            
            req.projectuser = project_user;
            winston.debug("hasPermission req.projectuser", req.projectuser);

            var permissions = project_user._doc.rolePermissions;
           
            winston.debug("hasPermission permissions", permissions);
  
            winston.debug("hasPermission permission: "+ permission);

            if (permission==undefined) {
                winston.debug("permission is empty go next");
                return next();
            }

            if (permissions!=undefined && permissions.length>0) {
              if (permissions.includes(permission)) {
                next();
              }else {                         
                res.status(403).send({success: false, msg: 'you dont have the required permission.'});                
              }
            } else { 
              res.status(403).send({success: false, msg: 'you dont have the required permission. Is is empty'});                       
            }
          } else {
          
            /**
            * Updated by Johnny - 29mar2024 - START
            */
            // console.log("req.user: ", req.user);
            if (req.user.email === process.env.ADMIN_EMAIL) {
              req.user.attributes = { isSuperadmin: true };
              next();
            } else {
              res.status(403).send({success: false, msg: 'you dont belong to the project.'});
            }
            /**
            * Updated by Johnny - 29mar2024 - END
            */
          
          }
       
       
         
          
        }
      }
      

      hasRole(role) {
        return this.hasRoleOrTypes(role);
      }

       hasRoleOrTypes(role, types, permission) {
        // console.log("hasRoleOrTypes",role,types);

        var that = this;

        // winston.debug("HasRole");
        return async(req, res, next) => {
          
          // winston.debug("req.originalUrl" + req.originalUrl);
          // winston.debug("req.params" + JSON.stringify(req.params));

        // same route doesnt contains projectid so you can't use that
          // winston.debug("req.params.projectid: " + req.params.projectid);
          if (!req.params.projectid && !req.projectid) {
            return res.status(400).send({success: false, msg: 'req.params.projectid is not defined.'});
          }

          let projectid = req.params.projectid || req.projectid;

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

          var project_user = req.projectuser;
          winston.debug("hasRoleOrTypes project_user hasRoleOrTypes", project_user);

          if (!project_user) {
            winston.debug("load project_user");
            try {
              project_user = await projectUserService.getWithPermissions(req.user._id, projectid, req.user.sub);            
            } catch(err) {
              winston.error("Error getting project_user for hasrole",err);
              return next(err);
            }
                    
            winston.debug("project_user: ", JSON.stringify(project_user));
            
          }
          
          if (project_user) {
            
            req.projectuser = project_user;
            winston.debug("hasRoleOrTypes req.projectuser", req.projectuser.toJSON());

            var userRole = project_user.role;
            winston.debug("userRole", userRole);

  
            if (!role) { //????
              next();
            }else {
  
              var hierarchicalRoles = that.ROLES[userRole];
              winston.debug("hierarchicalRoles", hierarchicalRoles);
  
              if ( hierarchicalRoles ) {  //standard role
                winston.debug("standard role: "+ userRole);
                if (hierarchicalRoles.includes(role)) {
                  next();
                } else {
                  res.status(403).send({success: false, msg: 'you dont have the required role.'});
                }
              } else { //custom role
                
                winston.debug("custom role: "+ userRole);
                return that.hasPermission(permission)(req, res, next);

                // if (permission==undefined) {
                //   winston.debug("permission is empty go next");
                //   return next();
                // }

                // // invece di questo codice richiama hasPermission()
                // var permissions = project_user._doc.rolePermissions;
           
                // winston.debug("hasPermission permissions", permissions);
      
                // winston.debug("hasPermission permission: "+ permission);               

                // if (permissions!=undefined && permissions.length>0) {
                //   if (permissions.includes(permission)) {
                //     next();
                //   }else {                         
                //     res.status(403).send({success: false, msg: 'you dont have the required permission.'});                
                //   }
                // } else { 
                //   res.status(403).send({success: false, msg: 'you dont have the required permission. Is is empty'});                       
                // }


              }
                
            }
          
          } else {
          
            /**
             * Updated by Johnny - 29mar2024 - START
             */
            // console.log("req.user: ", req.user);
            if (req.user.email === process.env.ADMIN_EMAIL) {
              req.user.attributes = { isSuperadmin: true };
              next();
            } else {
              res.status(403).send({success: false, msg: 'you dont belong to the project.'});
            }
            /**
             * Updated by Johnny - 29mar2024 - END
             */

            // if (req.user) equals super admin next()
            //res.status(403).send({success: false, msg: 'you dont belong to the project.'});
          }
      
      
        }
      }
        
}



var roleChecker = new RoleChecker();
module.exports = roleChecker;


