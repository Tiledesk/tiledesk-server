
const messagePromiseEvent = require('../../event/messagePromiseEvent');
const labelService = require('../../services/labelService');
var winston = require('../../config/winston');
var i8nUtil = require("../../utils/i8nUtil");

class MessageTransformerInterceptor {

 


    listen() {

        var that = this;
        winston.info("MessageTransformerInterceptor listener start ");
        
        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.info('MessageTransformerInterceptor message.create.simple.before', data); 

            var message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }
            
            // https://stackoverflow.com/questions/413071/regex-to-get-string-between-curly-braces
            var re = /\${([^}]+)\}/;
            var m = message.text.match(re);
            if (m != null) {
                var messageExtracted = m[0].replace(re, '$1');
                winston.info('messageExtracted: '+messageExtracted);

                var language = "EN";

                if (message.attributes && message.attributes.language) {
                    language  = message.attributes.language.toUpperCase();
                }

                winston.info('language: '+language);

            // if (message.text.indexOf("${")>-1) {
            
                winston.info('MessageTransformerInterceptor enter');
                var label = await labelService.getByLanguageAndKey(message.id_project,language, messageExtracted);
                if (label) {
                    message.text=label;  
                }
             
                return data;
                // labelService.getByLanguageAndKey(message.id_project, "EN", "LABEL_PLACEHOLDER").then(function(label) {
                //     message.text=label;   
                //     winston.info('MessageTransformerInterceptor return enter: '+ label);
                //     return data;
                // })
                // winston.info('MessageTransformerInterceptor enter here???');
            } else {
                winston.info('MessageTransformerInterceptor return');
                return data;
            }
           
          });


    }


    
}

var messageTransformerInterceptor = new MessageTransformerInterceptor();
module.exports = messageTransformerInterceptor;