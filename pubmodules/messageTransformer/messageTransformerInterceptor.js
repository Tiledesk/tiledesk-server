
const messagePromiseEvent = require('../../event/messagePromiseEvent');
const labelService = require('../../services/labelService');
const Request = require('../../models/request');
let winston = require('../../config/winston');
let i8nUtil = require("../../utils/i8nUtil");
let cacheUtil = require('../../utils/cacheUtil');
let cacheEnabler = require("../../services/cacheEnabler");

//TODO rename to LabelMessageTransformerInterceptor
class MessageTransformerInterceptor {

 


    listen() {

        let that = this;
        winston.info("MessageTransformerInterceptor listener start ");
 

        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.debug('MessageTransformerInterceptor message.create.simple.before', data); 

            let message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }

            // https://stackoverflow.com/questions/413071/regex-to-get-string-between-curly-braces
            let re = /\${([^}]+)\}/;
            let m = message.text.match(re);
            if (m != null) {
                let messageExtracted = m[0].replace(re, '$1');
                winston.debug('messageExtracted: '+messageExtracted);

                let language = "EN";

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


                let request = await q.exec();
              
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
                let label = await labelService.get(message.id_project,language, messageExtracted);
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

let messageTransformerInterceptor = new MessageTransformerInterceptor();
module.exports = messageTransformerInterceptor;