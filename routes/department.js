var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Department = require("../models/department");
var Project_user = require("../models/project_user");
var Group = require("../models/group");

// var passport = require('passport');
// var validtoken = require('.../middleware/valid-token')

router.post('/', function (req, res) {

  console.log("DEPT REQ BODY ", req.body);
  var newDepartment = new Department({
    routing: req.body.routing,
    name: req.body.name,
    default: req.body.default,
    id_group: req.body.id_group,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  if (req.body.id_bot) {
    newDepartment.id_bot = req.body.id_bot;
  }


  newDepartment.save(function (err, savedDepartment) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    console.log('NEW DEPT SAVED ', savedDepartment)
    res.json(savedDepartment);
  });
});

router.put('/:departmentid', function (req, res) {

  console.log(req.body);

  Department.findByIdAndUpdate(req.params.departmentid, req.body, { new: true, upsert: true }, function (err, updatedDepartment) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedDepartment);
  });
});


router.delete('/:departmentid', function (req, res) {

  console.log(req.body);

  Department.remove({ _id: req.params.departmentid }, function (err, department) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(department);
  });
});

// START - GET OPERATORS OF A DEPT
router.get('/:departmentid/operators', function (req, res) {
  // , req.params.departmentid
  console.log("--> DEPT ID ", req.params.departmentid);

  let query;
  if (req.params.departmentid == 'default') {
    query = { default: true, id_project: req.projectid };
  }
  else {
    // query = { _id: new ObjectId(req.params.departmentid) };
    query = { _id: req.params.departmentid };
  }
  console.log('query', query);

  Department.findOne(query, function (err, department) {
    if (err) {
      console.log('-- > 1 DEPT FIND BY ID ERR ', err)
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!department) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    console.log('OPERATORS - DETECTED ROUTING ', department.routing)

    if (department.routing === 'fixed') {
      console.log('OPERATORS - routing FIXED -> ID BOT', department.id_bot)

      return res.json({ department: department, operators: [{ id_user: 'bot_' + department.id_bot }] });

    } else if (department.routing === 'pooled') {

      console.log('OPERATORS - routing POOLED')
      return res.json({ department: department, operators: [] });

    } else if (department.routing === 'assigned') {
      console.log('OPERATORS - routing ASSIGNED - PRJCT-ID ', req.projectid)
      console.log('OPERATORS - routing ASSIGNED - DEPT GROUP-ID ', department.id_group)

      if (department.id_group == null || department.id_group == undefined) {

        console.log('OPERATORS - routing ASSIGNED - !!! DEPT HAS NOT GROUP ID')

        Project_user.find({ id_project: req.projectid, user_available: true }, function (err, project_users) {
          if (err) {
            console.log('-- > 2 DEPT FIND BY ID ERR ', err)
            return next(err);
          }
          console.log('OPERATORS - routing ASSIGNED - MEMBERS LENGHT ', project_users.length)
          console.log('OPERATORS - routing ASSIGNED - MEMBERS ', project_users)

          if (project_users.length > 0) {
            var operator = project_users[Math.floor(Math.random() * project_users.length)];
            console.log('OPERATORS - routing ASSIGNED - SELECTED MEMBER  ID', operator.id_user)
            return res.json({ department: department, operators: [{ id_user: operator.id_user }] });

          } else {

            return res.json({ department: department, operators: [] });

          }
        });

      } else {

        console.log('OPERATORS - routing ASSIGNED - !!! DEPT HAS GROUP ID')
        Group.find({ _id: department.id_group }, function (err, group) {

          if (err) {
            console.log('-- > OPERATORS - GROUP FIND BY ID ERR ', err)
            return next(err);
          }

          if (group) {
            console.log('-- > OPERATORS - GROUP FOUND:: ', group);
            console.log('-- > OPERATORS - GROUP FOUND:: MEMBERS LENGHT: ', group[0].members.length);
            console.log('-- > OPERATORS - GROUP FOUND:: MEMBERS ID: ', group[0].members);

            Project_user.find({ id_project: req.projectid, id_user: group[0].members, user_available: true }, function (err, project_users) {
              if (err) {
                console.log('-- > OPERATORS - GROUP FOUND:: USER AVAILABLE - ERR ', err)
                return (err);
              }
              if (project_users) {
                console.log('-- > OPERATORS - GROUP FOUND:: USER AVAILABLE (IN THE GROUP) LENGHT ', project_users.length);

                if (project_users.length > 0) {
                  var operator = project_users[Math.floor(Math.random() * project_users.length)];
                  console.log('OPERATORS - routing ASSIGNED - SELECTED (FROM A GROUP) MEMBER ID', operator.id_user);

                  return res.json({ department: department, operators: [{ id_user: operator.id_user }] });

                } else {

                  return res.json({ department: department, operators: [] });

                }

              }
            })
            // var operator = group[0].members[Math.floor(Math.random() * group[0].members.length)];
            // console.log('OPERATORS - routing ASSIGNED - SELECTED MEMBER ID (FROM A GROUP)', operator)
            // return res.json({ department: department, operators: [{ id_user: operator }] });
          }
        });
      }



    }
  });
});
// ./END - GET OPERATORS OF A DEPT

// START - GET MY DEPTS

// ============= GET ALL GROUPS WITH THE PASSED PROJECT ID =============
// router.get('/mydepartments', function (req, res) {

//   console.log("req projectid", req.projectid);

//   var departments_array = []

//   // PROMISE ALL EXAMPLE 
//   // https://stackoverflow.com/questions/47746190/execute-multiple-queries-at-once-in-mongoose
//   Promise.all([
//     Department.find({ "id_project": req.projectid, id_group: null }, function (err, departments) {
//       if (err) return next(err);
//       // console.log('3) GET MY DEPTS - NULL DEPTS ', departments)
//       // departments_array.push(departments);
//       // console.log('-- -- -- array of depts - null', arr)
//     }),

//     Group.find({ "id_project": req.projectid, trashed: false, members: req.user.id }, function (err, groups) {
//       if (err) return next(err);
//       // console.log('1) GET MY DEPTS - GROUPS ', groups)

//       groups.forEach(group => {
//         // console.log('GET MY DEPTS - GROUP (in which are between the members) NAME: ', group.name, ', ID GROUP: ', group._id, ', GROUPS MEMBERS ', group.members)

//         // , id_group: group._id
//         // $or: [{ id_group: group._id }, { id_group: null }]
//         Department.find({ "id_project": req.projectid, id_group: group._id }, function (err, departments) {
//           if (err) return next(err);
//           // console.log('2) GET MY DEPTS - DEPTS WITH THE GROUP ID (of which are member) ', departments)

//           // departments.forEach(dept => {
//           //   console.log('2A) GET MY DEPTS - DEPTS NAME: ', dept.name, ', WITH THE GROUP ID ', dept.id_group)
//           // });
//           // res.json(departments);
//         });

//         // Department.find({ "id_project": req.projectid, id_group: null }, function (err, departments) {
//         //   if (err) return next(err);
//         //   console.log('3) GET MY DEPTS - NULL DEPTS ', departments)
//         // });

//         // res.json(groups);
//         // console.log()
//       });

//     })

//   ]).then(([dep, deps]) => {
//     console.log('XCXCX', dep, deps)
//   });

// })

// NEW
router.get('/mydepartments', function (req, res) {

  console.log("req projectid", req.projectid);

  Department.find({ "id_project": req.projectid }, function (err, departments) {
    if (err) return next(err);
    // console.log('1) GET MY DEPTS - ALL DEPTS ARRAY ', departments)
    // departments_array.push(departments);
    // console.log('-- -- -- array of depts - null', arr)

    Group.find({ "id_project": req.projectid, trashed: false, members: req.user.id }, function (err, groups) {
      if (err) return next(err);
      // console.log('2) GET MY DEPTS - MY GROUPS ARRAY ', groups)

      var mydepts = []


      departments.forEach(dept => {

        // console.log('3) DEPT ', dept)
        if (dept.id_group == null) {
          console.log('DEPT NAME (null/undefined) ', dept.name, ', dept id ', dept._id)
          mydepts.push(dept._id);


          // FOR DEBUG
          // mydepts.forEach(mydept => {
          //   console.log('- MY DEPT NAME: ', mydept.name, ', ID GROUP: ', mydept.id_group)
          // });
          // console.log('- MY DEPTS ARRAY ', mydepts)
        }
        else {
          deptContainsMyGroup(groups)
          // groups.forEach(group => {
          //   console.log('4) GROUP ', group)
          //   if ( group._id == dept.id_group) {
          //     mydepts.push(dept);
          //     console.log('-- MY DEPTS ARRAY ', mydepts)
          //   }
          // });
          // console.log('-- MY DEPTS ARRAY ', mydepts)
        }

        function deptContainsMyGroup(groups) {

          groups.forEach(group => {
            // console.log('4) GROUP ', group)
            if (group._id == dept.id_group) {
              console.log('DEPT NAME (my departments) ', dept.name, ', dept id ', dept._id)
              mydepts.push(dept._id);
            }
          });
        }


      });
      return res.json(mydepts);
    })


  });





})

// ======================== ./END - GET MY DEPTS ========================

router.get('/:departmentid', function (req, res) {
  console.log(req.body);

  let departmentid = req.params.departmentid;


  if (departmentid == "default") {
    console.log("departmentid", departmentid);

    var query = {};
    // console.log("req.query", req.query);

    // if (req.appid) {
    query.id_project = req.projectid;
    query.default = true;
    // }

    console.log("query", query);

    Department.findOne(query, function (err, department) {
      if (err) return next(err);

      return res.json(department);
    });

  } else {
    Department.findById(departmentid, function (err, department) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!department) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(department);
    });
  }

});





// router.get('/', passport.authenticate(['anonymous'], { session: false }), function (req, res) {
  router.get('/', function (req, res) {

  console.log("req projectid", req.projectid);

  Department.find({ "id_project": req.projectid }, function (err, departments) {
    if (err) return next(err);


    res.json(departments);
  });
});

module.exports = router;
