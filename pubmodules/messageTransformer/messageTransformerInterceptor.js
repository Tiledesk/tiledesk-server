
const messagePromiseEvent = require('../../event/messagePromiseEvent');
const labelService = require('../../services/labelService');
const Request = require('../../models/request');
var winston = require('../../config/winston');
var i8nUtil = require("../../utils/i8nUtil");
var cacheUtil = require('../../utils/cacheUtil');
var cacheEnabler = require("../../services/cacheEnabler");

//TODO rename to LabelMessageTransformerInterceptor
class MessageTransformerInterceptor {

 


    listen() {

        var that = this;
        winston.info("MessageTransformerInterceptor listener start ");
 

        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.debug('MessageTransformerInterceptor message.create.simple.before', data); 

            var message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }

            // https://stackoverflow.com/questions/413071/regex-to-get-string-between-curly-braces
            var re = /\${([^}]+)\}/;
            var m = message.text.match(re);
            if (m != null) {
                var messageExtracted = m[0].replace(re, '$1');
                winston.debug('messageExtracted: '+messageExtracted);

                var language = "EN";

                let q = Request.findOne({request_id:  message.recipient, id_project: message.id_project});
                    // populate('lead').
                    // populate('department').  
                    // populate('participatingBots').
                    // populate('participatingAgents').       
                    // populate({path:'requester',populate:{path:'id_user'}}).
                    
                if (cacheEnabler.request) {
                    q.cache(cacheUtil.defaultTTL, message.id_project+":requests:request_id:"+message.recipient+":simple") //request_cache nocachepopulatereqired
                    winston.debug('request cache enabled');
                }


                var request = await q.exec();
              
                winston.debug('request mti: ', request);

                if (request && request.language) {
                    language  = request.language.toUpperCase();
                }



                // if (message.language) {
                //     language  = message.language.toUpperCase();
                // }


                // if (message.attributes && message.attributes.language) {
                //     language  = message.attributes.language.toUpperCase();
                // }

                winston.debug('language: '+language);

            // if (message.text.indexOf("${")>-1) {
            
                // get a specific key of a project language merged with default (widget.json) but if not found return Pivot
                var label = await labelService.get(message.id_project,language, messageExtracted);
                winston.debug('MessageTransformerInterceptor label: ' + label);

                if (label) {
                    message.text=label;  //ATTENTION Changes is made by reference
                }
             
                return data;
                // labelService.getByLanguageAndKey(message.id_project, "EN", "LABEL_PLACEHOLDER").then(function(label) {
                //     message.text=label;   
                //     winston.info('MessageTransformerInterceptor return enter: '+ label);
                //     return data;
                // })
                // winston.info('MessageTransformerInterceptor enter here???');
            } else {
                winston.debug('MessageTransformerInterceptor return');
                return data;
            }
           
          });


    }


    
}

var messageTransformerInterceptor = new MessageTransformerInterceptor();
module.exports = messageTransformerInterceptor;