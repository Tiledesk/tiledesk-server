var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Project_user = require("../../models/project_user");

var winston = require('../../config/winston');

// THE THREE FOLLOWS IMPORTS  ARE USED FOR AUTHENTICATION IN THE ROUTE
var passport = require('passport');
require('../../middleware/passport')(passport);
var validtoken = require('../../middleware/valid-token')
var RoleConstants = require("../../models/roleConstants");
var cacheUtil = require('../../utils/cacheUtil');
const { Query } = require('mongoose');


router.get('/:contact_id', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], async (req, res) => {
  winston.debug('REQ USER ID ', req.user._id);
  
  var isObjectId = mongoose.Types.ObjectId.isValid(req.user._id);
  winston.debug("isObjectId:"+ isObjectId);     

  var query = { role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" };
  winston.debug(' query: ',query);


  if (isObjectId) {
    query.id_user = req.user._id;
    // query.id_user = mongoose.Types.ObjectId(contact_id);
  } else {
    query.uuid_user = req.user._id;
  }

  var projects = await Project_user.find(query).    
    exec(); 

  var projectsArray = [];
  projects.forEach(project => {
    projectsArray.push(project.id_project);
    // projectsArray.push(mongoose.Types.ObjectId(project.id_project));
  });
    

  var contact_id = req.params.contact_id;
  winston.debug('contact_id: '+ contact_id);

  isObjectId = mongoose.Types.ObjectId.isValid(contact_id);
  winston.debug("isObjectId:"+ isObjectId);                             

  query = { id_project: { $in : projectsArray }, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" };
  winston.debug(' query: ',query);

  if (isObjectId) {
    query.id_user = contact_id;
    // query.id_user = mongoose.Types.ObjectId(contact_id);
  } else {
    query.uuid_user = contact_id;
  }

  winston.debug("query: ", query);

  var teammates = await Project_user.find(query).
  populate('id_project').
  populate('id_user').
  exec(); 

  var result = [];
  if (teammates && teammates.length>0) {  
    teammates.forEach(teammate => {
      
      var contact = {};
      if (teammate.id_user) {
        contact.uid = teammate.id_user._id;
        contact.email = teammate.id_user.email;
        contact.firstname = teammate.id_user.firstname;
        contact.lastname = teammate.id_user.lastname;

        if (teammate.id_project) {
          contact.description =  teammate.id_project.name;
        }

        // if (teammate.id_user.createdAt) {
        //   contact.timestamp = teammate.id_user.createdAt.getTime();
        // }
        
        // winston.info("teammate: "+ JSON.stringify(teammate));

        var contactFound = result.filter(c => c.uid === contact.uid );
        winston.debug("contactFound: "+ JSON.stringify(contactFound));

        // var index = result.indexOf(contactFound);
        let index = result.findIndex(c => c.uid === contact.uid );

        winston.debug("index: "+ index);

        if (contactFound.length==0) {
          winston.debug("not found");
          result.push(contact);
        }else {
          winston.debug("found",contactFound);
          // contactFound[0].description = "sssss";
          contactFound[0].description= contactFound[0].description + ", "+teammate.id_project.name;
          result[index] = contactFound[0];
          
        }
      }
      

    });
  }

  winston.debug("send");

  if (result && result.length>0) {
    res.json(result[0]);
  }else {
    res.json({});
  }
  
    
  
});




router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], async (req, res) => {
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

  var query = { role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" };

  var isObjectId = mongoose.Types.ObjectId.isValid(req.user._id);
  winston.debug("isObjectId:"+ isObjectId);                             

  if (isObjectId) {
    query.id_user = req.user._id;
    // query.id_user = mongoose.Types.ObjectId(contact_id);
  } else {
    query.uuid_user = req.user._id;
  }



  var projects = await Project_user.find(query).    
    exec(); 

    var projectsArray = [];
    projects.forEach(project => {
      projectsArray.push(project.id_project);
    });
    
    var query = { id_project: { $in : projectsArray }, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" };
    winston.debug("query: ", query);

    var teammates = await Project_user.find(query).
    populate('id_project').
    populate('id_user').
    sort(sortQuery).
    exec(); 

    var result = [];

    if (teammates && teammates.length>0) {  
      teammates.forEach(teammate => {
        
        var contact = {};
        if (teammate.id_user) {
          contact.uid = teammate.id_user._id;
          contact.email = teammate.id_user.email;
          contact.firstname = teammate.id_user.firstname;
          contact.lastname = teammate.id_user.lastname;

          if (teammate.id_project) {
            contact.description =  teammate.id_project.name;
          }

          // if (teammate.id_user.createdAt) {
          //   contact.timestamp = teammate.id_user.createdAt.getTime();
          // }
          
          // winston.info("teammate: "+ JSON.stringify(teammate));

          var contactFound = result.filter(c => c.uid === contact.uid );
          winston.debug("contactFound: "+ JSON.stringify(contactFound));

          // var index = result.indexOf(contactFound);
          let index = result.findIndex(c => c.uid === contact.uid );

          winston.debug("index: "+ index);

          if (contactFound.length==0) {
            winston.debug("not found");
            result.push(contact);
          }else {
            winston.debug("found",contactFound);
            // contactFound[0].description = "sssss";
            contactFound[0].description= contactFound[0].description + ", "+teammate.id_project.name;
            result[index] = contactFound[0];
            
          }
        }
        

      });
    }
    winston.debug("send");
    res.json(result);
    
  
});





module.exports = router;
