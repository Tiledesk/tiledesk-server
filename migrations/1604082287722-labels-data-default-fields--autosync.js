var Label = require("../models/label");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
   
    // Label.updateMany({$where: "this.data.length == 1", "data.lang": "EN"}, {"$set": {"data.$.default": true}}, function (err, updates) {
    Label.updateMany({$where: "this.data.length == 1"}, {"$set": {"data.$.default": true}}, function (err, updates) {
      winston.info("Schema updated for " + updates.nModified + " label with single data to default field")
          return resolve('ok');  
    });  
    // {"data": { $elemMatch: {"lang": {  $ne: "EN" }}}}  
    // Label.updateMany({$where: "this.data.length > 1", 'data.lang': {$ne: "EN"}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
    // Label.updateMany({$where: "this.data.length > 1", 'data.lang': {$nin: ["EN"]}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
      Label.updateMany({$where: "this.data.length > 1", "data":  { $elemMatch: {"lang": {  $ne: "EN" }}}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
     
      winston.info("Schema updated for " + updates.nModified + " label to default false field")

      Label.updateMany({$where: "this.data.length > 1", "data.lang": "EN"}, {"$set": {"data.$.default": true}}, function (err, updates) {
        winston.info("Schema updated for " + updates.nModified + " label with multiple data to default field")
         return resolve('ok'); 
      });  

          // return resolve('ok');    
    });  

    // Lang not in english 
    // db.getCollection('labels').find({'data.lang': {$nin: ["EN"]}})

    // default not exists
    // db.getCollection('labels').find({'data.default': { $exists: false }}) 

       
  });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () { 
  // Write migration here
}

module.exports = { up, down };
 