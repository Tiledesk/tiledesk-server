var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Request = require("../models/request");
var emailService = require("../models/emailService");
var Project_userApi = require("../controllers/project_user");
var User = require("../models/user");
var Project = require("../models/project");
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;

// const Email = require('email-templates');

// var newRequest = {};
// newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();  //SALTO
// newRequest.requester_id = message.sender;
// newRequest.requester_fullname = message.sender_fullname;
// newRequest.first_text = message.text;
// newRequest.departmentid = departmentid;
// newRequest.members = group_members;  //SALTO
// newRequest.membersCount = Object.keys(group_members).length; //SALTO
// newRequest.agents = agents;
// newRequest.availableAgents = availableAgents;
// newRequest.assigned_operator_id = assigned_operator_id;
// if (newRequest.membersCount==2){
//     newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
// }else {
//     newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.SERVED;
// }
// if (message.attributes != null) {
//     newRequest.attributes = message.attributes;
// }
// newRequest.app_id = app_id;




router.post('/', function(req, res) {

  console.log("req.body", req.body);
  var newRequest = new Request({
    requester_id: req.body.requester_id,
    requester_fullname: req.body.requester_fullname,
    first_text: req.body.first_text,
    departmentid: req.body.departmentid,

    recipient: req.body.recipient,
    recipientFullname: req.body.recipient_fullname,
    sender: req.body.sender,
    senderFullname: req.body.sender_fullname,

    agents: req.body.agents,
    availableAgents: req.body.availableAgents,
    assigned_operator_id:  req.body.assigned_operator_id,
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
    
    // console.log("XXXXXXXXXXXXXXXX");
    this.sendEmail(req.projectid, savedRequest);
     
    

    res.json(savedRequest);
    
  });
});

sendEmail = function(projectid, savedRequest) {
 // send email
 try {


  Project.findById(projectid, function(err, project){
    if (err) {
      console.log(err);
    }

    if (!project) {
      console.log("Project not found", req.projectid);
    } else {
      
      console.log("Project", project);


              if (savedRequest.support_status==100) { //POOLED
              // throw "ciao";
                var allAgents = savedRequest.agents;
                console.log("allAgents", allAgents);

                allAgents.forEach(project_user => {
                  console.log("project_user", project_user);

                  User.findById(project_user.id_user, function (err, user) {
                    if (err) {
                      console.log(err);
                    }
                    if (!user) {
                      console.log("User not found", project_user.id_user);
                    } else {
                      console.log("User email", user.email);
                      if (user.emailverified) {
                        emailService.sendNewPooledRequestNotification(user.email, savedRequest, project);
                      }else {
                        console.log("User email not verified", user.email);
                      }
                    }
                  });

                  
                });

                }else if (savedRequest.support_status==200) { //ASSIGNED
                  console.log("assigned_operator_id", savedRequest.assigned_operator_id);

                  User.findById( savedRequest.assigned_operator_id, function (err, user) {
                    if (err) {
                      console.log(err);
                    }
                    if (!user) {
                      console.log("User not found",  savedRequest.assigned_operator_id);
                    } else {
                      console.log("User email", user.email);
                      emailService.sendNewAssignedRequestNotification(user.email, savedRequest, project);
                    }
                  });

                  // emailService.sendNewAssignedRequestNotification(user.email, savedRequest);
                }else {

                }


      
      }

});

} catch (e) {
  console.log("Errore sending email", e);
}
//end send email

}

router.patch('/:requestid', function(req, res) {
  console.log(req.body);
  // const update = _.assign({ "updatedAt": new Date() }, req.body);
  const update = req.body;
  console.log(update);

 // Request.update({_id  : ObjectId(req.params.requestid)}, {$set: update}, {new: true, upsert:false}, function(err, updatedMessage) {

 Request.findByIdAndUpdate(req.params.requestid,  {$set: update}, {new: true, upsert:false}, function(err, updatedMessage) {
    if (err) {
      return res.status(500).send({success: false, msg: 'Error updating object.'});
    }
    res.json(updatedMessage);
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




router.get('/', function (req, res) {

  console.log("req projectid", req.projectid);
  console.log("rreq.query.sort", req.query.sort);


  if (req.query.sort) {
      Request.find({ "id_project": req.projectid }).sort({updatedAt: 'desc'}).exec(function(err, requests) { 
        if (err) return next(err);
    
    
        res.json(requests);
      });
  }else {
    Request.find({ "id_project": req.projectid }, function (err, requests) {
        if (err) return next(err);
    
        res.json(requests);
      });
  }
});


module.exports = router;
