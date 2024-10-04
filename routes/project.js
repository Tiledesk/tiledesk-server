var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var projectEvent = require("../event/projectEvent");
var projectService = require("../services/projectService");
var projectUserService = require("../services/projectUserService");

var Project_user = require("../models/project_user");

var operatingHoursService = require("../services/operatingHoursService");
var Department = require('../models/department');
var Group = require('../models/group');

var winston = require('../config/winston');
var roleChecker = require('../middleware/has-role');
var config = require('../config/database');

// THE THREE FOLLOWS IMPORTS  ARE USED FOR AUTHENTICATION IN THE ROUTE
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var RoleConstants = require("../models/roleConstants");
var cacheUtil = require('../utils/cacheUtil');
var orgUtil = require("../utils/orgUtil");
var cacheEnabler = require("../services/cacheEnabler");
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
// CHECK IT ASAP!!!!
let configSecret = process.env.GLOBAL_SECRET || config.secret;
var pKey = process.env.GLOBAL_SECRET_OR_PRIVATE_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecret = pKey.replace(/\\n/g, '\n');
}

let pubConfigSecret = process.env.GLOBAL_SECRET || config.secret;
var pubKey = process.env.GLOBAL_SECRET_OR_PUB_KEY;
if (pubKey) {
  pubConfigSecret = pubKey.replace(/\\n/g, '\n');
}
// CHECK IT ASAP!!!!


router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], async (req, res) => {
  
  // create(name, createdBy, settings) 
  return projectService.create(req.body.name, req.user.id, undefined, req.body.defaultLanguage).then(function(savedProject) {
      res.json(savedProject);
  });
  
});

// DOWNGRADE PLAN. UNUSED
router.put('/:projectid/downgradeplan', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('owner')], function (req, res) {
  winston.debug('downgradeplan - UPDATE PROJECT REQ BODY ', req.body);
  Project.findByIdAndUpdate(req.params.projectid, req.body, { new: true, upsert: true }, function (err, updatedProject) {
      if (err) {
          winston.error('Error putting project ', err);
          return res.status(500).send({ success: false, msg: 'Error updating object.' });
      }
      projectEvent.emit('project.downgrade', updatedProject );
      res.json(updatedProject);
  });
});


router.delete('/:projectid/physical', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('owner')], function (req, res) {
  winston.debug(req.body);
  // TODO delete also department, faq_kb, faq, group, label, lead, message, project_users, requests, subscription
  
  // TODO use findByIdAndRemove otherwise project don't contains label object
  Project.remove({ _id: req.params.projectid }, function (err, project) {
      if (err) {
          winston.error('Error deleting project ', err);
          return res.status(500).send({ success: false, msg: 'Error deleting object.' });
      }
      projectEvent.emit('project.delete', project );
      res.json(project);
  });
});

router.delete('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('owner')], function (req, res) {
  winston.debug(req.body);
  // TODO delete also department, faq_kb, faq, group, label, lead, message, project_users, requests, subscription
  Project.findByIdAndUpdate(req.params.projectid, {status:0}, { new: true, upsert: true }, function (err, project) {
      if (err) {
          winston.error('Error deleting project ', err);
          return res.status(500).send({ success: false, msg: 'Error deleting object.' });
      }
      projectEvent.emit('project.delete', project );
      res.json(project);
  });
});

// router.put('/:projectid/update', function (req, res) {
// // router.put('/:projectid/profile', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  
//   // Get token from header authorization
//   let token = req.headers.authorization;
//   token = token.split(" ")[1];

//   try {
//     let decoded = jwt.verify(token, configSecret)
//     winston.debug("user decode: ", decoded);

//     if (!process.env.ADMIN_EMAIL) {
//       winston.warn("Missing admin email parameter in environment");
//       return res.status(401).send({ success: false, error: "Missing admin email parameter"});
//     }

//     if (decoded.email !== process.env.ADMIN_EMAIL) {
//       winston.warn("Profile modification: permission denied.");
//       return res.status(403).send({ success: false, error: "You don't have the permission required to modify the project profile"});
//     } 

//     /**
//      * modify the project profile here
//      */
//     var update = {};

//     if (req.body.name!=undefined) {
//       update.name = req.body.name;
//     }
  
//     if (req.body.activeOperatingHours!=undefined) {
//       update.activeOperatingHours = req.body.activeOperatingHours;
//     }
    
//     if (req.body.operatingHours!=undefined) {
//       update.operatingHours = req.body.operatingHours;
//     }
    
//     if (req.body.settings!=undefined) {
//       update.settings = req.body.settings;
//     }

//     if (req.body["settings.email.autoSendTranscriptToRequester"]!=undefined) {
//       update["settings.email.autoSendTranscriptToRequester"] = req.body["settings.email.autoSendTranscriptToRequester"];
//     }
//     if (req.body["settings.email.notification.conversation.assigned"]!=undefined) {
//       update["settings.email.notification.conversation.assigned"] = req.body["settings.email.notification.conversation.assigned"];
//     }
//     if (req.body["settings.email.notification.conversation.pooled"]!=undefined) {
//       update["settings.email.notification.conversation.pooled"] = req.body["settings.email.notification.conversation.pooled"];
//     }
//     if (req.body["settings.email.templates.assignedRequest"]!=undefined) {
//       update["settings.email.templates.assignedRequest"] = req.body["settings.email.templates.assignedRequest"];
//     }
//     if (req.body["settings.email.templates.assignedEmailMessage"]!=undefined) {
//       update["settings.email.templates.assignedEmailMessage"] = req.body["settings.email.templates.assignedEmailMessage"];
//     }
//     if (req.body["settings.email.templates.pooledRequest"]!=undefined) {
//       update["settings.email.templates.pooledRequest"] = req.body["settings.email.templates.pooledRequest"];
//     }
//     if (req.body["settings.email.templates.pooledEmailMessage"]!=undefined) {
//       update["settings.email.templates.pooledEmailMessage"] = req.body["settings.email.templates.pooledEmailMessage"];
//     }
//     if (req.body["settings.email.templates.newMessage"]!=undefined) {
//       update["settings.email.templates.newMessage"] = req.body["settings.email.templates.newMessage"];
//     }
//     if (req.body["settings.email.templates.newMessageFollower"]!=undefined) {
//       update["settings.email.templates.newMessageFollower"] = req.body["settings.email.templates.newMessageFollower"];
//     }
//     if (req.body["settings.email.templates.ticket"]!=undefined) {
//       update["settings.email.templates.ticket"] = req.body["settings.email.templates.ticket"];
//     }
//     if (req.body["settings.email.templates.sendTranscript"]!=undefined) {
//       update["settings.email.templates.sendTranscript"] = req.body["settings.email.templates.sendTranscript"];
//     }
//     if (req.body["settings.email.templates.emailDirect"]!=undefined) {
//       update["settings.email.templates.emailDirect"] = req.body["settings.email.templates.emailDirect"];
//     }
//     if (req.body["settings.email.from"]!=undefined) {
//       update["settings.email.from"] = req.body["settings.email.from"];
//     }
//     if (req.body["settings.email.config.host"]!=undefined) {
//       update["settings.email.config.host"] = req.body["settings.email.config.host"];
//     }
//     if (req.body["settings.email.config.port"]!=undefined) {
//       update["settings.email.config.port"] = req.body["settings.email.config.port"];
//     }
//     if (req.body["settings.email.config.secure"]!=undefined) {
//       update["settings.email.config.secure"] = req.body["settings.email.config.secure"];
//     }
//     if (req.body["settings.email.config.user"]!=undefined) {
//       update["settings.email.config.user"] = req.body["settings.email.config.user"];
//     }
//     if (req.body["settings.email.config.pass"]!=undefined) {
//       update["settings.email.config.pass"] = req.body["settings.email.config.pass"];
//     }
//     if (req.body["settings.chat_limit_on"]!=undefined) {
//       update["settings.chat_limit_on"] = req.body["settings.chat_limit_on"];
//     }
//     if (req.body["settings.max_agent_assigned_chat"]!=undefined) {
//       update["settings.max_agent_assigned_chat"] = req.body["settings.max_agent_assigned_chat"];
//     }
//     if (req.body["settings.reassignment_on"]!=undefined) {
//       update["settings.reassignment_on"] = req.body["settings.reassignment_on"];
//     }
//     if (req.body["settings.reassignment_delay"]!=undefined) {
//       update["settings.reassignment_delay"] = req.body["settings.reassignment_delay"];
//     }
//     if (req.body["settings.automatic_unavailable_status_on"]!=undefined) {
//       update["settings.automatic_unavailable_status_on"] = req.body["settings.automatic_unavailable_status_on"];
//     }
//     if (req.body["settings.automatic_idle_chats"]!=undefined) {
//       update["settings.automatic_idle_chats"] = req.body["settings.automatic_idle_chats"];
//     }

//     if (req.body.widget!=undefined) {
//       update.widget = req.body.widget;
//     }
//     if (req.body.versions!=undefined) {
//       update.versions = req.body.versions;
//     }
//     if (req.body.channels!=undefined) {
//       update.channels = req.body.channels; 
//     }
//     if (req.body.ipFilterEnabled!=undefined) {
//       update.ipFilterEnabled = req.body.ipFilterEnabled;
//     }
//     if (req.body.ipFilter!=undefined) {
//       update.ipFilter = req.body.ipFilter;
//     }
//     if (req.body.ipFilterDenyEnabled!=undefined) {
//       update.ipFilterDenyEnabled = req.body.ipFilterDenyEnabled;
//     }
//     if (req.body.ipFilterDeny!=undefined) {
//       update.ipFilterDeny = req.body.ipFilterDeny;
//     }
//     if (req.body.bannedUsers!=undefined) {
//       update.bannedUsers = req.body.bannedUsers;
//     }
//     if (req.body.profile!=undefined) {
//       update.profile = req.body.profile;
//     }

//     winston.debug('UPDATE PROJECT REQ BODY ', update);

//     Project.findByIdAndUpdate(req.params.projectid, update, { new: true, upsert: true }, function (err, updatedProject) {
//       if (err) {
//         winston.error('Error putting project ', err);
//         return res.status(500).send({ success: false, msg: 'Error updating object.' });
//       }
//       projectEvent.emit('project.update', updatedProject );
//       res.json(updatedProject);
//     });
  
//   } catch (err) {
//     winston.warn("Profile modification: permission denied.");
//     res.status(403).send({ success: false, error: "You don't have the permission required to modify the project profile"});
//   }

// })

router.put('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  
  winston.debug('UPDATE PROJECT REQ BODY ', req.body);

  var update = {};
  let updating_quotes = false;

  if (req.body.profile) {

    if (req.user &&
        req.user.attributes &&
        req.user.attributes.isSuperadmin === true) {
          
          winston.debug("Superadmin can modify the project profile")
          update.profile = req.body.profile;
          if (req.body.profile.quotes) {
            updating_quotes = true;
          }

          /**
           * Possibile Miglioramento
           * Eliminare solo le chiavi di redis di notify solo per le quote che si stanno modificando.
           * Per farlo è necessario permettere la modifica puntuale del project profile, attualmente non disponibile.
           */

          delete req.user.attributes.isSuperadmin;
    }
    else {
      winston.verbose("Project profile can't be modified by the current user " + req.user._id);
      return res.status(403).send({ success: false,  error: "You don't have the permission required to modify the project profile"});
    }

    // check if super admin
    // let token = req.headers.authorization
    // token = token.split(" ")[1];

    // let decoded = jwt.verify(token, configSecret);
    // winston.debug("user decoded: ", decoded);
    // console.log("user decoded: ", decoded);

    // if (!process.env.ADMIN_EMAIL) {
    //   winston.warn("Missing admin email parameter in environment");
    //   return res.status(401).send({ success: false, error: "Missing admin email parameter"});
    // }

    // if (!decoded) {
    //   winston.warn("Profile modification: permission denied.");
    //   return res.status(403).send({ success: false, error: "You don't have the permission required to modify the project profile. Can't decode user."});
    // }

    // if (decoded.email !== process.env.ADMIN_EMAIL) {
    //   winston.warn("Profile modification: permission denied.");
    //   return res.status(403).send({ success: false, error: "You don't have the permission required to modify the project profile"});
    // }

    // console.log("You can modify the project profile");

    // winston.info("Illegal field profile detected. Deny project profile update.");
    // return res.status(403).send({ success: false,  error: "You cannot edit the project profile."});
  }
  
//like patch
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }

  if (req.body.activeOperatingHours!=undefined) {
    update.activeOperatingHours = req.body.activeOperatingHours;
  }
  
  if (req.body.operatingHours!=undefined) {
    update.operatingHours = req.body.operatingHours;
  }

  if (req.body.timeSlots!=undefined) {
    update.timeSlots = req.body.timeSlots;
  }
  
  if (req.body.settings!=undefined) {
    update.settings = req.body.settings;
  }
  
  if (req.body["settings.email.autoSendTranscriptToRequester"]!=undefined) {
    update["settings.email.autoSendTranscriptToRequester"] = req.body["settings.email.autoSendTranscriptToRequester"];
  }

  if (req.body["settings.email.notification.conversation.assigned"]!=undefined) {
    update["settings.email.notification.conversation.assigned"] = req.body["settings.email.notification.conversation.assigned"];
  }

  if (req.body["settings.email.notification.conversation.pooled"]!=undefined) {
    update["settings.email.notification.conversation.pooled"] = req.body["settings.email.notification.conversation.pooled"];
  }




  if (req.body["settings.email.templates.assignedRequest"]!=undefined) {
    update["settings.email.templates.assignedRequest"] = req.body["settings.email.templates.assignedRequest"];
  }
  if (req.body["settings.email.templates.assignedEmailMessage"]!=undefined) {
    update["settings.email.templates.assignedEmailMessage"] = req.body["settings.email.templates.assignedEmailMessage"];
  }
  if (req.body["settings.email.templates.pooledRequest"]!=undefined) {
    update["settings.email.templates.pooledRequest"] = req.body["settings.email.templates.pooledRequest"];
  }
  if (req.body["settings.email.templates.pooledEmailMessage"]!=undefined) {
    update["settings.email.templates.pooledEmailMessage"] = req.body["settings.email.templates.pooledEmailMessage"];
  }
  if (req.body["settings.email.templates.newMessage"]!=undefined) {
    update["settings.email.templates.newMessage"] = req.body["settings.email.templates.newMessage"];
  }
  if (req.body["settings.email.templates.newMessageFollower"]!=undefined) {
    update["settings.email.templates.newMessageFollower"] = req.body["settings.email.templates.newMessageFollower"];
  }
  if (req.body["settings.email.templates.ticket"]!=undefined) {
    update["settings.email.templates.ticket"] = req.body["settings.email.templates.ticket"];
  }
  if (req.body["settings.email.templates.sendTranscript"]!=undefined) {
    update["settings.email.templates.sendTranscript"] = req.body["settings.email.templates.sendTranscript"];
  }
  if (req.body["settings.email.templates.emailDirect"]!=undefined) {
    update["settings.email.templates.emailDirect"] = req.body["settings.email.templates.emailDirect"];
  }


  if (req.body["settings.email.from"]!=undefined) {
    update["settings.email.from"] = req.body["settings.email.from"];
  }
  if (req.body["settings.email.config.host"]!=undefined) {
    update["settings.email.config.host"] = req.body["settings.email.config.host"];
  }
  if (req.body["settings.email.config.port"]!=undefined) {
    update["settings.email.config.port"] = req.body["settings.email.config.port"];
  }
  if (req.body["settings.email.config.secure"]!=undefined) {
    update["settings.email.config.secure"] = req.body["settings.email.config.secure"];
  }
  if (req.body["settings.email.config.user"]!=undefined) {
    update["settings.email.config.user"] = req.body["settings.email.config.user"];
  }
  if (req.body["settings.email.config.pass"]!=undefined) {
    update["settings.email.config.pass"] = req.body["settings.email.config.pass"];
  }


  
  /*

  if (req.body.settings.email.templates.assignedRequest!=undefined) {
    // if (req.body["settings.email.templates.assignedRequest.html"]!=undefined) {
    console.log("assignedRequest");
    update["settings.email.templates.assignedRequest"] = req.body.settings.email.templates.assignedRequest;
  }
  if (req.body["settings.email.templates.assignedEmailMessage.html"]!=undefined) {
    update["settings.email.templates.assignedEmailMessage.html"] = req.body["settings.email.templates.assignedEmailMessage.html"];
  }
  if (req.body.settings.email.templates.pooledRequest!=undefined) {
    console.log("pooledRequest");
    update["settings.email.templates.pooledRequest"] = req.body.settings.email.templates.pooledRequest;
  }
*/

  if (req.body["settings.chat_limit_on"]!=undefined) {
    update["settings.chat_limit_on"] = req.body["settings.chat_limit_on"];
  }

  if (req.body["settings.max_agent_assigned_chat"]!=undefined) {
    update["settings.max_agent_assigned_chat"] = req.body["settings.max_agent_assigned_chat"];
  }



  if (req.body["settings.reassignment_on"]!=undefined) {
    update["settings.reassignment_on"] = req.body["settings.reassignment_on"];
  }

  if (req.body["settings.reassignment_delay"]!=undefined) {
    update["settings.reassignment_delay"] = req.body["settings.reassignment_delay"];
  }


  if (req.body["settings.automatic_unavailable_status_on"]!=undefined) {
    update["settings.automatic_unavailable_status_on"] = req.body["settings.automatic_unavailable_status_on"];
  }

  if (req.body["settings.automatic_idle_chats"]!=undefined) {
    update["settings.automatic_idle_chats"] = req.body["settings.automatic_idle_chats"];
  }

  if (req.body["settings.current_agent_my_chats_only"]!=undefined) {
    update["settings.current_agent_my_chats_only"] = req.body["settings.current_agent_my_chats_only"];
  }

  if (req.body["settings.chatbots_attributes_hidden"]!=undefined) {
    update["settings.chatbots_attributes_hidden"] = req.body["settings.chatbots_attributes_hidden"];
  }
  
  if (req.body.widget!=undefined) {
    update.widget = req.body.widget;
  }

  if (req.body.versions!=undefined) {
    update.versions = req.body.versions;
  }
  
  if (req.body.channels!=undefined) {
    update.channels = req.body.channels; 
  }

  if (req.body.ipFilterEnabled!=undefined) {
    update.ipFilterEnabled = req.body.ipFilterEnabled;
  }

  if (req.body.ipFilter!=undefined) {
    update.ipFilter = req.body.ipFilter;
  }

  if (req.body.ipFilterDenyEnabled!=undefined) {
    update.ipFilterDenyEnabled = req.body.ipFilterDenyEnabled;
  }

  if (req.body.ipFilterDeny!=undefined) {
    update.ipFilterDeny = req.body.ipFilterDeny;
  }

  if (req.body.bannedUsers!=undefined) {
    update.bannedUsers = req.body.bannedUsers;
  }
  
  // if (req.body.defaultLanguage!=undefined) {
  //   update.defaultLanguage = req.body.defaultLanguage; 
  // }

  
  winston.debug('UPDATE PROJECT REQ BODY ', update);
  // console.log("update",JSON.stringify(update));

  Project.findByIdAndUpdate(req.params.projectid, update, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    projectEvent.emit('project.update', updatedProject );

    if (updating_quotes == true) {
      let obj = { createdAt: new Date() };
      let quoteManager = req.app.get('quote_manager');
      quoteManager.invalidateCheckpointKeys(updatedProject, obj);
    }
    res.json(updatedProject);
  });
});

router.patch('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  winston.debug('PATCH PROJECT REQ BODY ', req.body);

  var update = {};
  
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }

  if (req.body.activeOperatingHours!=undefined) {
    update.activeOperatingHours = req.body.activeOperatingHours;
  }
  
  if (req.body.operatingHours!=undefined) {
    update.operatingHours = req.body.operatingHours;
  }
  
  if (req.body.settings!=undefined) {
    update.settings = req.body.settings;
  }
  
  if (req.body["settings.email.autoSendTranscriptToRequester"]!=undefined) {
    update["settings.email.autoSendTranscriptToRequester"] = req.body["settings.email.autoSendTranscriptToRequester"];
  }


  if (req.body["settings.email.notification.conversation.assigned"]!=undefined) {
    update["settings.email.notification.conversation.assigned"] = req.body["settings.email.notification.conversation.assigned"];
  }

  if (req.body["settings.email.notification.conversation.pooled"]!=undefined) {
    update["settings.email.notification.conversation.pooled"] = req.body["settings.email.notification.conversation.pooled"];
  }


  
  if (req.body["settings.email.templates.assignedRequest"]!=undefined) {
    update["settings.email.templates.assignedRequest"] = req.body["settings.email.templates.assignedRequest"];
  }
  if (req.body["settings.email.templates.assignedEmailMessage"]!=undefined) {
    update["settings.email.templates.assignedEmailMessage"] = req.body["settings.email.templates.assignedEmailMessage"];
  }
  if (req.body["settings.email.templates.pooledRequest"]!=undefined) {
    update["settings.email.templates.pooledRequest"] = req.body["settings.email.templates.pooledRequest"];
  }
  if (req.body["settings.email.templates.pooledEmailMessage"]!=undefined) {
    update["settings.email.templates.pooledEmailMessage"] = req.body["settings.email.templates.pooledEmailMessage"];
  }
  if (req.body["settings.email.templates.newMessage"]!=undefined) {
    update["settings.email.templates.newMessage"] = req.body["settings.email.templates.newMessage"];
  }
  if (req.body["settings.email.templates.ticket"]!=undefined) {
    update["settings.email.templates.ticket"] = req.body["settings.email.templates.ticket"];
  }
  if (req.body["settings.email.templates.sendTranscript"]!=undefined) {
    update["settings.email.templates.sendTranscript"] = req.body["settings.email.templates.sendTranscript"];
  }


  if (req.body["settings.email.from"]!=undefined) {
    update["settings.email.from"] = req.body["settings.email.from"];
  }
  if (req.body["settings.email.config.host"]!=undefined) {
    update["settings.email.config.host"] = req.body["settings.email.config.host"];
  }
  if (req.body["settings.email.config.port"]!=undefined) {
    update["settings.email.config.port"] = req.body["settings.email.config.port"];
  }
  if (req.body["settings.email.config.secure"]!=undefined) {
    update["settings.email.config.secure"] = req.body["settings.email.config.secure"];
  }
  if (req.body["settings.email.config.user"]!=undefined) {
    update["settings.email.config.user"] = req.body["settings.email.config.user"];
  }
  if (req.body["settings.email.config.pass"]!=undefined) {
    update["settings.email.config.pass"] = req.body["settings.email.config.pass"];
  }


  if (req.body["settings.chat_limit_on"]!=undefined) {
    update["settings.chat_limit_on"] = req.body["settings.chat_limit_on"];
  }

  if (req.body["settings.max_agent_assigned_chat"]!=undefined) {
    update["settings.max_agent_assigned_chat"] = req.body["settings.max_agent_assigned_chat"];
  }



  if (req.body["settings.reassignment_on"]!=undefined) {
    update["settings.reassignment_on"] = req.body["settings.reassignment_on"];
  }

  if (req.body["settings.reassignment_delay"]!=undefined) {
    update["settings.reassignment_delay"] = req.body["settings.reassignment_delay"];
  }




  if (req.body["settings.automatic_unavailable_status_on"]!=undefined) {
    update["settings.automatic_unavailable_status_on"] = req.body["settings.automatic_unavailable_status_on"];
  }

  if (req.body["settings.automatic_idle_chats"]!=undefined) {
    update["settings.automatic_idle_chats"] = req.body["settings.automatic_idle_chats"];
  }
  
  if (req.body.widget!=undefined) {
    update.widget = req.body.widget;
  }

  if (req.body.versions!=undefined) {
    update.versions = req.body.versions;
  }
  
  if (req.body.channels!=undefined) {
    update.channels = req.body.channels; 
  }
  
  if (req.body.ipFilterEnabled!=undefined) {
    update.ipFilterEnabled = req.body.ipFilterEnabled;
  }

  if (req.body.ipFilter!=undefined) {
    update.ipFilter = req.body.ipFilter;
  }

  if (req.body.ipFilterDenyEnabled!=undefined) {
    update.ipFilterDenyEnabled = req.body.ipFilterDenyEnabled;
  }

  if (req.body.ipFilterDeny!=undefined) {
    update.ipFilterDeny = req.body.ipFilterDeny;
  }

  if (req.body.bannedUsers!=undefined) {
    update.bannedUsers = req.body.bannedUsers;
  }
  
    
  // if (req.body.defaultLanguage!=undefined) {
  //   update.defaultLanguage = req.body.defaultLanguage; 
  // }

 
  winston.debug('UPDATE PROJECT REQ BODY ', update);

  Project.findByIdAndUpdate(req.params.projectid, update, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error patching object.' });
    }
    projectEvent.emit('project.update', updatedProject );
    res.json(updatedProject);
  });
});

router.patch('/:projectid/attributes', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  var data = req.body;

  // TODO use service method

  Project.findById(req.params.projectid, function (err, updatedProject) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

     if (!updatedProject) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      
      if (!updatedProject.attributes) {
        winston.debug("empty attributes")
        updatedProject.attributes = {};
      }

      winston.debug(" updatedProject attributes", updatedProject.attributes)
        
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          winston.debug("data attributes "+key+" " +val)
          updatedProject.attributes[key] = val;
        });     
        
        winston.debug(" updatedProject attributes", updatedProject.attributes)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        updatedProject.markModified('attributes');

          //cacheinvalidation
          updatedProject.save(function (err, savedProject) {
          if (err) {
            winston.error("error saving project attributes",err)
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          winston.verbose(" saved project attributes",savedProject.toObject())
          projectEvent.emit('project.update', savedProject);

            res.json(savedProject);
        });
  });
  
});


router.post('/:projectid/ban', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  winston.debug('PATCH PROJECT REQ BODY ', req.body);

  var ban = {};
  ban.id = req.body.id;
  ban.ip = req.body.ip;

  Project.findByIdAndUpdate(req.params.projectid, { $push: { bannedUsers: ban } }, { new: true, upsert: false }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error patching object.' });
    }
    projectEvent.emit('project.update', updatedProject );
    projectEvent.emit('project.update.user.ban', {banInfo: ban, project: updatedProject });
    res.json(updatedProject);
  });

});
router.delete('/:projectid/ban/:banid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  
  // winston.info('quiiiiii');
  //cacheinvalidation

  
  // devi prendere id utente prima di eliminarlo
Project.findByIdAndUpdate(req.params.projectid, { $pull: { bannedUsers: { "_id": req.params.banid }}}, { new: true, upsert: false }, function (err, updatedProject) {
  if (err) {
    winston.error('Error putting project ', err);
    return res.status(500).send({ success: false, msg: 'Error patching object.' });
  }
  projectEvent.emit('project.update', updatedProject );
  projectEvent.emit('project.update.user.unban', {banInfo: req.params.banid, project: updatedProject});
  res.json(updatedProject);
});

});

router.get('/all', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  if (req.headers.authorization) {

    let token = req.headers.authorization.split(" ")[1];
    let decode = jwt.verify(token, pubConfigSecret)
    if (decode && (decode.email === process.env.ADMIN_EMAIL)) {

      Project.aggregate([
        // {
        //   $match: {
        //     status: 100,
        //     //createdAt: { $gte: startDate}
        //   },
        // },
        {
          $sort: {
            createdAt: -1
          },
        },
        {
          $lookup: {
            from: 'project_users',          
            localField: '_id',              
            foreignField: 'id_project',     
            as: 'project_user',            
            pipeline: [                     
              { $match: { role: 'owner' } } 
            ]
          }
        },
        {
          $addFields: {
            project_user: { $arrayElemAt: ['$project_user', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'project_user.id_user',              
            foreignField: '_id',     
            as: 'user'            
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ['$user', 0] } 
          }
        }
      ])
        .then((projects) => {
          winston.verbose("Projects found " + projects.length)
          // const fieldsToKeep = ['_id', 'name', 'createdBy', 'createdAt', 'user.email' ];

          const filteredProjects = projects.map(project => {
            const filteredProject = {};
            filteredProject._id = project._id;
            filteredProject.name = project.name;
            filteredProject.owner = project.user?.email;
            filteredProject.createdAt = project.createdAt;
            filteredProject.profile_name = project.profile?.name;
            // ... add other fields here

            // fieldsToKeep.forEach(field => {
            //   if (project[field] !== undefined) {
            //     filteredProject[field] = project[field];
            //   }
            // });
            return filteredProject;
          });

          return res.status(200).send(filteredProjects);
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send({ success: false,  error: err});
        });
      
      // let updatedUser = await User.findByIdAndUpdate(savedUser._id, { emailverified: true }, { new: true }).exec();
      // winston.debug("updatedUser: ", updatedUser);
      // skipVerificationEmail = true;
      // winston.verbose("skip sending verification email")
    } else {
      return res.status(403).send({ success: false,  error: "You don't have the permission required to perform the operation"});
    }

  }

});


//roleChecker.hasRole('agent') works because req.params.projectid is valid using :projectid of this method
router.get('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res) {
  winston.debug(req.body);
  let q = Project.findOne({_id: req.params.projectid, status:100});
  if (cacheEnabler.project) { 
    q.cache(cacheUtil.longTTL, "projects:id:"+req.params.projectid)  //project_cache
    winston.debug('project cache enabled for /project detail');
  }
  q.exec(function (err, project) {
    if (err) {
      winston.error('Error getting project ', err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!project) {
      winston.warn('Project not found ');
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

     //TODO REMOVE settings from project
    res.json(project);
  });
});

// GET ALL PROJECTS BY CURRENT USER ID
// router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {
  // altrimenti 403
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  winston.debug('REQ USER ID ', req.user._id);

  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  } 
  winston.debug("direction",direction);

  var sortField = "updatedAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  } 
  winston.debug("sortField",sortField);

  var sortQuery={};
  sortQuery[sortField] = direction;


  Project_user.find({ id_user: req.user._id , role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active"}).
    // populate('id_project').
    populate({
      path: 'id_project',
      // match: { status: 100 }, //not filter only not populate
    }).
    sort(sortQuery).
    exec(function (err, project_users) {
      if (err) {
        winston.error('Error getting project_users: ', err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }       



      //organization: if third sub domain iterate and put only project with organization==subdomain otherwise remove projects with org
      winston.debug("orgUtil.ORGANIZATION_ENABLED: " + orgUtil.ORGANIZATION_ENABLED);
      if (orgUtil.ORGANIZATION_ENABLED == true ) {

              // winston.info("project_users", project_users);
        winston.debug("project_users.length:"+ project_users.length);

        let org = orgUtil.getOrg(req);
        winston.debug("org:"+ org);
        
        if (org!=undefined) {
          winston.debug("org!=undefined");

          var project_users = project_users.filter(function (projectUser) {
            if (projectUser.id_project.organization && projectUser.id_project.organization === org ) {
              winston.debug("keep");
              return true;
            }
          });

        /* for (var i = 0; i < project_users.length; i++) { 
            winston.info("project_users[i].id_project.organization: " + project_users[i].id_project.organization);
            if (project_users[i].id_project.organization && project_users[i].id_project.organization === org ) {
              //keep
              winston.info("keep");
            } else {
              // project_users.splice(i, 1); // 2nd parameter means remove one item only
              winston.info("splice");
            }
          }*/
        } else {

            var project_users = project_users.filter(function (projectUser) {
              if (projectUser.id_project.organization == undefined ) {
                // winston.info("keep");
                return true;
              }
            });        
          

          /*
          for (var i = 0; i < project_users.length; i++) { 
            winston.info("project_users[i].id_project.organization: " + project_users[i].id_project.organization);
            if (project_users[i].id_project.organization) {
              project_users.splice(i, 1); // 2nd parameter means remove one item only
            }
          }*/
        }
      } else {
        winston.debug("no")
      }


      project_users.sort((a, b) => (a.id_project && b.id_project && a.id_project.updatedAt > b.id_project.updatedAt) ? 1 : -1)
      project_users.reverse(); 

      //TODO REMOVE settings from project
      res.json(project_users);
    });
});

// GET ALL PROJECTS BY CURRENT USER ID. usaed by unisalento to know if a project is open 
router.get('/:projectid/isopen', function (req, res) {

  let project_id = req.params.projectid;
  // Check if a timeSlot is passed
  if (req.query.timeSlot) {
    let slot_id = req.query.timeSlot;
    operatingHoursService.slotIsOpenNow(project_id, slot_id, (isOpen, err) => {

      if (err) {
        winston.error("Error getting slotIsOpenNow ", err);
        return res.status(500).send({ success: false, error: err });
      }
      return res.status(200).send({ isopen: isOpen})
    })

  } else {

    operatingHoursService.projectIsOpenNow(project_id, function (isOpen, err) {
     winston.debug('project', project_id, 'isopen: ', isOpen);
  
      if (err) {
        winston.error('Error getting projectIsOpenNow', err);
        return res.status(500).send({ success: false, msg: err });
      } 
      return res.status(200).send({ isopen: isOpen})
   });
  }
});


router.get('/:projectid/users/availables', async  (req, res) => {
  
  let projectid = req.params.projectid;
  let raw_option = req.query.raw;
  let dep_id = req.query.department;
  let isOpen = true;

  winston.debug("(Users Availables) raw_option: " + raw_option);
  winston.debug("(Users Availables) dep_id: " + dep_id);

  let available_agents_array = [];

  if (!raw_option || raw_option === false) {
    try {
      isOpen = await new Promise((resolve, reject) => {
        operatingHoursService.projectIsOpenNow(projectid, (isOpen, err) => {
          if (err) reject(err);
          else resolve(isOpen);
        });
      });
    } catch (err) {
      winston.error("(Users Availables) check operating hours error: ", err);
      return res.status(500).send({ success: false, msg: err });
    }
  }

  if (isOpen === false) {
    return res.json(available_agents_array);
  }

  let query = { id_project: projectid, user_available: true, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]} };

  if (dep_id) {
    let department = await Department.findById(dep_id).catch((err) => {
      winston.error("(Users Availables) find department error: ", err)
      return res.status(500).send({ success: false, error: err })
    })

    if (!department) {
      winston.error("(Users Availables) department not found")
      return res.status(404).send({ success: false, error: "Department " + dep_id + " not found" })
    }

    let group_id = department.id_group;
    if (group_id) {
      let group = await Group.findById(group_id).catch((err) => {
        winston.error("(Users Availables) find group error: ", err)
        return res.status(500).send({ success: false, error: err })
      })

      if (!group) {
        winston.error("(Users Availables) group not found")
        return res.status(404).send({ success: false, error: "Group " + group_id + " not found" })
      }

      query.id_user = { $in: group.members.map(id => mongoose.Types.ObjectId(id) )}
    }
  } 
  
  winston.debug("(Users Availables) project_users query ", query)
  Project_user.find(query)
      .populate('id_user')
      .exec( async (err, project_users) => {
        if (err) {
          winston.debug('PROJECT ROUTES - FINDS AVAILABLES project_users - ERROR: ', err);
          return res.status(500).send({ success: false, msg: 'Error getting object.' + err});
        }

        let project = await Project.findById(projectid).catch((err) => {
          winston.error("find project error: ", err)
          res.status(500).send({ success: false, error: err })
        })

        // check on SMART ASSIGNMENT
        let available_agents = projectUserService.checkAgentsAvailablesWithSmartAssignment(project, project_users);
        winston.verbose("(Users Availables) available agents after smart assignment check", available_agents);

        if (available_agents) {
  
          available_agents_array = [];
          available_agents.forEach(agent => {
            //console.log("agent: ", agent);
            if (agent.id_user) {
              available_agents_array.push({ 
                "id": agent.id_user._id, 
                "pu_id": agent._id,
                "fullname": agent.id_user.firstname + " " + agent.id_user.lastname,
                "email": agent.id_user.email,
                "assigned_request": agent.number_assigned_requests
              });
            } else {
              winston.warn("(Users Availables) agent.id_user is undefined");
            }
          });

          winston.debug("(Users Availables) return following available_agents_array", available_agents_array);
          res.json(available_agents_array);
        }
      })
  
})

// OLD ENDPOINT for /users/availables
//togli questo route da qui e mettilo in altra route
// NEW -  RETURN  THE USER NAME AND THE USER ID OF THE AVAILABLE PROJECT-USER FOR THE PROJECT ID PASSED
// router.get('/:projectid/users/availables', function (req, res) {
//   //winston.debug("PROJECT ROUTES FINDS AVAILABLES project_users: projectid", req.params.projectid);

//   if (req.query.raw && (req.query.raw === true || req.query.raw === 'true')) {
//     Project_user.find({ id_project: req.params.projectid, user_available: true, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}}).
//           populate('id_user').
//           exec(function (err, project_users) {
//             if (err) {
//               winston.debug('PROJECT ROUTES - FINDS AVAILABLES project_users - ERROR: ', err);
//               return res.status(500).send({ success: false, msg: 'Error getting object.' });
//             }
//             if (project_users) {
  
//               user_available_array = [];
//               project_users.forEach(project_user => {
//                 if (project_user.id_user) {
//                   // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
//                   user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
//                 } else {
//                   // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER (else): ', project_user)
//                 }
//               });
  
//               //winston.debug('ARRAY OF THE AVAILABLE USER ', user_available_array);
//               res.json(user_available_array);
//             }
//           });
//   } else {
//     operatingHoursService.projectIsOpenNow(req.params.projectid, function (isOpen, err) {
//       //winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT: ', isOpen);
  
//       if (err) {
//         winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - EROR: ', err)
//         // sendError(err, res);
//         return res.status(500).send({ success: false, msg: err });
//       } else if (isOpen) {
  
//         Project_user.find({ id_project: req.params.projectid, user_available: true, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}}).
//           populate('id_user').
//           exec(function (err, project_users) {
//             if (err) {
//               winston.debug('PROJECT ROUTES - FINDS AVAILABLES project_users - ERROR: ', err);
//               return res.status(500).send({ success: false, msg: 'Error getting object.' });
//             }
//             if (project_users) {
  
//               user_available_array = [];
//               project_users.forEach(project_user => {
//                 if (project_user.id_user) {
//                   // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
//                   user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
//                 } else {
//                   // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER (else): ', project_user)
//                 }
//               });
  
//               //winston.debug('ARRAY OF THE AVAILABLE USER ', user_available_array);
  
//               res.json(user_available_array);
//             }
//           });
  
  
//       } else {
//        // winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PRJCT: ', isOpen, ' -> AVAILABLE EMPTY');
//         // closed
//         user_available_array = [];
//         res.json(user_available_array);
//       }
//     });
//   }

  

// });





module.exports = router;
