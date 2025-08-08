var express = require('express');
var router = express.Router();
var Group = require("../models/group");
var groupEvent = require("../event/groupEvent");
var winston = require('../config/winston');
const departmentService = require('../services/departmentService');



router.post('/', function (req, res) {

  winston.debug('SAVE GROUP ', req.body);
  var newGroup = new Group({
    name: req.body.name,
    members: req.body.members,
    trashed: false,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newGroup.save(function (err, savedGroup) {
    if (err) {
      winston.error('Error creating the group ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }

  
    groupEvent.emit('group.create', savedGroup);
    res.json(savedGroup);
  });
});

router.put('/:groupid', function (req, res) {

  winston.debug(req.body);

  var update = {};
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }
  if (req.body.members!=undefined) {
    update.members = req.body.members;
  }
  if (req.body.trashed!=undefined) {
    update.trashed = req.body.trashed;
  }
  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }
  

  Group.findByIdAndUpdate(req.params.groupid, update, { new: true, upsert: true }, function (err, updatedGroup) {
    if (err) {
      winston.error('Error putting the group ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    groupEvent.emit('group.update', updatedGroup);
    res.json(updatedGroup);
  });
});

router.put('/enable/:groupid', async (req, res) => {

  let group_id = req.params.groupid;

  Group.findByIdAndUpdate(group_id, { enabled: true }, { new: true, upsert: true }, (err, updatedGroup) => {
    if (err) {
      winston.error("Error enabling the group: ", err);
      return res.status(500).send({ success: false, error: "Error enabling group" })
    }

    groupEvent.emit('group.update', updatedGroup);
    res.status(200).send(updatedGroup);
  })

})

router.put('/disable/:groupid', async (req, res) => {

  let id_project = req.projectid;
  let group_id = req.params.groupid;

  const isInDepartment = await departmentService.isGroupInProjectDepartment(id_project, group_id).catch((err) => {
    winston.error("Error checking if group belongs to the department: ", err);
    return res.status(500).send({ success: false, error: "Unable to verify group-department association due to an error" })
  })

  if (isInDepartment) {
    winston.verbose("The group " + group_id + " belongs to a department and cannot be disabled");
    return res.status(403).send({ success: false, error: "Unable to disabled a group associated with a department" })
  }

  Group.findByIdAndUpdate(group_id, { enabled: false }, { new: true, upsert: true }, (err, updatedGroup) => {
    if (err) {
      winston.error("Error disabling the group: ", err);
      return res.status(500).send({ success: false, error: "Error disabling group" })
    }

    groupEvent.emit('group.update', updatedGroup);
    res.status(200).send(updatedGroup);
  })

})

// router.put('/:groupid', function (req, res) {

//   winston.debug(req.body);

//   var update = {};
  
//     update.name = req.body.name;
//     update.members = req.body.members;
//     update.trashed = req.body.trashed;
  

//   Group.findByIdAndUpdate(req.params.groupid, update, { new: true, upsert: true }, function (err, updatedGroup) {
//     if (err) {
//       winston.error('Error putting the group ', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }

//     groupEvent.emit('group.update', updatedGroup);
//     res.json(updatedGroup);
//   });
// });

router.delete('/:groupid', async (req, res) => {

  let id_project = req.projectid;
  let group_id = req.params.groupid;

  const isInDepartment = await departmentService.isGroupInProjectDepartment(id_project, group_id).catch((err) => {
    winston.error("Error checking if group belongs to the department: ", err);
    return res.status(500).send({ success: false, error: "Unable to verify group-department association due to an error" })
  })

  if (isInDepartment) {
    winston.verbose("The group " + group_id + " belongs to a department and cannot be deleted");
    return res.status(403).send({ success: false, error: "Unable to delete a group associated with a department" })
  }

  if (req.query.force === "true") {
    
    Group.findByIdAndRemove(group_id, function (err, group) {
      if (err) {
        winston.error('Error removing the group ', err);
        return res.status(500).send({ success: false, msg: 'Error deleting group' });
      }
      winston.debug("Physically removed group", group);
      // nn funziuona perchje nn c'è id_project
      groupEvent.emit('group.delete', group);
      res.status(200).send(group);
    });

  } else {

    Group.findByIdAndUpdate(group_id, { enabled: false, trashed: true }, { new: true }, function (err, group) {
        if (err) {
          winston.error('Error removing the group ', err);
          return res.status(500).send({ success: false, msg: 'Error deleting group' });
        }

        winston.debug("Group logical deleted", group);

        groupEvent.emit('group.update', group);

        res.status(200).send({ success: true, message: "Group successfully deleted"})
      }
    );
  }

});


router.get('/:groupid', function (req, res) {

  winston.debug(req.body);

  Group.findById(req.params.groupid, function (err, group) {
    if (err) {
      winston.error('Error getting the group ', err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!group) {
      winston.warn('group not found', err);
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(group);
  });
});



router.get('/', function (req, res) {

  winston.debug("req projectid", req.projectid);

  var query = { "id_project": req.projectid, trashed: false };

  if (req.query.member) {
    query.members = { $in : req.query.member }
  }
  
  winston.debug("query", query);
  
  Group.find(query, function (err, groups) {        
    if (err) {
      winston.error('Error getting the group ', err);
      return next(err);
    }
    res.json(groups);
  });
});

module.exports = router;
