
var messageService = require('../services/messageService');
var Faq_kb = require('../models/faq_kb');
var MessageConstants = require('../models/messageConstants');
var winston = require('../config/winston');
var User = require('../models/user');
var cacheUtil = require('../utils/cacheUtil');


class SendMessageUtil {

async send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
    // async send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language) {
        winston.debug("here0") 
      try {
        // var senderFullname = "";


        if (sender === "system") {
            
        } else if (sender.startsWith("bot_")) {      // botprefix
            var id = sender.replace("bot_","");     // botprefix
            winston.debug("bot id: "+id);
            sender = id; //change sender removing bot_
            var bot = await Faq_kb.findById(id)    //TODO add cache_bot_here non sembra scattare.. dove viene usato?
                    //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, id_project+":faq_kbs:id:"+id)
                    .exec();
            winston.debug("bot",bot);                 
            senderFullname = bot.name;           
        } else {
            winston.debug("user id: "+sender);
            var user = await User.findById(sender)                                //TODO user_cache_here
              //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+sender)     //user_cache
              .exec()   
            winston.debug("user", user);        
            senderFullname = user.fullName;
        }
        winston.debug("senderFullname: "+senderFullname);
          }catch(e) {
            winston.error("errro getting fullname for SendMessageUtil", e);
          }

        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language) {
        return messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes);
        // return messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type, metadata, language);
    
   }


}



var sendMessageUtil = new SendMessageUtil();

module.exports = sendMessageUtil;






// var mongoose = require('mongoose');
// mongoose.connect("mongodb://localhost:27017/tiledesk", { "useNewUrlParser": true, "autoIndex": false }, function(err) {
//   if (err) { return winston.error('Failed to connect to MongoDB on '+databaseUri);}
// });
// sendMessageUtil.send("5e79e711ecb9230ac1f5b49f","123","ciao","5ebac3685704c9377c359675");
// sendMessageUtil.send("bot_5ebac3685704c9377c35967a","123","ciao","5ebac3685704c9377c359675")
// function wait () {
//     //   if (!EXITCONDITION)
//             setTimeout(wait, 1000);
//     };
//     wait();

    