// 'use strict';

var Project = require("../models/project");
var mongoose = require('mongoose');

class OperatingHoursService {


  projectIsOpenNow(projectId, callback) {

    console.log('[ O ] [ H ] [ S ] -> PROJECT ID ', projectId)
    Project.findById(projectId, function (err, project) {
      if (err) {
        console.log("[ O ] [ H ] [ S ] -> ERROR GETTING PROJECT ", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!project) {
        console.log("[ O ] [ H ] [ S ] -> PROJECT NOT FOUND");
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      console.log("PROJECT-ROUTES - NEW AVAILABLES - REQ BODY: ", project);

      if (project) {
        // console.log("[ O ] [ H ] [ S ] -> PROJECT FOUND: ", project);
        console.log("[ O ] [ H ] [ S ] -> PROJECT: IS ACTIVE OH: ", project.activeOperatingHours);
        console.log("[ O ] [ H ] [ S ] -> PROJECT: OBJECT OPERATING HOURS: ", project.operatingHours);
        if (project.activeOperatingHours == true && project.operatingHours == '') {

          console.log('[ O ] [ H ] [ S ] -> OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' BUT OBJECT OPERATING HOURS IS EMPTY')
  
          callback(false); 
        }
        

        if (project.activeOperatingHours == false) {

          console.log('[ O ] [ H ] [ S ] -> OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' BUT OBJECT OPERATING HOURS IS EMPTY')
  
          callback(false); 
        }
      }

      
    });


  }

  sayHelloInEnglish() {
    return "HELLO";
  }



}
var operatingHoursService = new OperatingHoursService();

module.exports = operatingHoursService;
