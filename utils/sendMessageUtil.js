
var messageService = require('../services/messageService');
var Faq_kb = require('../models/faq_kb');
var MessageConstants = require('../models/messageConstants');
var winston = require('../config/winston');
var User = require('../models/user');


class SendMessageUtil {

async send(sender, recipient, text, id_project, createdBy, attributes, type, metadata, language) {
      try {
        var senderFullname = "";


        if (sender === "system") {
            
        } else if (sender.startsWith("bot_")) {      
            var id = sender.replace("bot_","");
            winston.info("bot: "+id);
             var bot = await Faq_kb.findById(id).exec(); 
             console.log(bot)                                       
             senderFullname = bot.name;
           
        } else {
            winston.info("user");
            var user = await User.findById(sender).exec()   
            console.log(user)        
            senderFullname = user.fullName;
        }
        winston.info("senderFullname: "+senderFullname);
        return messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type, metadata, language);
      }catch(e) {
          console.log(e)
      }
   }


//    send(sender, recipient, text, id_project, createdBy, attributes, type, metadata, language) {
//     var that = this;
//     return new Promise(function (resolve, reject) {
//         console.log("0", sender);
//         var senderFullname = "";
//         if (sender === "system") {
//             console.log("1");
//             return resolve (this.send(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type, metadata, language));
//         } else if (sender.startsWith("bot_")) {
//             console.log("2");
//             var id = sender.replace("bot_","");
//             Faq_kb.findById(id, function(err, bot){
//                 senderFullname = bot.name;
//                 return resolve (this.send(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type, metadata, language));
//             })
           
//         } else {
//             console.log("3");
//             User.findById(sender, function(err, user){                
//                 console.log(err,user);
//                 senderFullname = user.fullname;
//                 console.log("user",user)
//                 return resolve (this.send(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type, metadata, language));
//             })
//         }
        
//     });
//    }

}



var sendMessageUtil = new SendMessageUtil();

module.exports = sendMessageUtil;




// (async () => {
//     try {
//        var res = await sendMessageUtil.send("5e79e711ecb9230ac1f5b49f","123","ciao","5ebac3685704c9377c359675");
//         console.log("qui")
// } catch (e) {
//     console.log(e);
//       }
     
//     })();





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

    