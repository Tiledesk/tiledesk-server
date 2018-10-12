var express = require('express');
var router = express.Router();
var Group = require("../models/group");



// TEMP
Group.findByProjectId = function (projectId, callback) {
  console.log('-1')
  console.log('GROUP MODEL - FIND BY PROJECT ID');

  Group.find({ "id_project": projectId, trashed: false }, function (err, groups) {
    console.log('-3');
    
    callback(err, groups);
  });
};
// FINE TEMP


router.post('/', function (req, res) {

  console.log('SAVE GROUP ', req.body);
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
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedGroup);
  });
});

router.put('/:groupid', function (req, res) {

  console.log(req.body);

  Group.findByIdAndUpdate(req.params.groupid, req.body, { new: true, upsert: true }, function (err, updatedGroup) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedGroup);
  });
});


router.delete('/:groupid', function (req, res) {

  console.log(req.body);

  Group.remove({ _id: req.params.groupid }, function (err, group) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(group);
  });
});


router.get('/:groupid', function (req, res) {

  console.log(req.body);

  Group.findById(req.params.groupid, function (err, group) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!group) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(group);
  });
});


// GET ALL GROUPS WITH THE PASSED PROJECT ID
router.get('/', function (req, res) {

  console.log("req projectid", req.projectid);

  // Group.find(function (err, groups) {
  // Group.find({ "id_project": req.projectid }, function (err, groups) {
  //   if (err) return next(err);
  //   res.json(groups);
  // });
  console.log('-0')
  Group.findByProjectId(req.projectid, function (err, groups) {

    // console.log('4')
    if (err) return next(err);
    res.json(groups);
  });
  console.log('-2')
});

module.exports = router;
