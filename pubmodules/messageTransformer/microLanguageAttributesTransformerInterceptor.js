
const messagePromiseEvent = require('../../event/messagePromiseEvent');

var winston = require('../../config/winston');
const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');


class MicroLanguageTransformerInterceptor {

 


    listen() {

        var that = this;
        winston.info("MicroLanguageTransformerInterceptor listener start ");
        
        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.debug('MicroLanguageTransformerInterceptor message.create.simple.before', data); 

            var message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }

            if (message.attributes && message.attributes.microlanguage == true) { 
                var reply = TiledeskChatbotUtil.parseReply(message.text);
                winston.debug('parseReply: ' + JSON.stringify(reply) );
                var messageReply = reply.message;

                 
                var msg_attributes = {"_raw_message": message.text};

                if (messageReply && messageReply.attributes) {
                    for(const [key, value] of Object.entries(messageReply.attributes)) {
                        msg_attributes[key] = value
                    }
                }

                messageReply.attributes = msg_attributes;
              
        
                //data.beforeMessage = messageReply; //https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language
                // message = messageReply;
                message.text = messageReply.text;                  //ATTENTION Changes is made by reference
                message.attributes = messageReply.attributes;      //ATTENTION Changes is made by reference
                message.type = messageReply.type;                  //ATTENTION Changes is made by reference
                message.metadata = messageReply.metadata;          //ATTENTION Changes is made by reference
                // message.metadata = messageReply.metadata;

                //data.beforeMessage = messageReply;
               
             }
             winston.debug('data: ' + JSON.stringify(data) );
             return data;
            
        });


    }

    
}

var microLanguageTransformerInterceptor = new MicroLanguageTransformerInterceptor();
module.exports = microLanguageTransformerInterceptor;