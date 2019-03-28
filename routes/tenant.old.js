// var mongoose = require('mongoose');
// var express = require('express');
// var router = express.Router();
// var Tenant = require("../models/tenant");



// router.post('/', function(req, res) {

//   console.log(req.body);
//   var newTenant = new Tenant({
//     name: req.body.name,
//     createdBy: req.user.id,
//     updatedBy: req.user.id
//   });

//   newTenant.save(function(err, savedTenant) {
//     if (err) {
//       return res.status(500).send({success: false, msg: 'Error saving object.'});
//     }
//     res.json(savedTenant);
//   });
// });

// router.put('/:tenantid', function(req, res) {
  
//     console.log(req.body);
    
//     Tenant.findByIdAndUpdate(req.params.tenantid, req.body, {new: true, upsert:true}, function(err, updatedTenant) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error updating object.'});
//       }
//       res.json(updatedTenant);
//     });
//   });


//   router.delete('/:tenantid', function(req, res) {
  
//     console.log(req.body);
    
//     Tenant.remove({_id:req.params.tenantid}, function(err, tenant) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error deleting object.'});
//       }
//       res.json(tenant);
//     });
//   });


//   router.get('/:tenantid', function(req, res) {
  
//     console.log(req.body);
    
//     Tenant.findById(req.params.tenantid, function(err, tenant) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error getting object.'});
//       }
//       if(!tenant){
//         return res.status(404).send({success: false, msg: 'Object not found.'});
//       }
//       res.json(tenant);
//     });
//   });



// router.get('/', function(req, res) {

//   Tenant.find(function (err, tenants) {
//       if (err) return next(err);
//       res.json(tenants);
//     });
// });

// module.exports = router;
