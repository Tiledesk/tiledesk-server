
const messagePromiseEvent = require('../../event/messagePromiseEvent');
const Request = require('../../models/request');
let winston = require('../../config/winston');
let cacheUtil = require('../../utils/cacheUtil');
let handlebars = require('handlebars');
let cacheEnabler = require("../../services/cacheEnabler");

class MessageHandlebarsTransformerInterceptor {

 


    listen() {

        let that = this;
        winston.info("MessageHandlebarsTransformerInterceptor listener start ");
 

        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.debug('MessageHandlebarsTransformerInterceptor message.create.simple.before', data); 

            let message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }
            if (message.attributes && message.attributes.templateProcessor == true) { 

                // TODO if variables are presents

                let q1 = Request.findOne({request_id:  message.recipient, id_project: message.id_project});

                // if (message.attributes && message.attributes.populateTemplate == true) {
                    q1.populate('lead').
                    populate('department').  
                    populate('participatingBots').
                    populate('participatingAgents').       
                    populate({path:'requester',populate:{path:'id_user'}});
                // }

                if (cacheEnabler.request) {
                    q1.cache(cacheUtil.defaultTTL, message.id_project+":requests:request_id:"+message.recipient) //request_cache
                    winston.debug('request cache enabled');
                }

                let request = await q1
                    .exec();



                let requestJSON = request.toJSON();

                winston.debug('request mti: ', requestJSON);


                let template = handlebars.compile(message.text);
                winston.debug('template: '+ template);

                // let templateSpec = handlebars.precompile(message.text);
                // winston.info('templateSpec: ', templateSpec);


                let replacements = {        
                  request: requestJSON,
                };
            
                // {{request.first_text}}
                // {{request.participatingAgents.0.firstname}}


                

                let text = template(replacements);
                winston.debug('text: '+ text);
                message.text=text;

            }
            winston.debug('data: ' + JSON.stringify(data) );
            return data;
        });

    }
    
}

let messageHandlebarsTransformerInterceptor = new MessageHandlebarsTransformerInterceptor();
module.exports = messageHandlebarsTransformerInterceptor;