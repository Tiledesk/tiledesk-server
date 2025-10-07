
const messagePromiseEvent = require('../../event/messagePromiseEvent');

let winston = require('../../config/winston');
const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');


class MicroLanguageTransformerInterceptor {

 


    listen() {

        let that = this;
        winston.info("MicroLanguageTransformerInterceptor listener start ");
        
        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.info('MicroLanguageTransformerInterceptor message.create.simple.before', data); 

            let message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }

            if (message.attributes && message.attributes.microlanguage == true) { 
                let reply = TiledeskChatbotUtil.parseReply(message.text);
                winston.info('parseReply: ' + JSON.stringify(reply) );
                let messageReply = reply.message;

                 
                let msg_attributes = {"_raw_message": message.text};

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

let microLanguageTransformerInterceptor = new MicroLanguageTransformerInterceptor();
module.exports = microLanguageTransformerInterceptor;