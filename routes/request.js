var express = require('express');
var router = express.Router();
var Request = require("../models/request");
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var moment = require('moment');
var requestService = require('../services/requestService');
var emailService = require('../services/emailService');

var departmentService = require('../services/departmentService');
var winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
var Subscription = require("../models/subscription");
var leadService = require('../services/leadService');
var messageService = require('../services/messageService');
const uuidv4 = require('uuid/v4');
var MessageConstants = require("../models/messageConstants");
var Message = require("../models/message");
var cacheUtil = require('../utils/cacheUtil');
var RequestConstants = require("../models/requestConstants");
var cacheEnabler = require("../services/cacheEnabler");
var Project_user = require("../models/project_user");
var Lead = require("../models/lead");
var UIDGenerator = require("../utils/UIDGenerator");


csv = require('csv-express');
csv.separator = ';';

const { check, validationResult } = require('express-validator');
const RoleConstants = require('../models/roleConstants');
const eventService = require('../pubmodules/events/eventService');

// var messageService = require('../services/messageService');



router.post('/simple', [check('first_text').notEmpty()], async (req, res) => {

  var startTimestamp = new Date();
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  if (req.projectuser) {
    winston.debug("req.projectuser", req.projectuser);
  }

  var project_user = req.projectuser;
})

// undocumented, used by test

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.create
router.post('/',
  [
    check('first_text').notEmpty(),
  ],
  async (req, res) => {

    var startTimestamp = new Date();
    winston.debug("request create timestamp: " + startTimestamp);

    winston.debug("req.body", req.body);

    winston.debug("req.projectid: " + req.projectid);
    winston.debug("req.user.id: " + req.user.id);


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.projectuser) {
      winston.debug("req.projectuser", req.projectuser);
    }

    var project_user = req.projectuser;

    var sender = req.body.sender;
    var fullname = req.body.senderFullname || req.user.fullName;
    var email = req.body.email || req.user.email;

    let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;
    winston.debug('messageStatus: ' + messageStatus);

    var request_id = req.body.request_id || 'support-group-' + req.projectid + "-" + UIDGenerator.generate();
    winston.debug('request_id: ' + request_id);

    if (sender) {

      var isObjectId = mongoose.Types.ObjectId.isValid(sender);
      winston.debug("isObjectId:" + isObjectId);

      var queryProjectUser = { id_project: req.projectid, status: "active" };

      if (isObjectId) {
        queryProjectUser.id_user = sender;
      } else {
        queryProjectUser.uuid_user = sender;
      }

      winston.debug("queryProjectUser", queryProjectUser);

      project_user = await Project_user.findOne(queryProjectUser).populate({ path: 'id_user', select: { 'firstname': 1, 'lastname': 1, 'email': 1 } })
      winston.debug("project_user", project_user);

      if (!project_user) {
        return res.status(403).send({ success: false, msg: 'Unauthorized. Project_user not found with user id  : ' + sender });
      }

      if (project_user.id_user) {
        fullname = project_user.id_user.fullName;
        winston.debug("pu fullname: " + fullname);
        email = project_user.id_user.email;
        winston.debug("pu email: " + email);
      } else if (project_user.uuid_user) {
        var lead = await Lead.findOne({ lead_id: project_user.uuid_user, id_project: req.projectid });
        winston.debug("lead: ", lead);
        if (lead) {
          fullname = lead.fullname;
          winston.debug("lead fullname: " + fullname);
          email = lead.email;
          winston.debug("lead email: " + email);
        } else {
          winston.warn("lead not found: " + JSON.stringify({ lead_id: project_user.uuid_user, id_project: req.projectid }));
        }

      } else {
        winston.warn("pu fullname and email empty");
      }

    }


    // createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy, attributes) {
    return leadService.createIfNotExistsWithLeadId(sender || req.user._id, fullname, email, req.projectid, null, req.body.attributes || req.user.attributes)
      .then(function (createdLead) {



        var new_request = {
          request_id: request_id,
          project_user_id: req.projectuser._id,
          lead_id: createdLead._id,
          id_project: req.projectid,
          first_text: req.body.first_text,
          departmentid: req.body.departmentid,
          sourcePage: req.body.sourcePage,
          language: req.body.language,
          userAgent: req.body.userAgent,
          status: null,
          createdBy: req.user._id,
          attributes: req.body.attributes,
          subject: req.body.subject,
          preflight: undefined,
          channel: req.body.channel,
          location: req.body.location,
          participants: req.body.participants,
          lead: createdLead, requester: project_user,
          priority: req.body.priority,
          followers: req.body.followers,
        };

        return requestService.create(new_request).then(function (savedRequest) {
          // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
          // return requestService.createWithIdAndRequester(request_id, req.projectuser._id, createdLead._id, req.projectid, 
          //   req.body.text, req.body.departmentid, req.body.sourcePage, 
          //   req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes, req.body.subject).then(function (savedRequest) {


          // return messageService.create(sender || req.user._id, fullname, request_id, req.body.text,
          // req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, undefined, req.body.channel).then(function(savedMessage){                    

          // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
          // return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, request_id, req.body.text,
          //   req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata).then(function(savedMessage){                    


          winston.debug('res.json(savedRequest)');
          var endTimestamp = new Date();
          winston.verbose("request create end: " + (endTimestamp - startTimestamp));
          return res.json(savedRequest);
          // });
          // });
        }).catch((err) => {
          winston.error("(Request) create request error ", err)
          return res.status(500).send({ success: false, message: "Unable to create request", err: err })
        });





      }).catch(function (err) {
        winston.error('Error saving request.', err);
        return res.status(500).send({ success: false, msg: 'Error saving object.', err: err });

      });
  });





// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.patch('/:requestid', function (req, res) {
  winston.debug(req.body);
  // const update = _.assign({ "updatedAt": new Date() }, req.body);
  //const update = req.body;
  const update = {};

  if (req.body.lead) {
    update.lead = req.body.lead;
  }

  // TODO test it. does it work?
  if (req.body.status) {
    update.status = req.body.status;
  }

  if (req.body.tags) {
    update.tags = req.body.tags;
  }

  // if (req.body.notes) {
  //   update.notes = req.body.notes;
  // }

  if (req.body.rating) {
    update.rating = req.body.rating;
  }

  if (req.body.rating_message) {
    update.rating_message = req.body.rating_message;
  }

  if (req.body.sourcePage) {
    update.sourcePage = req.body.sourcePage;
  }

  if (req.body.language) {
    update.language = req.body.language;
  }

  if (req.body.first_text) {
    update.first_text = req.body.first_text;
  }

  if (req.body.subject) {
    update.subject = req.body.subject;
  }

  if (req.body.location) {
    update.location = req.body.location;
  }
  if (req.body.priority) {
    update.priority = req.body.priority;
  }

  if (req.body.smartAssignment != undefined) {
    update.smartAssignment = req.body.smartAssignment;
  }

  if (req.body.workingStatus != undefined) {
    update.workingStatus = req.body.workingStatus;
  }


  if (req.body.channelName) {
    update["channel.name"] = req.body.channelName;
  }



  winston.verbose("Request patch update", update);

  //cacheinvalidation
  return Request.findOneAndUpdate({ "request_id": req.params.requestid, "id_project": req.projectid }, { $set: update }, { new: true, upsert: false })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')
    .populate({ path: 'requester', populate: { path: 'id_user' } })
    .exec(function (err, request) {

      if (err) {
        winston.error('Error patching request.', err);
        return res.status(500).send({ success: false, msg: 'Error updating object.' });
      }

      if (!request) {
        return res.status(404).send({ success: false, msg: 'Request not found' });
      }

      requestEvent.emit("request.update", request);
      requestEvent.emit("request.update.comment", { comment: "PATCH", request: request }); //Deprecated
      requestEvent.emit("request.updated", { comment: "PATCH", request: request, patch: update });
      return res.json(request);
    });

});


// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.put('/:requestid/close', async function (req, res) {
  winston.debug(req.body);
  let request_id = req.params.requestid;
  
  /**
   * Check on projectuser existence.
   * If req.projectuser is null then the request was made by a chatbot.
   */
  let project_user = req.projectuser;
  let user_role;
  if (project_user) {
    user_role = project_user.role;
  }

  const closed_by = req.user.id;

  if (user_role && (user_role !== RoleConstants.OWNER && user_role !== RoleConstants.ADMIN)) {
    let request = await Request.findOne({ id_project: req.projectid, request_id: request_id }).catch((err) => {
      winston.error("Error finding request: ", err);
      return res.status(500).send({ success: false, error: "Error finding request with request_id " + request_id })
    })
  
    if (!request) {
      winston.verbose("Request with request_id " + request_id)
      return res.status(404).send({ success: false, error: "Request not found"})
    }
  
    if (!request.participantsAgents.includes(req.user.id)) {
      winston.verbose("Request can't be closed by a non participant. Attempt made by " + req.user.id);
      return res.status(403).send({ success: false, error: "You must be among the participants to close a conversation."})
    }
  }

  return requestService.closeRequestByRequestId(req.params.requestid, req.projectid, false, true, closed_by, req.body.force).then(function (closedRequest) {
    winston.verbose("request closed", closedRequest);
    return res.json(closedRequest);
  });

});

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.put('/:requestid/reopen', function (req, res) {
  winston.debug(req.body);
  // reopenRequestByRequestId(request_id, id_project) {
  return requestService.reopenRequestByRequestId(req.params.requestid, req.projectid).then(function (reopenRequest) {

    winston.verbose("request reopen", reopenRequest);

    return res.json(reopenRequest);
  });


});


// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.put('/:requestid/assignee', function (req, res) {
  winston.debug(req.body);
  //TODO change assignee
});

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.post('/:requestid/participants',
  [
    check('member').notEmpty(),
  ],
  function (req, res) {
    winston.debug(req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    //addParticipantByRequestId(request_id, id_project, member)
    return requestService.addParticipantByRequestId(req.params.requestid, req.projectid, req.body.member).then(function (updatedRequest) {

      winston.verbose("participant added", updatedRequest);

      return res.json(updatedRequest);
    });

  });

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
/*
error: uncaughtException: Cannot set property 'participants' of null
2020-03-08T12:53:35.793660+00:00 app[web.1]: TypeError: Cannot set property 'participants' of null
2020-03-08T12:53:35.793660+00:00 app[web.1]:     at /app/services/requestService.js:672:30
2020-03-08T12:53:35.793661+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:4779:16
*/
router.put('/:requestid/participants', function (req, res) {
  winston.debug("req.body", req.body);

  var participants = [];
  req.body.forEach(function (participant, index) {
    participants.push(participant);
  });
  winston.debug("var participants", participants);

  //setParticipantsByRequestId(request_id, id_project, participants)
  return requestService.setParticipantsByRequestId(req.params.requestid, req.projectid, participants).then(function (updatedRequest) {

    winston.debug("participant set", updatedRequest);

    return res.json(updatedRequest);
  });

});

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.delete('/:requestid/participants/:participantid', function (req, res) {
  winston.debug(req.body);
  //removeParticipantByRequestId(request_id, id_project, member)
  return requestService.removeParticipantByRequestId(req.params.requestid, req.projectid, req.params.participantid).then(function (updatedRequest) {

    winston.verbose("participant removed", updatedRequest);

    return res.json(updatedRequest);
  }).catch((err) => {
    //winston.error("(Request) removeParticipantByRequestId error", err)
    return res.status(400).send({ success: false, error: "Unable to remove the participant " + req.params.participantid +  " from the request " + req.params.requestid})
  });


});

// // TODO deprecated
// router.delete('/:requestid/participants', function (req, res) {
//   winston.debug(req.body);

//    //removeParticipantByRequestId(request_id, id_project, member)
//   return requestService.removeParticipantByRequestId(req.params.requestid, req.projectid, req.body.member ).then(function(updatedRequest) {

//       winston.info("participant removed", updatedRequest);

//       return res.json(updatedRequest);
//   });


// });


// router.put('/queue/:requestid/assign', function (req, res) { //fai altro route file
//   winston.debug(req.body);
// });

router.put('/:requestid/assign', function (req, res) {
  winston.debug(req.body);

  let user = req.user;
  let pu;
  if (req.projectuser) {
    pu = req.projectuser._id
  }
  // leggi la request se già assegnata o già chiusa (1000) esci 

  //cacheinvalidation
  return Request.findOne({ "request_id": req.params.requestid, "id_project": req.projectid })
    .exec(function (err, request) {

      if (err) {
        winston.error('Error patching request.', err);
        return res.status(500).send({ success: false, msg: 'Error updating object.' });
      }

      if (!request) {
        return res.status(404).send({ success: false, msg: 'Request not found' });
      }

      if (request.status === RequestConstants.ASSIGNED || request.status === RequestConstants.SERVED || request.status === RequestConstants.CLOSED) {
        winston.info('Request already assigned');
        return res.json(request);
      }
      //route(request_id, departmentid, id_project) {      
      requestService.route(req.params.requestid, req.body.departmentid, req.projectid, req.body.nobot, req.body.no_populate).then(function (updatedRequest) {

        winston.debug("department changed", updatedRequest);

        if (updatedRequest.status === RequestConstants.ABANDONED) {
          eventService.emit('request.fully_abandoned', updatedRequest, req.projectid, pu, user._id, undefined, user)
        }

        return res.json(updatedRequest);
      }).catch(function (error) {
        winston.error('Error changing the department.', error)
        return res.status(500).send({ success: false, msg: 'Error changing the department.' });
      })
    });
});

// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.put('/:requestid/departments', function (req, res) {
  winston.debug(req.body);
  //route(request_id, departmentid, id_project) {      
  requestService.route(req.params.requestid, req.body.departmentid, req.projectid, req.body.nobot, req.body.no_populate).then(function (updatedRequest) {

    winston.debug("department changed", updatedRequest);

    return res.json(updatedRequest);
  }).catch(function (error) {
    winston.error('Error changing the department.', error)
    return res.status(500).send({ success: false, msg: 'Error changing the department.' });
  })
});


router.put('/:requestid/agent', async (req, res) => {
  winston.debug(req.body);
  //route(request_id, departmentid, id_project) { 


  var request = await Request.findOne({ "request_id": req.params.requestid, id_project: req.projectid })
    .exec();

  if (!request) {
    return res.status(404).send({ success: false, msg: 'Object not found.' });
  }

  var departmentid = request.department;
  winston.debug("departmentid before: " + departmentid);

  if (!departmentid) {
    var defaultDepartment = await departmentService.getDefaultDepartment(req.projectid);
    winston.debug("defaultDepartment: ", defaultDepartment);
    departmentid = defaultDepartment.id;
  }
  winston.debug("departmentid after: " + departmentid);

  requestService.route(req.params.requestid, departmentid, req.projectid, true, undefined).then(function (updatedRequest) {

    winston.debug("department changed", updatedRequest);

    return res.json(updatedRequest);
  }).catch(function (error) {
    winston.error('Error changing the department.', error)
    return res.status(500).send({ success: false, msg: 'Error changing the department.' });
  })


});

// router.post('/:requestid/attributes', function (req, res) {
//   winston.debug(req.body);

//   //return Request.findOneAndUpdate({"request_id":req.params.requestid},{ $push: { attributes: req.body } } , { new: true, upsert: false }, function (err, updatedMessage) {
//     return Request.findOneAndUpdate({"request_id":req.params.requestid},{ $set: { attributes: req.body } } , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });

// router.put('/:requestid/attributes/:attributeid', function (req, res) {
//   winston.debug(req.body);

//   return Request.findOneAndUpdate({"request_id":req.params.requestid, "attributes._id": req.params.attributeid},{ $set: { "attributes.$": req.body}} , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });

// router.delete('/:requestid/attributes/:attributeid', function (req, res) {
//   winston.debug(req.body);


//   return Request.findOneAndUpdate({"request_id":req.params.requestid},{ "$pull": { "attributes": { "_id": req.params.attributeid } }} , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });


router.patch('/:requestid/attributes', function (req, res) {
  var data = req.body;
  var id_project = req.projectid;

  // TODO use service method

  Request.findOne({ "request_id": req.params.requestid, id_project: id_project })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')
    .populate({ path: 'requester', populate: { path: 'id_user' } })
    .exec(function (err, request) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!request) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }


      if (!request.attributes) {
        winston.debug("empty attributes")
        request.attributes = {};
      }

      winston.debug(" req attributes", request.attributes)

      Object.keys(data).forEach(function (key) {
        var val = data[key];
        winston.debug("data attributes " + key + " " + val)
        request.attributes[key] = val;
      });

      winston.debug(" req attributes", request.attributes)

      // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
      request.markModified('attributes');

      //cacheinvalidation
      request.save(function (err, savedRequest) {
        if (err) {
          winston.error("error saving request attributes", err)
          return res.status(500).send({ success: false, msg: 'Error getting object.' });
        }
        winston.verbose(" saved request attributes", savedRequest.toObject())
        requestEvent.emit("request.update", savedRequest);
        requestEvent.emit("request.update.comment", { comment: "ATTRIBUTES_PATCH", request: savedRequest });//Deprecated
        requestEvent.emit("request.updated", { comment: "ATTRIBUTES_PATCH", request: savedRequest, patch: { attributes: data } });
        requestEvent.emit("request.attributes.update", savedRequest);
        res.json(savedRequest);
      });
    });

});

router.post('/:requestid/notes', async function (req, res) {
  
  let request_id = req.params.requestid
  var note = {};
  note.text = req.body.text;
  note.createdBy = req.user.id;

  let project_user = req.projectuser;

  if (project_user.role === RoleConstants.AGENT) {
    let request = await Request.findOne({ request_id: request_id }).catch((err) => {
      winston.error("Error finding request ", err);
      return res.status(500).send({ success: false, error: "Error finding request with id " +  request_id });
    })
  
    if (!request) {
      winston.warn("Request with id " + request_id + " not found.");
      return res.status(404).send({ success: false, error: "Request with id " + request_id + " not found."});
    }

    // Check if the user is a participant
    if (!request.participantsAgents.includes(req.user.id)) {
      winston.verbose("Trying to add a note from a non participating agent");
      return res.status(403).send({ success: false, error: "You are not participating in the conversation"})
    }
  }

  return Request.findOneAndUpdate({ request_id: request_id, id_project: req.projectid }, { $push: { notes: note } }, { new: true, upsert: false })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')
    .populate({ path: 'requester', populate: { path: 'id_user' } })
    .exec(function (err, updatedRequest) {

      if (err) {
        winston.error('Error adding request note.', err);
        return res.status(500).send({ success: false, msg: 'Error adding request object.' });
      }
      requestEvent.emit("request.update", updatedRequest);
      requestEvent.emit("request.update.comment", { comment: "NOTE_ADD", request: updatedRequest });//Deprecated
      requestEvent.emit("request.updated", { comment: "NOTE_ADD", request: updatedRequest, patch: { notes: note } });

      return res.json(updatedRequest);
    });

});


router.delete('/:requestid/notes/:noteid', async function (req, res) {

  let request_id = req.params.requestid
  let note_id = req.params.noteid;
  let project_user = req.projectuser;

  if (project_user.role === RoleConstants.AGENT) {
    let request = await Request.findOne({ request_id: request_id }).catch((err) => {
      winston.error("Error finding request ", err);
      return res.status(500).send({ success: false, error: "Error finding request with id " +  request_id });
    })
  
    if (!request) {
      winston.warn("Request with id " + request_id + " not found.");
      return res.status(404).send({ success: false, error: "Request with id " + request_id + " not found."});
    }
  
    // Check if the user is a participant
    if (!request.participantsAgents.includes(req.user.id)) {
      winston.verbose("Trying to delete a note from a non participating agent");
      return res.status(403).send({ success: false, error: "You are not participating in the conversation"})
    }
  }

  //cacheinvalidation
  return Request.findOneAndUpdate({ request_id: request_id, id_project: req.projectid }, { $pull: { notes: { "_id": note_id } } }, { new: true, upsert: false })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')
    .populate({ path: 'requester', populate: { path: 'id_user' } })
    .exec(function (err, updatedRequest) {

      if (err) {
        winston.error('Error adding request note.', err);
        return res.status(500).send({ success: false, msg: 'Error adding request object.' });
      }
      requestEvent.emit("request.update", updatedRequest);
      requestEvent.emit("request.update.comment", { comment: "NOTE_DELETE", request: updatedRequest });//Deprecated
      // requestEvent.emit("request.updated", {comment:"NOTE_DELETE",request:updatedRequest, patch:  {notes:req.params.noteid}});

      return res.json(updatedRequest);
    });

});



//TODO add cc
router.post('/:requestid/email/send',
  async (req, res) => {


    let text = req.body.text;
    winston.debug("text: " + text);

    let request_id = req.params.requestid;
    winston.debug("request_id: " + request_id);

    let subject = req.body.subject;
    winston.debug("subject: " + subject);

    winston.debug("req.project", req.project);

    let replyto = req.body.replyto;
    winston.debug("replyto: " + replyto);


    let q = Request.findOne({ request_id: request_id, id_project: req.projectid })
      // .select("+snapshot.agents")
      .populate('lead')
    q.exec(function (err, request) {
      if (err) {
        winston.error("error getting request by id ", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!request) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }



      winston.debug("Sending an email with text : " + text + " to request_id " + request_id);

      if (!request.lead.email) {
        res.json({ "no queued": true });
      }

      let newto = request.lead.email
      winston.verbose("Sending an email newto " + newto);

      //sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage, payload)
      emailService.sendEmailDirect(newto, text, req.project, request_id, subject, undefined, undefined, undefined, replyto);

      res.json({ "queued": true });


    });




  });




router.post('/:requestid/followers',
  [
    check('member').notEmpty(),
  ],
  function (req, res) {
    winston.info("followers add", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    //addParticipantByRequestId(request_id, id_project, member)
    return requestService.addFollowerByRequestId(req.params.requestid, req.projectid, req.body.member).then(function (updatedRequest) {

      winston.verbose("participant added", updatedRequest);

      return res.json(updatedRequest);
    });

  });


router.put('/:requestid/followers', function (req, res) {
  winston.debug("req.body", req.body);

  var followers = [];
  req.body.forEach(function (follower, index) {
    followers.push(follower);
  });
  winston.debug("var followers", followers);

  // setFollowersByRequestId(request_id, id_project, newfollowers)
  return requestService.setFollowersByRequestId(req.params.requestid, req.projectid, followers).then(function (updatedRequest) {

    winston.debug("followers set", updatedRequest);

    return res.json(updatedRequest);
  });

});

router.delete('/:requestid/followers/:followerid', function (req, res) {
  winston.debug(req.body);

  //removeFollowerByRequestId(request_id, id_project, member)
  return requestService.removeFollowerByRequestId(req.params.requestid, req.projectid, req.params.followerid).then(function (updatedRequest) {

    winston.verbose("follower removed", updatedRequest);

    return res.json(updatedRequest);
  });


});






// TODO make a synchronous chat21 version (with query parameter?) with request.support_group.created
router.delete('/:requestid', function (req, res) {

  var projectuser = req.projectuser;


  if (projectuser.role != "owner") {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }

  Message.deleteMany({ recipient: req.params.requestid }, function (err) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting messages.' });
    }
    winston.verbose('Messages deleted for the recipient: ' + req.params.requestid);
  });


  Request.findOneAndDelete({ request_id: req.params.requestid }, function (err, request) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    if (!request) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    winston.verbose('Request deleted with request_id: ' + req.params.requestid);

    requestEvent.emit('request.delete', request);

    res.json(request);

  });

  // Request.remove({ request_id: req.params.requestid }, function (err, request) {
  //   if (err) {
  //     winston.error('--- > ERROR ', err);
  //     return res.status(500).send({ success: false, msg: 'Error deleting object.' });
  //   }

  //   if (!request) {
  //     return res.status(404).send({ success: false, msg: 'Object not found.' });
  //   }

  //   winston.verbose('Request deleted with request_id: ' + req.params.requestid);

  //   requestEvent.emit('request.delete', request);

  //   res.json(request);

  // });
});



router.delete('/id/:id', function (req, res) {

  var projectuser = req.projectuser;


  if (projectuser.role != "owner") {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }

  Request.remove({ _id: req.params.id }, function (err, request) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    if (!request) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    winston.verbose('Request deleted with id: ' + req.params.id);

    requestEvent.emit('request.delete', request);

    res.json(request);

  });
});




router.get('/', function (req, res, next) {

  const startExecTime = new Date();

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  const DEFAULT_LIMIT = 40;
  
  var page = 0;
  var limit = DEFAULT_LIMIT; // Number of request per page
  var page = 0;
  var skip = 0;
  let statusArray = [];
  var projectuser = req.projectuser;

  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  if (limit > 100) {
    limit = DEFAULT_LIMIT;
  }

  if (req.query.page) {
    page = req.query.page;
  }

  skip = page * limit;

  // Default query
  var query = { "id_project": req.projectid, "status": { $lt: 1000, $nin: [50, 150] }, preflight: false };

  if (req.user instanceof Subscription) {
    // All request 
  } else if (projectuser && (projectuser.role == "owner" || projectuser.role == "admin")) {
    // All request 
    // Per uni mostrare solo quelle proprie quindi solo participants
    if (req.query.mine) {
      query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }];
    }
  } else {
    query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }];
  }

  if (req.query.dept_id) {
    query.department = req.query.dept_id;
  }

  if (req.query.requester_email) {
    query["snapshot.lead.email"] = req.query.requester_email;
  }

  if (req.query.full_text) {
    query.$text = { "$search": req.query.full_text };
  }

  var history_search = false;

  // Multiple status management
  if (req.query.status) {
    if (req.query.status === 'all') {
      delete query.status;
    } else {
      let statusArray = req.query.status.split(',').map(Number);
      statusArray = statusArray.map(status => { return isNaN(status) ? null : status }).filter(status => status !== null)
      if (statusArray.length > 0) {
        query.status = {
          $in: statusArray
        }
      } else {
        delete query.status;
      }
    }
    if (statusArray.length > 0) {
      query.status = {
        $in: statusArray
      }
    }
  }

  if (req.query.lead) {
    query.lead = req.query.lead;
  }

  // USERS & BOTS
  if (req.query.participant) {
    query.participants = req.query.participant;
  }

  if (req.query.hasbot != undefined) {
    query.hasBot = req.query.hasbot;
  }

  if (req.query.tags) {
    query["tags.tag"] = req.query.tags;
  }

  if (req.query.location) {
    query.location = req.query.location;
  }

  if (req.query.ticket_id) {
    query.ticket_id = req.query.ticket_id;
  }

  if (req.query.preflight && (req.query.preflight === 'true' || req.query.preflight === true)) {
    //query.preflight = req.query.preflight;
    delete query.preflight;
  }

  // if (req.query.request_id) {
  //   console.log('req.query.request_id', req.query.request_id);
  //   query.request_id = req.query.request_id;
  // }

  /**
   **! *** DATE RANGE  USECASE 1 ***
   *  in the tiledesk dashboard's HISTORY PAGE
   *  WHEN THE TRIAL IS EXIPIRED OR THE SUBSCIPTION IS NOT ACTIVE
   *  THE SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS ARE DISABLED AND 
   *  ARE DISPLAYED ONLY THE REQUESTS OF THE LAST 14 DAYS
   */
  //fixato. secondo me qui manca un parentesi tonda per gli or
  if (history_search === true && req.project && req.project.profile && ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false))) {

    var startdate = moment().subtract(14, "days").format("YYYY-MM-DD");
    var enddate = moment().format("YYYY-MM-DD");

    winston.debug('»»» REQUEST ROUTE - startdate ', startdate);
    winston.debug('»»» REQUEST ROUTE - enddate ', enddate);

    var enddatePlusOneDay = moment(new Date()).add(1, 'days').toDate()
    winston.debug('»»» REQUEST ROUTE - enddate + 1 days: ', enddatePlusOneDay);

    query.createdAt = { $gte: new Date(Date.parse(startdate)).toISOString(), $lte: new Date(enddatePlusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);
  }

  /**
    **! *** DATE RANGE  USECASE 2 ***
    *  in the tiledesk dashboard's HISTORY PAGE 
    *  WHEN THE USER SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS
    */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }

    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    var range = { $gte: new Date(Date.parse(startDate)).toISOString() };
    if (req.query.filterRangeField) {
      query[req.query.filterRangeField] = range;
    } else {
      query.createdAt = range;
    }

    winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }

  if (req.query.snap_department_routing) {
    query["snapshot.department.routing"] = req.query.snap_department_routing;
  }

  if (req.query.snap_department_default) {
    query["snapshot.department.default"] = req.query.snap_department_default;
  }


  if (req.query.snap_department_id_bot) {
    query["snapshot.department.id_bot"] = req.query.snap_department_id_bot;
  }

  if (req.query.snap_department_id_bot_exists) {
    query["snapshot.department.id_bot"] = { "$exists": req.query.snap_department_id_bot_exists }
  }

  if (req.query.snap_lead_lead_id) {
    query["snapshot.lead.lead_id"] = req.query.snap_lead_lead_id;
  }

  if (req.query.snap_lead_email) {
    query["snapshot.lead.email"] = req.query.snap_lead_email;
  }

  if (req.query.smartAssignment) {
    query.smartAssignment = req.query.smartAssignment;
  }

  if (req.query.channel) {
    if (req.query.channel === "offline") {
      query["channel.name"] = { "$in": ["email", "form"] }
    } else if (req.query.channel === "online") {
      query["channel.name"] = { "$nin": ["email", "form"] }
    } else {
      query["channel.name"] = req.query.channel
    }
  }

  if (req.query.priority) {
    query.priority = req.query.priority;
  }


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }

  var sortQuery = {};
  sortQuery[sortField] = direction;

  // VOICE FILTERS - Start
  if (req.query.caller) {
    query["attributes.caller_phone"] = req.query.caller;
  }
  if (req.query.called) {
    query["attributes.called_phone"] = req.query.called;
  }
  if (req.query.call_id) {
    query["attributes.call_id"] = req.query.call_id;
  }
  // VOICE FILTERS - End

  if (req.query.duration && req.query.duration_op) {
    let duration = Number(req.query.duration) * 60 * 1000;
    if (req.query.duration_op === 'gt') {
      query.duration = { $gte: duration }
    } else if (req.query.duration_op === 'lt') {
      query.duration = { $lte: duration }
    } else {
      winston.verbose("Duration operator can be 'gt' or 'lt'. Skip duration_op " + req.query.duration_op)
    }
  }

  if (req.query.abandonded && (req.query.abandoned === true || req.query.abandoned === 'true')) {
    query["attributes.fully_abandoned"] = true
  }

  if (req.query.draft && (req.query.draft === 'false' || req.query.draft === false)) {
    query.draft = { $in: [false, null] }
  }

  var projection = undefined;

  if (req.query.full_text) {
    if (req.query.no_textscore != "true" && req.query.no_textscore != true) {
      winston.verbose('fulltext projection on');
      projection = { score: { $meta: "textScore" } };
    }
  }

  winston.verbose('REQUEST ROUTE - REQUEST FIND QUERY ', query);
  
  var q1 = Request.find(query, projection).
    skip(skip).limit(limit);

  if (req.query.no_populate != "true" && req.query.no_populate != true) {
    q1.populate('department').
      populate('participatingBots').            //nico già nn gli usa
      populate('participatingAgents').          //nico già nn gli usa
      populate('lead').
      populate({ path: 'requester', populate: { path: 'id_user' } });        //toglilo perche nico lo prende già da snapshot
  }

  if (req.query.full_text) {
    if (req.query.no_textscore != "true" && req.query.no_textscore != true) {
      q1.sort({ score: { $meta: "textScore" } }) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
    }
  } else {
    q1.sort(sortQuery);
  }

  q1.exec();

  // TODO if ?onlycount=true do not perform find query but only 
  // set q1 to undefined; to skip query

  var q2 = Request.countDocuments(query).exec();

  if (req.query.no_count && req.query.no_count == "true") {
    winston.info('REQUEST ROUTE - no_count ');
    q2 = 0;
  }

  var promises = [ q1, q2 ];

  Promise.all(promises).then(function (results) {
    var objectToReturn = {
      perPage: limit,
      count: results[1],
      requests: results[0]
    };
    winston.debug('REQUEST ROUTE - objectToReturn ');
    winston.debug('REQUEST ROUTE - objectToReturn ', objectToReturn);

    const endExecTime = new Date();
    winston.verbose('REQUEST ROUTE - exec time:  ' + (endExecTime - startExecTime));

    return res.json(objectToReturn);

  }).catch(function (err) {
    winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err);
    return res.status(500).send({ success: false, msg: 'Error getting requests.', err: err });
  });


});

// router.get('/', function (req, res, next) {

//   const startExecTime = new Date();

//   winston.debug("req projectid", req.projectid);
//   winston.debug("req.query.sort", req.query.sort);
//   winston.debug('REQUEST ROUTE - QUERY ', req.query)

//   const DEFAULT_LIMIT = 40;

//   var limit = DEFAULT_LIMIT; // Number of request per page

//   if (req.query.limit) {
//     limit = parseInt(req.query.limit);
//   }
//   if (limit > 100) {
//     limit = DEFAULT_LIMIT;
//   }


//   var page = 0;

//   if (req.query.page) {
//     page = req.query.page;
//   }

//   var skip = page * limit;
//   winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);


//   var query = { "id_project": req.projectid, "status": { $lt: 1000 }, preflight: false };

//   var projectuser = req.projectuser;


//   if (req.user instanceof Subscription) {
//     //all request 
//   } else if (projectuser && (projectuser.role == "owner" || projectuser.role == "admin")) {
//     //all request 
//     // per uni mostrare solo quelle priprio quindi solo participants
//     if (req.query.mine) {
//       query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }];
//     }
//   } else {
//     query["$or"] = [{ "snapshot.agents.id_user": req.user.id }, { "participants": req.user.id }];
//   }

//   // console.log('REQUEST ROUTE - req ', req); 
//   // console.log('REQUEST ROUTE - req.project ', req.project); 


//   if (req.query.dept_id) {
//     query.department = req.query.dept_id;
//     winston.debug('REQUEST ROUTE - QUERY DEPT ID', query.department);
//   }

//   if (req.query.requester_email) {
//     query["snapshot.lead.email"] = req.query.requester_email;
//   }

//   if (req.query.full_text) {
//     winston.debug('req.query.fulltext', req.query.full_text);
//     query.$text = { "$search": req.query.full_text };
//   }

//   var history_search = false;

//   if (req.query.status) {
//     winston.debug('req.query.status', req.query.status);
//     query.status = req.query.status;

//     if (req.query.status == 1000 || req.query.status == "1000") {
//       history_search = true;
//     }
//     if (req.query.status === "all") {
//       history_search = true;
//       delete query.status;
//     }
//   }

//   if (req.query.lead) {
//     winston.debug('req.query.lead', req.query.lead);
//     query.lead = req.query.lead;
//   }

//   // USERS & BOTS
//   if (req.query.participant) {
//     winston.debug('req.query.participant', req.query.participant);
//     query.participants = req.query.participant;
//   }

//   winston.debug('req.query.hasbot', req.query.hasbot);
//   if (req.query.hasbot != undefined) {
//     winston.debug('req.query.hasbot', req.query.hasbot);
//     query.hasBot = req.query.hasbot;
//   }

//   // if (req.query.waiting_time_exists) { //non basta aggiungi anche che nn è null
//   //   query.waiting_time = {"$exists": req.query.waiting_time_exists} //{$ne:null}
//   //   winston.debug('REQUEST ROUTE - QUERY waiting_time_exists', query.waiting_time_exists);
//   // }


//   if (req.query.tags) {
//     winston.debug('req.query.tags', req.query.tags);
//     query["tags.tag"] = req.query.tags;
//   }

//   if (req.query.location) {
//     query.location = req.query.location;
//   }

//   if (req.query.ticket_id) {
//     query.ticket_id = req.query.ticket_id;
//   }

//   if (req.query.preflight) {
//     query.preflight = req.query.preflight;
//   }

//   // if (req.query.request_id) {
//   //   console.log('req.query.request_id', req.query.request_id);
//   //   query.request_id = req.query.request_id;
//   // }

//   /**
//    **! *** DATE RANGE  USECASE 1 ***
//    *  in the tiledesk dashboard's HISTORY PAGE
//    *  WHEN THE TRIAL IS EXIPIRED OR THE SUBSCIPTION IS NOT ACTIVE
//    *  THE SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS ARE DISABLED AND 
//    *  ARE DISPLAYED ONLY THE REQUESTS OF THE LAST 14 DAYS
//    */
//   //fixato. secondo me qui manca un parentesi tonda per gli or
//   if (history_search === true && req.project && req.project.profile && ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false))) {


//     var startdate = moment().subtract(14, "days").format("YYYY-MM-DD");

//     var enddate = moment().format("YYYY-MM-DD");

//     winston.debug('»»» REQUEST ROUTE - startdate ', startdate);
//     winston.debug('»»» REQUEST ROUTE - enddate ', enddate);

//     var enddatePlusOneDay = moment(new Date()).add(1, 'days').toDate()
//     winston.debug('»»» REQUEST ROUTE - enddate + 1 days: ', enddatePlusOneDay);

//     // var enddatePlusOneDay = "2019-09-17T00:00:00.000Z"

//     query.createdAt = { $gte: new Date(Date.parse(startdate)).toISOString(), $lte: new Date(enddatePlusOneDay).toISOString() }
//     winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

//   }

//   /**
//     **! *** DATE RANGE  USECASE 2 ***
//     *  in the tiledesk dashboard's HISTORY PAGE 
//     *  WHEN THE USER SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS
//     */
//   if (req.query.start_date && req.query.end_date) {
//     winston.debug('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
//     winston.debug('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

//     /**
//      * USING TIMESTAMP  in MS    */
//     // var formattedStartDate = new Date(+req.query.start_date);
//     // var formattedEndDate = new Date(+req.query.end_date);
//     // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }

//     /**
//      * USING MOMENT      */
//     var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
//     var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

//     winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
//     winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

//     // ADD ONE DAY TO THE END DAY
//     var date = new Date(endDate);
//     var newdate = new Date(date);
//     var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
//     winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
//     // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
//     // var endDate_plusOneDay =   endDate.add(1).day();
//     // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

//     query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
//     winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

//   } else if (req.query.start_date && !req.query.end_date) {
//     winston.debug('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
//     var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

//     var range = { $gte: new Date(Date.parse(startDate)).toISOString() };
//     if (req.query.filterRangeField) {
//       query[req.query.filterRangeField] = range;
//     } else {
//       query.createdAt = range;
//     }

//     winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
//   }
//   // }



//   if (req.query.snap_department_routing) {
//     query["snapshot.department.routing"] = req.query.snap_department_routing;
//     winston.debug('REQUEST ROUTE - QUERY snap_department_routing', query.snap_department_routing);
//   }

//   if (req.query.snap_department_default) {
//     query["snapshot.department.default"] = req.query.snap_department_default;
//     winston.debug('REQUEST ROUTE - QUERY snap_department_default', query.snap_department_default);
//   }


//   if (req.query.snap_department_id_bot) {
//     query["snapshot.department.id_bot"] = req.query.snap_department_id_bot;
//     winston.debug('REQUEST ROUTE - QUERY snap_department_id_bot', query.snap_department_id_bot);
//   }

//   if (req.query.snap_department_id_bot_exists) {
//     query["snapshot.department.id_bot"] = { "$exists": req.query.snap_department_id_bot_exists }
//     winston.debug('REQUEST ROUTE - QUERY snap_department_id_bot_exists', query.snap_department_id_bot_exists);
//   }

//   if (req.query.snap_lead_lead_id) {
//     query["snapshot.lead.lead_id"] = req.query.snap_lead_lead_id;
//     winston.debug('REQUEST ROUTE - QUERY snap_lead_lead_id', query.snap_lead_lead_id);
//   }

//   if (req.query.snap_lead_email) {
//     query["snapshot.lead.email"] = req.query.snap_lead_email;
//     winston.debug('REQUEST ROUTE - QUERY snap_lead_email', query.snap_lead_email);
//   }

//   if (req.query.smartAssignment) {
//     query.smartAssignment = req.query.smartAssignment;
//     winston.debug('REQUEST ROUTE - QUERY smartAssignment', query.smartAssignment);
//   }

//   if (req.query.channel) {
//     if (req.query.channel === "offline") {
//       query["channel.name"] = { "$in": ["email", "form"] }
//     } else if (req.query.channel === "online") {
//       query["channel.name"] = { "$nin": ["email", "form"] }
//     } else {
//       query["channel.name"] = req.query.channel
//     }

//     winston.debug('REQUEST ROUTE - QUERY channel', query.channel);
//   }

//   if (req.query.priority) {
//     query.priority = req.query.priority;
//   }


//   var direction = -1; //-1 descending , 1 ascending
//   if (req.query.direction) {
//     direction = req.query.direction;
//   }
//   winston.debug("direction", direction);

//   var sortField = "createdAt";
//   if (req.query.sort) {
//     sortField = req.query.sort;
//   }
//   winston.debug("sortField", sortField);

//   var sortQuery = {};
//   sortQuery[sortField] = direction;
//   winston.debug("sort query", sortQuery);

//   if (req.query.draft && (req.query.draft === 'false' || req.query.draft === false)) {
//     query.draft = { $in: [false, null] }
//   }

//   winston.debug('REQUEST ROUTE - REQUEST FIND ', query);

//   var projection = undefined;

//   if (req.query.full_text) {

//     if (req.query.no_textscore != "true" && req.query.no_textscore != true) {
//       winston.info('fulltext projection on');
//       projection = { score: { $meta: "textScore" } };
//     }

//   }
//   // requestcachefarequi populaterequired
//   var q1 = Request.find(query, projection).
//     skip(skip).limit(limit);





//   winston.debug('REQUEST ROUTE no_populate:' + req.query.no_populate);

//   if (req.query.no_populate != "true" && req.query.no_populate != true) {
//     winston.verbose('REQUEST ROUTE - no_polutate false ', req.headers);
//     q1.populate('department').
//       populate('participatingBots').            //nico già nn gli usa
//       populate('participatingAgents').          //nico già nn gli usa
//       populate('lead').
//       populate({ path: 'requester', populate: { path: 'id_user' } });        //toglilo perche nico lo prende già da snapshot
//   }

//   // cache(cacheUtil.defaultTTL, "requests-"+projectId).    


//   // if (req.query.select_snapshot) {
//   //   winston.info('select_snapshot');
//   //   q1.select("+snapshot");
//   //   // q1.select({ "snapshot": 1});
//   // }

//   if (req.query.full_text) {
//     winston.debug('fulltext sort');
//     if (req.query.no_textscore != "true" && req.query.no_textscore != true) {
//       q1.sort({ score: { $meta: "textScore" } }) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
//     }
//   } else {
//     q1.sort(sortQuery);
//   }


//   // winston.info('q1',q1);


//   q1.exec();

//   // TODO if ?onlycount=true do not perform find query but only 
//   // set q1 to undefined; to skip query

//   var q2 = Request.countDocuments(query).exec();

//   if (req.query.no_count && req.query.no_count == "true") {
//     winston.info('REQUEST ROUTE - no_count ');
//     q2 = 0;
//   }

//   var promises = [
//     q1,
//     q2
//   ];

//   Promise.all(promises).then(function (results) {
//     var objectToReturn = {
//       perPage: limit,
//       count: results[1],
//       requests: results[0]
//     };
//     winston.debug('REQUEST ROUTE - objectToReturn ');
//     winston.debug('REQUEST ROUTE - objectToReturn ', objectToReturn);

//     const endExecTime = new Date();
//     winston.verbose('REQUEST ROUTE - exec time:  ' + (endExecTime - startExecTime));

//     return res.json(objectToReturn);

//   }).catch(function (err) {
//     winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err);
//     return res.status(500).send({ success: false, msg: 'Error getting requests.', err: err });
//   });


// });


// TODO converti con fast-csv e stream
// DOWNLOAD HISTORY REQUESTS AS CSV
router.get('/csv', function (req, res, next) {

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  var limit = 100000; // Number of request per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);

  let statusArray = [];

  var query = { "id_project": req.projectid };

  if (req.query.dept_id) {
    query.department = req.query.dept_id;
    winston.debug('REQUEST ROUTE - QUERY DEPT ID', query.department);
  }

  if (req.query.full_text) {
    winston.debug('req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.status) {

    if (req.query.status === 'all') {
      delete query.status;
    } else {
      let statusArray = req.query.status.split(',').map(Number);
      statusArray = statusArray.map(status => { return isNaN(status) ? null : status }).filter(status => status !== null)
      if (statusArray.length > 0) {
        query.status = {
          $in: statusArray
        }
      } else {
        delete query.status;
      }
    }

    if (statusArray.length > 0) {
      query.status = {
        $in: statusArray
      }
    }

  }

  if (req.query.preflight) {
    let preflight = (req.query.preflight === 'false');
    if (preflight) {
      query.preflight = false;
    }
  }

  if (req.query.lead) {
    winston.debug('req.query.lead', req.query.lead);
    query.lead = req.query.lead;
  }

  // USERS & BOTS
  if (req.query.participant) {
    winston.debug('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
  }

  winston.debug('req.query.hasbot', req.query.hasbot);
  if (req.query.hasbot != undefined) {
    winston.debug('req.query.hasbot', req.query.hasbot);
    query.hasBot = req.query.hasbot;
  }

  /**
   * DATE RANGE  */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }


    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }
  winston.debug("csv query", query);

  var direction = 1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  if (req.query.channel) {
    if (req.query.channel === "offline") {
      query["channel.name"] = { "$in": ["email", "form"] }
    } else if (req.query.channel === "online") {
      query["channel.name"] = { "$nin": ["email", "form"] }
    } else {
      query["channel.name"] = req.query.channel
    }
  }

  // VOICE FILTERS - Start
  if (req.query.caller) {
    query["attributes.caller_phone"] = req.query.caller;
  }
  if (req.query.called) {
    query["attributes.called_phone"] = req.query.called;
  }
  if (req.query.call_id) {
    query["attributes.call_id"] = req.query.call_id;
  }
  // VOICE FILTERS - End

  // TODO ORDER BY SCORE
  // return Faq.find(query,  {score: { $meta: "textScore" } }) 
  // .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score

  // aggiungi filtro per data marco

  if (req.query.duration && req.query.duration_op) {
    let duration = Number(req.query.duration) * 60 * 1000;
    if (req.query.duration_op === 'gt') {
      query.duration = { $gte: duration }
    } else if (req.query.duration_op === 'lt') {
      query.duration = { $lte: duration }
    } else {
      winston.verbose("Duration operator can be 'gt' or 'lt'. Skip duration_op " + req.query.duration_op)
    }
  }

  if (req.query.draft && (req.query.draft === 'false' || req.query.draft === false)) {
    query.draft = { $in: [false, null] }
  }

  winston.debug('REQUEST ROUTE - REQUEST FIND ', query)
  return Request.find(query, '-transcript -status -__v').
    skip(skip).limit(limit).
    //populate('department', {'_id':-1, 'name':1}).     
    populate('department').
    populate('lead').
    // populate('participatingBots').
    // populate('participatingAgents'). 
    lean().
    // populate({
    //   path: 'department', 
    //   //select: { '_id': -1,'name':1}
    //   select: {'name':1}
    // }).  
    sort(sortQuery).
    exec(function (err, requests) {
      if (err) {
        winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err)
        return res.status(500).send({ success: false, msg: 'Error getting csv requests.', err: err });
      }


      requests.forEach(function (element) {

        var channel_name = "";
        if (element.channel && element.channel.name) {
          channel_name = element.channel.name;
        }
        delete element.channel;
        element.channel_name = channel_name;

        var department_name = "";
        if (element.department && element.department.name) {
          department_name = element.department.name;
        }
        delete element.department;
        element.department_name = department_name;

        var lead_fullname = "";
        if (element.lead && element.lead.fullname) {
          lead_fullname = element.lead.fullname
        }
        element.lead_fullname = lead_fullname;


        var lead_email = "";
        if (element.lead && element.lead.email) {
          lead_email = element.lead.email
        }

        element.lead_email = lead_email;

        var tags = [];
        var tagsString = "";
        if (element.tags && element.tags.length > 0) {

          element.tags.forEach(function (tag) {
            // tags = tags  + tag.tag + ", ";
            tags.push(tag.tag);
          });
        }
        tagsString = tags.join(", ")

        winston.debug('tagsString ' + tagsString)

        element.tags = tagsString;


        // var participatingAgents = "";
        // if (element.participatingAgents && element.participatingAgents.length>0) {
        //   element.participatingAgents.forEach(function(agent) {                
        //     participatingAgents = participatingAgents + ", " + agent;
        //   });          
        // }
        // // da terminare e testare. potrebbe essere troppo lenta la query per tanti record
        // element.participatingAgents = participatingAgents;

        if (element.attributes) {
          if (element.attributes.caller_phone) {
            element.caller_phone = element.attributes.caller_phone;
          }
          if (element.attributes.called_phone) {
            element.called_phone = element.attributes.called_phone;
          }
          if (element.attributes.caller_phone) {
            element.call_id = element.attributes.call_id;
          }
        }

        delete element.lead;

        delete element.attributes;

        delete element.notes;

        // delete element.tags;

        delete element.channelOutbound;

        delete element.location;

        delete element.snapshot;


        // TODO print also lead. use a library to flattize
      });

      winston.debug('REQUEST ROUTE - REQUEST AS CSV', requests);

      return res.csv(requests, true);
    });

  // });

});

router.get('/count', async (req, res) => {

  let id_project = req.projectid;
  let merge_assigned = req.query.merge_assigned;
  let quota_count = false;
  if (req.query.conversation_quota === true || req.query.conversation_quota === 'true') {
    quota_count = true;
  }

  let open_count = 0;
  let closed_count = 0;
  let unassigned_count = 0;
  let human_assigned_count = 0;
  let bot_assigned_count = 0;

  let currentSlot
  let promises = [];

  if (quota_count) {

    let quoteManager = req.app.get('quote_manager');

    currentSlot = await quoteManager.getCurrentSlot(req.project);
    winston.debug("currentSlot: ", currentSlot)
    // Open count
    // Warning: 201 is a fake status -> Logical meaning: status < 1000;
    // (method) RequestService.getConversationsCount(id_project: any, status: any, preflight: any, hasBot: any): Promise<any>
    promises.push(requestService.getConversationsCount(id_project, 201, null, null, currentSlot.startDate, currentSlot.endDate).then((count) => {
      open_count = count;
      winston.debug("Unassigned count for project " + id_project + ": " + unassigned_count);
    }).catch((err) => {
      winston.error("Error getting unassigned conversation count");
    }))

    // Closed count
    promises.push(requestService.getConversationsCount(id_project, RequestConstants.CLOSED, null, null, currentSlot.startDate, currentSlot.endDate).then((count) => {
      closed_count = count;
      winston.debug("Unassigned count for project " + id_project + ": " + unassigned_count);
    }).catch((err) => {
      winston.error("Error getting unassigned conversation count");
    }))
  } else {
    // Unassigned count
    promises.push(requestService.getConversationsCount(id_project, RequestConstants.UNASSIGNED, false, null, null, null).then((count) => {
      unassigned_count = count;
      winston.debug("Unassigned count for project " + id_project + ": " + unassigned_count);
    }).catch((err) => {
      winston.error("Error getting unassigned conversation count");
    }))
  
    // Human assigned count
    promises.push(requestService.getConversationsCount(id_project, RequestConstants.ASSIGNED, false, false, null, null).then((count) => {
      human_assigned_count = count;
      winston.debug("Human assigned count for project " + id_project + ": " + human_assigned_count);
    }).catch((err) => {
      winston.error("Error getting human assigned conversation count");
    }))
  
    // Bot assigned count
    promises.push(requestService.getConversationsCount(id_project, RequestConstants.ASSIGNED, false, true, null, null).then((count) => {
      bot_assigned_count = count;
      winston.debug("Bot assigned count for project " + id_project + ": " + bot_assigned_count);
    }).catch((err) => {
      winston.error("Error getting bot assigned conversation count");
    }))
  }

  Promise.all(promises).then((response) => {

    if (quota_count) {
      let data = {
        open: open_count,
        closed: closed_count,
        slot: {
          startDate: currentSlot.startDate.format('DD/MM/YYYY'),
          endDate: currentSlot.endDate.format('DD/MM/YYYY')
        }
      }
      return res.status(200).send(data);
    } else {
      if (merge_assigned) {
        let data = {
          unassigned: unassigned_count,
          assigned: human_assigned_count + bot_assigned_count
        }
        return res.status(200).send(data);
  
      } else {
        let data = {
          unassigned: unassigned_count,
          assigned: human_assigned_count,
          bot_assigned: bot_assigned_count
        }
        return res.status(200).send(data);
      }
    }

  }).catch((err) => {
    console.error("err: ", err);
    return res.status(400).send({ success: false, error: err });
  })
})

// router.get('/count', async (req, res) => {
  
//   let id_project = req.projectid;
//   let merge_assigned = req.query.merge_assigned;

//   let unassigned_count = 0;
//   let human_assigned_count = 0;
//   let bot_assigned_count = 0;

//   unassigned_count = await Request.countDocuments({ id_project: id_project, status: 100, preflight: false }).catch((err) => {
//     winston.error("Error getting unassigned requests count: ", err);
//     res.status(400).send({ success: false, error: err });
//   })
//   winston.debug("Unassigned count for project " + id_project + ": " + unassigned_count);

//   human_assigned_count = await Request.countDocuments({ id_project: id_project, status: 200, preflight: false, hasBot: false }).catch((err) => {
//     winston.error("Error getting human unassigned requests count: ", err);
//     res.status(400).send({ success: false, error: err });
//   })
//   winston.debug("Human assigned count for project " + id_project + ": " + human_assigned_count);

//   bot_assigned_count = await Request.countDocuments({ id_project: id_project, status: 200, preflight: false, hasBot: true }).catch((err) => {
//     winston.error("Error getting bot assigned requests count: ", err);
//     res.status(400).send({ success: false, error: err });
//   })
//   winston.debug("Bot assigned count for project " + id_project + ": " + bot_assigned_count);


//   if (merge_assigned) {
//     let data = {
//       unassigned: unassigned_count,
//       assigned: human_assigned_count + bot_assigned_count
//     }
//     return res.status(200).send(data);
    
//   } else {
//     let data = {
//       unassigned: unassigned_count,
//       assigned: human_assigned_count,
//       bot_assigned: bot_assigned_count
//     }
//     return res.status(200).send(data);
//   }

// })

router.get('/:requestid', function (req, res) {

  var requestid = req.params.requestid;
  winston.debug("get request by id: " + requestid);


  let q = Request.findOne({ request_id: requestid, id_project: req.projectid })
    // .select("+snapshot.agents")
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')
    .populate({ path: 'requester', populate: { path: 'id_user' } });

  // if (cacheEnabler.request) {  cache disabled beacuse cacheoose don't support .populate without lean. here cache is not important
  //   q.cache(cacheUtil.defaultTTL, req.projectid+":requests:request_id:"+requestid) //request_cache
  //   winston.debug('request cache enabled');
  // }
  // 
  //  .populate({path:'requester',populate:{path:'id_user', select:{'firstname':1, 'lastname':1}}})
  q.exec(function (err, request) {
    if (err) {
      winston.error("error getting request by id ", err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!request) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(request);
  });
});

router.get('/:requestid/chatbot/parameters', async (req, res) => {

  let project_id = req.projectid;
  let request_id = req.params.requestid;

  let split_pattern = /-/
  let splitted = request_id.split(split_pattern);
  
  if (project_id !== splitted[2]) {
    return res.status(401).send({ success: false, message: "Request does not belong to the project"})
  }

  requestService.getRequestParametersFromChatbot(request_id).then((parameters) => {
    res.status(200).send(parameters);

  }).catch((err) => {
    console.error("err: ", err.response)
    res.status(400).send(err);
  })

})

module.exports = router;