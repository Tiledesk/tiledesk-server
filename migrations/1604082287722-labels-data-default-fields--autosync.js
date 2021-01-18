var Label = require("../models/label");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
   
                                                              // { $exists: true } to fix: The positional operator did not find the match needed from the query.
    Label.updateMany({$where: "this.data.length == 1","data":  { $exists: true } }, {"$set": {"data.$.default": true}}, function (err, updates) {
      if (err) { 
        winston.error("Schema migration: label err1", err);
      }
      winston.info("Schema updated for " + updates.nModified + " label with single data to default field")
          return resolve('ok');  
    });  
    // {"data": { $elemMatch: {"lang": {  $ne: "EN" }}}}  
    // Label.updateMany({$where: "this.data.length > 1", 'data.lang': {$ne: "EN"}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
    // Label.updateMany({$where: "this.data.length > 1", 'data.lang': {$nin: ["EN"]}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
      Label.updateMany({$where: "this.data.length > 1", "data":  { $elemMatch: {"lang": {  $ne: "EN" }}}} , {"$set": {"data.$[].default": false}}, function (err, updates) {
        if (err) {
          winston.error("Schema migration: label err2", err);
        }
      winston.info("Schema updated for " + updates.nModified + " label to default false field")

      Label.updateMany({$where: "this.data.length > 1", "data.lang": "EN"}, {"$set": {"data.$.default": true}}, function (err, updates) {
        if (err) {
          winston.error("Schema migration: label err3", err);
        }
        winston.info("Schema updated for " + updates.nModified + " label with multiple data to default field")
         return resolve('ok'); 
      });  

          // return resolve('ok');    
    });  


    // db.getCollection('labels').find({}).count() 465
    // db.getCollection('labels').find({"$where": "this.data.length > 1", "data.lang": "EN"}).count() 92
    // db.getCollection('labels').find({"$where": "this.data.length > 1"}).count() 92
    



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
 