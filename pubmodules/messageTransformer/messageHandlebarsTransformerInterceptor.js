
const messagePromiseEvent = require('../../event/messagePromiseEvent');
const Request = require('../../models/request');
var winston = require('../../config/winston');
var cacheUtil = require('../../utils/cacheUtil');
var handlebars = require('handlebars');
var cacheEnabler = require("../../services/cacheEnabler");

class MessageHandlebarsTransformerInterceptor {

 


    listen() {

        var that = this;
        winston.info("MessageHandlebarsTransformerInterceptor listener start ");
 

        messagePromiseEvent.on('message.create.simple.before', async (data) => {
            winston.debug('MessageHandlebarsTransformerInterceptor message.create.simple.before', data); 

            var message = data.beforeMessage;
            
            if (!message.text) { //for image i think
                return data;
            }
            if (message.attributes && message.attributes.templateProcessor == true) { 

                // TODO if variables are presents

                var q1 = Request.findOne({request_id:  message.recipient, id_project: message.id_project});

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

                var request = await q1
                    .exec();



                var requestJSON = request.toJSON();

                winston.debug('request mti: ', requestJSON);


                var template = handlebars.compile(message.text);
                winston.debug('template: '+ template);

                // var templateSpec = handlebars.precompile(message.text);
                // winston.info('templateSpec: ', templateSpec);


                var replacements = {        
                  request: requestJSON,
                };
            
                // {{request.first_text}}
                // {{request.participatingAgents.0.firstname}}


                

                var text = template(replacements);
                winston.debug('text: '+ text);
                message.text=text;

            }
            winston.debug('data: ' + JSON.stringify(data) );
            return data;
        });

    }
    
}

var messageHandlebarsTransformerInterceptor = new MessageHandlebarsTransformerInterceptor();
module.exports = messageHandlebarsTransformerInterceptor;