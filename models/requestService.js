'use strict';

const nodemailer = require('nodemailer');
var config = require('../config/email');
var departmentService = require('../models/departmentService');
var Request = require("../models/request");

class RequestService {




  create(requester_id, requester_fullname, id_project, first_text, departmentid, sourcePage, language, userAgent) {

    return departmentService.getOperators(departmentid, id_project, false).then(function (result) {

        console.log("result1111", result);

            var newRequest = new Request({
              requester_id: requester_id,
              requester_fullname: requester_fullname,
              first_text: first_text,
              // support_status: req.body.support_status,
              // partecipants: req.body.partecipants,
              departmentid: departmentid,

          
              // rating: req.body.rating,
              // rating_message: req.body.rating_message,
          
               agents: result.agents,
               availableAgents: result.available_agents,

               // assigned_operator_id:  result.assigned_operator_id,
          
              //others
              sourcePage: sourcePage,
              language: language,
              userAgent: userAgent,
          
              //standard
              id_project: id_project,
              createdBy: requester_id,
              updatedBy: requester_id
            });
          
            return new Promise(function (resolve, reject) {

              newRequest.save(function(err, savedRequest) {
                if (err) {
                  console.log('Error saving object.',err);
                  reject(err);
                }
            
            
                console.log("savedRequest",savedRequest);
                
                // console.log("XXXXXXXXXXXXXXXX");
                //this.sendEmail(req.projectid, savedRequest);
                
                
            
                resolve(savedRequest);
                
              });
          });


    });

    
    
    

  }
  


 




}


var requestService = new RequestService();


module.exports = requestService;
