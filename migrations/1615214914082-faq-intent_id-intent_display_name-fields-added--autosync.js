var Faq = require("../models/faq");
var winston = require('../config/winston');
var { nanoid } = require("nanoid");
const uuidv4 = require('uuid/v4');
/**
 * Make any changes you need to make to the database here
 */
async function up () {
   
  await new Promise(async (resolve, reject) => {
  // Write migration here
   var faqs = await Faq.find({});
    faqs.forEach(
       function(faq, i){ 
        Faq.findOneAndUpdate({_id: faq.id}, {"$set": {intent_id: uuidv4(), intent_display_name: nanoid(6)}}, function(err, doc) {
        // updateMany({}, {"$set": {intent_id: "UUID()", intent_display_name: "UUID()"  }} , function (err, updates) {
        if (err) {
          winston.error("Schema updated  faq intent_id intent_display_name ",err);
          return reject(err);
        }                
        });   
      });
      winston.info("Schema updated for " + faqs.length + " faq intent_id intent_display_name field")
      return resolve('ok'); 
    });
  

}   

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
}

module.exports = { up, down };
 