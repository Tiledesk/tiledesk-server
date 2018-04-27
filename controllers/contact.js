// var passport = require('passport');
// var config = require('../config/database');
// require('../config/passport')(passport);

// var Contact = require("../models/contact");



// contactsController.create = function(req, res) {

//   console.log(req.body);
//   var newContact = new Contact({
//     fullname: req.body.fullname,
//     appId: req.appid
//   });

//   newContact.save(function(err, savedContact) {
//     if (err) {
//       return res.status(500).send({success: false, msg: 'Error saving object.'});
//     }
//     res.json(savedContact);
//   });
// }

// router.put('/:contactid', function(req, res) {
  
//     console.log(req.body);
    
//     Contact.findByIdAndUpdate(req.params.contactid, req.body, {new: true, upsert:true}, function(err, updatedContact) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error updating object.'});
//       }
//       res.json(updatedContact);
//     });
//   });


//   router.delete('/:contactid', function(req, res) {
  
//     console.log(req.body);
    
//     Contact.remove({_id:req.params.contactid}, function(err, contact) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error deleting object.'});
//       }
//       res.json(contact);
//     });
//   });


//   router.get('/:contactid', function(req, res) {
  
//     console.log(req.body);
    
//     Contact.findById(req.params.contactid, function(err, contact) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error getting object.'});
//       }
//       if(!contact){
//         return res.status(404).send({success: false, msg: 'Object not found.'});
//       }
//       res.json(contact);
//     });
//   });



// router.get('/', function(req, res) {

//     Contact.find(function (err, contacts) {
//       if (err) return next(err);
//       res.json(contacts);
//     });
// });

// module.exports = contactsController;
