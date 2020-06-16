'use strict';

var userService = require("./userService");
var projectService = require("./projectService");

var winston = require('../config/winston');


class BootDataLoader {


  create() {
    var that = this;
      var email = process.env.ADMIN_EMAIL || "admin@tiledesk.com";
      var password = process.env.ADMIN_PASSWORD || "adminadmin";
      userService.signup(email, password, "Administrator", " ", true)
      .then(function (savedUser) {
        winston.info("Created admin user with email "+ email + " and password "+ password);
        projectService.create("default", savedUser.id, undefined).then(function (savedProject) {
          winston.debug("Created default project");
        }).catch(function(err) {
          winston.error("Error creating default project ", err);
        });
      }).catch(function(err) {
        if (err.code == 11000) {
          winston.info("Admin user already exists");
        }else {
          winston.error("Error creating initial data ", err);
        }
    }); 
  }


}
var bootDataLoader = new BootDataLoader();


module.exports = bootDataLoader;
