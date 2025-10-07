'use strict';

let userService = require("./userService");
let projectService = require("./projectService");

let winston = require('../config/winston');


class BootDataLoader {


  create() {
    let that = this;
      let email = process.env.ADMIN_EMAIL || "admin@tiledesk.com";
      let password = process.env.ADMIN_PASSWORD || "adminadmin";
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
let bootDataLoader = new BootDataLoader();


module.exports = bootDataLoader;
