var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Request = require("../models/request");
var emailService = require("../models/emailService");

// const Email = require('email-templates');

// var newRequest = {};
// newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
// newRequest.requester_id = message.sender;
// newRequest.requester_fullname = message.sender_fullname;
// newRequest.first_text = message.text;
// newRequest.members = group_members;
// newRequest.membersCount = Object.keys(group_members).length;
// newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
// newRequest.app_id = app_id;

router.post('/', function(req, res) {

  console.log(req.body);
  var newRequest = new Request({
    requester_id: req.body.requester_id,
    requester_fullname: req.body.requester_fullname,
    first_text: req.body.first_text,
    // recipient: req.body.recipient,
    // recipientFullname: req.body.recipientFullname,
    agents: req.body.agents,
    support_status: req.body.support_status,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newRequest.save(function(err, savedRequest) {
    if (err) {
      console.log('Error saving object.',err);
      return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
    }


    console.log("savedRequest",savedRequest);

    console.log("--> DEPT ID ", req.body.departmentid);

    let query;
    if (req.body.departmentid) {
      query = { _id: req.body.departmentid, id_project: req.projectid };
    }
    else {
      query = { default: true, id_project: req.projectid };
    }
    console.log('query', query);
    


  // Department.findOne(query, function (err, department) {
  //   if (err) {
  //     console.log('Error searching department ', err)
  //     return res.status(500).send({ success: false, msg: 'Error getting object.' });
  //   }
  //   if (!department) {
  //     return res.status(404).send({ success: false, msg: 'Object not found.' });
  //   }

  //   console.log('Department.routing ', department.routing)

  //   if (department.routing === 'fixed') {

  //     // notifico all'amministratore

  //   } else if (department.routing === 'pooled') {
  //     //notifico a tutti i membri
  //   } else if (department.routing === 'assigned') {
  //     // notifico all'operatore selezionato e all'admin
  //     console.log('OPERATORS - routing ASSIGNED - PRJCT-ID ', req.projectid)
  //     console.log('OPERATORS - routing ASSIGNED - DEPT GROUP-ID ', department.id_group)

  //     if (department.id_group == null || department.id_group == undefined) {

  //       console.log('OPERATORS - routing ASSIGNED - !!! DEPT HAS NOT GROUP ID')

  //       Project_user.find({ id_project: req.projectid, user_available: true }, function (err, project_users) {
  //         if (err) {
  //           console.log('-- > 2 DEPT FIND BY ID ERR ', err)
  //           return next(err);
  //         }
  //         console.log('OPERATORS - routing ASSIGNED - MEMBERS LENGHT ', project_users.length)
  //         console.log('OPERATORS - routing ASSIGNED - MEMBERS ', project_users)

  //         if (project_users.length > 0) {
  //           var operator = project_users[Math.floor(Math.random() * project_users.length)];
  //           console.log('OPERATORS - routing ASSIGNED - SELECTED MEMBER  ID', operator.id_user)
  //           return res.json({ department: department, operators: [{ id_user: operator.id_user }] });

  //         } else {

  //           return res.json({ department: department, operators: [] });

  //         }
  //       });

  //     } else {

  //       console.log('OPERATORS - routing ASSIGNED - !!! DEPT HAS GROUP ID')
  //       Group.find({ _id: department.id_group }, function (err, group) {

  //         if (err) {
  //           console.log('-- > OPERATORS - GROUP FIND BY ID ERR ', err)
  //           return next(err);
  //         }

  //         if (group) {
  //           console.log('-- > OPERATORS - GROUP FOUND:: ', group);
  //           console.log('-- > OPERATORS - GROUP FOUND:: MEMBERS LENGHT: ', group[0].members.length);
  //           console.log('-- > OPERATORS - GROUP FOUND:: MEMBERS ID: ', group[0].members);

  //           Project_user.find({ id_project: req.projectid, id_user: group[0].members, user_available: true }, function (err, project_users) {
  //             if (err) {
  //               console.log('-- > OPERATORS - GROUP FOUND:: USER AVAILABLE - ERR ', err)
  //               return (err);
  //             }
  //             if (project_users) {
  //               console.log('-- > OPERATORS - GROUP FOUND:: USER AVAILABLE (IN THE GROUP) LENGHT ', project_users.length);

  //               if (project_users.length > 0) {
  //                 var operator = project_users[Math.floor(Math.random() * project_users.length)];
  //                 console.log('OPERATORS - routing ASSIGNED - SELECTED (FROM A GROUP) MEMBER ID', operator.id_user);

  //                 return res.json({ department: department, operators: [{ id_user: operator.id_user }] });

  //               } else {

  //                 return res.json({ department: department, operators: [] });

  //               }

  //             }
  //           })
  //           // var operator = group[0].members[Math.floor(Math.random() * group[0].members.length)];
  //           // console.log('OPERATORS - routing ASSIGNED - SELECTED MEMBER ID (FROM A GROUP)', operator)
  //           // return res.json({ department: department, operators: [{ id_user: operator }] });
  //         }
  //       });
  //     }
    
  



    emailService.send("andrea.leo@frontiere21.it", 'New Support Request from TileDesk', savedRequest);





    // https://github.com/niftylettuce/email-templates

    // var emailPassword = process.env.EMAIL_PASSWORD;

    // // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.mailgun.org',
    //     //port: 587,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //         user: 'postmaster@mg.tiledesk.com', 
    //         pass: emailPassword
    //     }
    // });

    // // create template based sender function
    // // assumes text.{ext} and html.{ext} in template/directory
    // var sendNewRequestEmail = transporter.templateSender(new EmailTemplate('template/email/newrequest'), {
    //   from: 'sender@example.com',
    // });

    // // use template based sender to send a message
    // sendPwdReminder({
    //   to: 'receiver@example.com',
    //   // EmailTemplate renders html and text but no subject so we need to
    //   // set it manually either here or in the defaults section of templateSender()
    //   subject: 'Password reminder'
    // }, {
    //   username: 'Node Mailer',
    //   password: '!"\'<>&some-thing'
    // }, function(err, info){
    //   if(err){
    //     console.log('Error');
    //   }else{
    //       console.log('Password reminder sent');
    //   }
    // });
    
    

    res.json(savedRequest);
    
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


//   router.get('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.findById(req.params.messageid, function(err, message) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error getting object.'});
//       }
//       if(!message){
//         return res.status(404).send({success: false, msg: 'Object not found.'});
//       }
//       res.json(message);
//     });
//   });



// router.get('/', function(req, res) {

//     Message.find(function (err, messages) {
//       if (err) return next(err);
//       res.json(messages);
//     });
// });

module.exports = router;
