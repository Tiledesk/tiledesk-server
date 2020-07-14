var express = require('express');
var router = express.Router();

var Project_user = require("../../models/project_user");

var winston = require('../../config/winston');

// THE THREE FOLLOWS IMPORTS  ARE USED FOR AUTHENTICATION IN THE ROUTE
var passport = require('passport');
require('../../middleware/passport')(passport);
var validtoken = require('../../middleware/valid-token')
var RoleConstants = require("../../models/roleConstants");
var cacheUtil = require('../../utils/cacheUtil');
const { Query } = require('mongoose');


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


  var projects = await Project_user.find({ id_user: req.user._id , role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]}}).
    populate({
      path: 'id_project',
      // match: { status: 100 }, //not filter only not populate
    }).
    exec(); 

    var projectsArray = [];
    projects.forEach(project => {
      projectsArray.push(project.id_project._id);
    });
    
    var query = { id_project: { $in : projectsArray }, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]}};
    winston.info("query: ", query);

    var teammates = await Project_user.find().
    populate({
      path: 'id_project',
      path: 'id_user',
      // match: { status: 100 }, //not filter only not populate
    }).
    sort(sortQuery).
    exec(); 

    var result = [];
    teammates.forEach(teammate => {
      
      var contact = {};
      if (teammate.id_user) {
        contact.uid = teammate.id_user._id;
        contact.email = teammate.id_user.email;
        contact.firstname = teammate.id_user.firstname;
        contact.lastname = teammate.id_user.lastname;
        contact.description = teammate.id_project.name;

        if (teammate.id_user.createdAt) {
          contact.timestamp = teammate.id_user.createdAt.getTime();
        }
        
        winston.info("teammate: "+ JSON.stringify(teammate));

        var contactFound = result.filter(c => c.id_user && c.id_user._id === contact.uid );
        winston.info("contactFound: "+ JSON.stringify(contactFound));

        if (contactFound.length==0) {
          winston.info("not found");
          result.push(contact);
        }else {
          winston.info("found");
          contactFound.description=contactFound.description+" ,"+teammate.id_project.name;
        }
      }
      

    });
    res.json(result);
    
  
});





module.exports = router;
