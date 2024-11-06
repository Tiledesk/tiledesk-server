var express = require('express');
var router = express.Router();
var CannedResponse = require("./cannedResponse");
var winston = require('../../config/winston');
const RoleConstants = require('../../models/roleConstants');
// const CannedResponseEvent = require('../event/CannedResponseEvent');


router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newCannedResponse = new CannedResponse({
    title: req.body.title,  
    text: req.body.text,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  if (req.projectuser.role == 'owner' || req.projectuser.role == 'admin') {
    newCannedResponse.shared = true;
  } else {
    newCannedResponse.shared = false;
  }

  newCannedResponse.save(function (err, savedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err)

      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }

    res.json(savedCannedResponse);
  });
});

router.put('/:cannedResponseid', async function (req, res) {
  winston.debug(req.body);
  let canned_id = req.params.cannedResponseid;
  let user_role = req.projectuser.role;
  
  var update = {};
  
  if (req.body.title!=undefined) {
    update.title = req.body.title; 
  }  
  if (req.body.text!=undefined) {
    update.text = req.body.text;   
  }
  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }

  let canned = await CannedResponse.findById(canned_id).catch((err) => {
    winston.error("Error finding canned response: ", err);
    return res.status(500).send({ success: false, error: "General error: cannot find the canned response with id " + canned_id })
  })

  if (!canned) {
    winston.verbose("Canned response with id " + canned_id + " not found.");
    return res.status(404).send({ success: false, error: "Canned response with id " + canned_id + " not found." })
  }

  /**
   * Change type from mongoose object to javascript standard object.
   * Otherwise hasOwnProperty wouldn't works.
   */
  canned = canned.toObject();

  if (user_role === RoleConstants.AGENT) {
    if (canned.createdBy !== req.user.id) {
      winston.warn("Not allowed. User " + req.user.id + " can't modify a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "You are not allowed to modify a canned response that is not yours."})
    }
  }
  else if (user_role === RoleConstants.OWNER || user_role === RoleConstants.ADMIN) {
    if (canned.hasOwnProperty('shared') && canned.shared === false) {
      winston.warn("Not allowed. User " + req.user.id + " can't modify a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "Not allowed to modify a non administration canned response"})
    }
  } else {
    winston.warn("User " + req.user.id + "trying to modify canned with role " + user_role);
    return res.status(401).send({ success: false, error: "Unauthorized"})
  }
  
  CannedResponse.findByIdAndUpdate(canned_id, update, { new: true, upsert: true }, function (err, updatedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    // CannedResponseEvent.emit('CannedResponse.update', updatedCannedResponse);
    res.json(updatedCannedResponse);
  });
});

router.delete('/:cannedResponseid', async function (req, res) {
  winston.debug(req.body);
  let canned_id = req.params.cannedResponseid;
  let user_role = req.projectuser.role;

  let canned = await CannedResponse.findById(canned_id).catch((err) => {
    winston.error("Error finding canned response: ", err);
    return res.status(500).send({ success: false, error: "General error: cannot find the canned response with id " + canned_id })
  })

  if (!canned) {
    winston.verbose("Canned response with id " + canned_id + " not found.");
    return res.status(404).send({ success: false, error: "Canned response with id " + canned_id + " not found." })
  }

  /**
   * Change type from mongoose object to javascript standard object.
   * Otherwise hasOwnProperty wouldn't works.
   */
  canned = canned.toObject();
  
  if (user_role === RoleConstants.AGENT) {
    if (canned.createdBy !== req.user.id) {
      winston.warn("Not allowed. User " + req.user.id + " can't delete a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "You are not allowed to delete a canned response that is not yours."})
    }
  }
  else if (user_role === RoleConstants.OWNER || user_role === RoleConstants.ADMIN) {
    if (canned.hasOwnProperty('shared') && canned.shared === false) {
      winston.warn("Not allowed. User " + req.user.id + " can't delete a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "Not allowed to delete a non administration canned response"})
    }
  } else {
    winston.warn("User " + req.user.id + "trying to delete canned with role " + user_role);
    return res.status(401).send({ success: false, error: "Unauthorized"})
  }

  CannedResponse.findByIdAndUpdate(req.params.cannedResponseid, {status: 1000}, { new: true, upsert: true }, function (err, updatedCannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    // CannedResponseEvent.emit('CannedResponse.delete', updatedCannedResponse);
    res.json(updatedCannedResponse);
  });
});

router.delete('/:cannedResponseid/physical', async function (req, res) {
  winston.debug(req.body);
  let canned_id = req.params.cannedResponseid;

  let canned = await CannedResponse.findById(canned_id).catch((err) => {
    winston.error("Error finding canned response: ", err);
    return res.status(500).send({ success: false, error: "General error: cannot find the canned response with id " + canned_id })
  })

  if (!canned) {
    winston.verbose("Canned response with id " + canned_id + " not found.");
    return res.status(404).send({ success: false, error: "Canned response with id " + canned_id + " not found." })
  }

  /**
   * Change type from mongoose object to javascript standard object.
   * Otherwise hasOwnProperty wouldn't works.
   */
  canned = canned.toObject();
  
  if (user_role === RoleConstants.AGENT) {
    if (canned.createdBy !== req.user.id) {
      winston.warn("Not allowed. User " + req.user.id + " can't delete a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "You are not allowed to delete a canned response that is not yours."})
    }
  }
  else if (user_role === RoleConstants.OWNER || user_role === RoleConstants.ADMIN) {
    if (canned.hasOwnProperty('shared') && canned.shared === false) {
      winston.warn("Not allowed. User " + req.user.id + " can't delete a canned response of user " + canned.createdBy);
      return res.status(403).send({ success: false, error: "Not allowed to delete a non administration canned response"})
    }
  } else {
    winston.warn("User " + req.user.id + "trying to delete canned with role " + user_role);
    return res.status(401).send({ success: false, error: "Unauthorized"})
  }

  CannedResponse.remove({ _id: req.params.cannedResponseid }, function (err, cannedResponse) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    // CannedResponseEvent.emit('CannedResponse.delete', CannedResponse);
    res.json(cannedResponse);
  });
});

router.get('/:cannedResponseid', function (req, res) {
  winston.debug(req.body);
  let user_id = req.user.id;
  console.log("[Canned] user_id: ", user_id);

  CannedResponse.findById(req.params.cannedResponseid, function (err, cannedResponse) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!cannedResponse) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    if (cannedResponse.createdBy !== user_id) {
      return res.status(403).send({ success: false, msg: 'You are not allowed to get a canned response that is not yours.'})
    }

    res.json(cannedResponse);
  });
});

router.get('/', function (req, res) {
  var limit = 1000; // Number of CannedResponses per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('CannedResponse ROUTE - SKIP PAGE ', skip);

  // var query = { "id_project": req.projectid, "status": {$lt:1000}};
  var query = {"id_project": req.projectid, "status": { $lt:1000 }, $or:[ { shared: true }, { shared : { $exists: false }}, { createdBy: req.user._id } ] }

  if (req.query.full_text) {
    winston.debug('CannedResponse ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
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

  winston.debug("sort query", sortQuery);

  return CannedResponse.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, cannedResponses) {
      if (err) {
        winston.error('CannedResponse ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }
    
        return res.json(cannedResponses);
    });
});




module.exports = router;
