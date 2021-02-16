var express = require('express');

// https://stackoverflow.com/questions/28977253/express-router-undefined-params-with-router-use-when-split-across-files
var router = express.Router({mergeParams: true});

var Message = require("../models/message");
var Request = require("../models/request");

var requestService = require('../services/requestService');
var messageService = require('../services/messageService');
var leadService = require('../services/leadService');
var winston = require('../config/winston');

var MessageConstants = require("../models/messageConstants");
var cacheUtil = require('../utils/cacheUtil');

const { check, validationResult } = require('express-validator');

var Project_user = require("../models/project_user");
var mongoose = require('mongoose');

csv = require('csv-express');
csv.separator = ';';

// var roleChecker = require('../middleware/has-role');

router.post('/', 
// se type image text può essere empty validare meglio.
// [
//   check('text').notEmpty(),  
// ],
// 
async (req, res)  => {
// function(req, res) {

  winston.debug('req.body post message', req.body);
  winston.debug('req.params: ', req.params);
  winston.debug('req.params.request_id: ' + req.params.request_id);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  
  var project_user = req.projectuser;
  var sender = req.body.sender;


  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;
  winston.debug('messageStatus: ' + messageStatus);

      // cacherequest       // requestcachefarequi nocachepopulatereqired
      return Request.findOne({request_id: req.params.request_id, id_project: req.projectid})
        // .populate('lead')
        // .populate('department')
        // .populate('participatingBots')
        // .populate('participatingAgents')  
        // .populate({path:'requester',populate:{path:'id_user'}})
        .cache(cacheUtil.defaultTTL, req.projectid+":requests:request_id:"+req.params.request_id)
        .exec(async(err, request) => {

        if (err) {
          winston.log({
              level: 'error',
              message: 'Error getting the request: '+ JSON.stringify(err) + " " + JSON.stringify(req.body) ,
              label: req.projectid
            });
          // winston.error('Error getting the request.', err);
          return res.status(500).send({success: false, msg: 'Error getting the request.', err:err});
        }

        if (!request) { //the request doen't exists create it

              winston.debug("request not exists", request);                                     

              if (project_user) {
                winston.debug("project_user", project_user);                                     
              }
              
              if (sender) {

                var isObjectId = mongoose.Types.ObjectId.isValid(sender);
                winston.debug("isObjectId:"+ isObjectId);
            
                 var queryProjectUser = {id_project:req.projectid, status: "active" };
            
                if (isObjectId) {
                  queryProjectUser.id_user = sender;
                } else {
                  queryProjectUser.uuid_user = sender;
                }
            
                winston.info("queryProjectUser", queryProjectUser);
                
                project_user = await Project_user.findOne(queryProjectUser);
                winston.info("queryProjectUser", queryProjectUser);
            
                if (!project_user) {
                  return res.status(403).send({success: false, msg: 'Unauthorized. Project_user not found with user id  : '+ sender });
                }
              }

              

              // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy, attributes) {
              return leadService.createIfNotExistsWithLeadId(sender || req.user._id, req.body.senderFullname || req.user.fullName , req.body.email || req.user.email, req.projectid, null, req.body.attributes || req.user.attributes)
              .then(function(createdLead) {

              
                var new_request = {                                     // problema
                  request_id: req.params.request_id, project_user_id: project_user._id, lead_id: createdLead._id, id_project:req.projectid,
                  first_text: req.body.text, departmentid: req.body.departmentid, sourcePage:req.body.sourcePage, 
                  language: req.body.language, userAgent:req.body.userAgent, status:null, createdBy: req.user._id,
                  attributes: req.body.attributes, subject: req.body.subject, preflight:undefined, channel: req.body.channel, location: req.body.location,
                  participants: req.body.participants,
                  lead: createdLead, requester: project_user
                };
  
                return requestService.create(new_request).then(function (savedRequest) {

                  // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, 
                  //  createdBy, attributes, subject, preflight, channel, location) {
                    
                // return requestService.createWithIdAndRequester(req.params.request_id, req.projectuser._id, createdLead._id, req.projectid, 
                //   req.body.text, req.body.departmentid, req.body.sourcePage, 
                //   req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes, req.body.subject, undefined, req.body.channel, req.body.location ).then(function (savedRequest) {


             
                    
                    // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type, channel) {
                    return messageService.create(sender || req.user._id, req.body.senderFullname || req.user.fullName, req.params.request_id, req.body.text,
                      req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, undefined, req.body.channel).then(function(savedMessage){                    
                        
                        // return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {

                          let message = savedMessage.toJSON();

                          savedRequest
                            .populate('lead')
                            .populate('department')
                            .populate('participatingBots')
                            .populate('participatingAgents')  
                            .populate({path:'requester',populate:{path:'id_user'}})
                            .execPopulate(function (err, savedRequestPopulated){    

                            if (err) {
                              return winston.error("Error gettting savedRequestPopulated for send Message", err);
                            }            

                            message.request = savedRequestPopulated;

                            return res.json(message);
                          });
                        });
                    });                           
                      
                  });
                            


        } else {

      

          winston.debug("request  exists", request.toObject());
      
         
               // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type, channel) {                 
              return messageService.create(sender || req.user._id, req.body.senderFullname || req.user.fullName, req.params.request_id, req.body.text,
                request.id_project, null, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, undefined, req.body.channel).then(function(savedMessage){

                  // TOOD update also request attributes and sourcePage
                  // return requestService.incrementMessagesCountByRequestId(request.request_id, request.id_project).then(function(savedRequest) {
                    // console.log("savedRequest.participants.indexOf(message.sender)", savedRequest.participants.indexOf(message.sender));
                     
                    if (request.participants && request.participants.indexOf(sender) > -1) { //update waiitng time if write an  agent (member of participants)
                      winston.debug("updateWaitingTimeByRequestId");
                      return requestService.updateWaitingTimeByRequestId(request.request_id, request.id_project).then(function(upRequest) {
                          let message = savedMessage.toJSON();
                          message.request = upRequest;
                          return res.json(message);
                      });
                    }else {
                      let message = savedMessage.toJSON();

                      request.populate('lead')
                      .populate('department')
                      .populate('participatingBots')
                      .populate('participatingAgents')  
                      .populate({path:'requester',populate:{path:'id_user'}})
                      .execPopulate(function (err, requestPopulated){    

                        if (err) {
                          return winston.error("Error gettting savedRequestPopulated for send Message", err);
                        }   
                        
                        message.request = requestPopulated;

                        return res.json(message);

                      });                     
                    }
                  // });
                }).catch(function(err){
                  winston.log({
                    level: 'error',
                    message: 'Error creating message: '+ JSON.stringify(err) + " " + JSON.stringify(req.body) ,
                    label: req.projectid
                  });
                  // winston.error("Error creating message", err);
                  return res.status(500).send({success: false, msg: 'Error creating message', err:err });
                });



        }
      


      });




});




// router.put('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.findByIdAndUpdate(req.params.messageid, req.body, {new: true, upsert:true}, function(err, updatedMessage) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error updating object.'});
//       }
//       res.json(updatedMessage);
//     });
//   });


//   router.delete('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.remove({_id:req.params.messageid}, function(err, Message) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error deleting object.'});
//       }
//       res.json(Message);
//     });
//   });


  router.get('/:messageid', function(req, res) {
  
    console.log(req.body);
    
    Message.findById(req.params.messageid, function(err, message) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }
      if(!message){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      res.json(message);
    });
  });



router.get('/', function(req, res) {

  return Message.find({"recipient": req.params.request_id, id_project: req.projectid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) return next(err);
      res.json(messages);
    });
});

router.get('/csv', function(req, res) {

  return Message.find({"recipient": req.params.request_id, id_project: req.projectid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) return next(err);
      res.csv(messages, true);
    });
});


module.exports = router;