
let winston = require('../config/winston');


let chat21Enabled = process.env.CHAT21_ENABLED;
winston.debug("chat21Enabled: "+chat21Enabled);

let engine = process.env.CHAT21_ENGINE;
winston.debug("chat21 engine: "+engine);


let validtoken = require('../middleware/valid-token');
let passport = require('passport');
require('../middleware/passport')(passport);


if (chat21Enabled && chat21Enabled == "true") {
    winston.info("ChannelManager - Chat21 channel is enabled");
}else {
    winston.warn("ChannelManager Chat21 channel is disabled. Attention!!");
}

class ChannelManager {

    use(app) {
        let that = this;
        winston.debug("ChannelManager using controllers");

        if (chat21Enabled && chat21Enabled == "true") {

            let chat21WebHook = require('../channels/chat21/chat21WebHook');
            app.use('/chat21/requests',  chat21WebHook); //<- TODO cambiare /request in /webhook

            let chat21Contact = require('../channels/chat21/chat21Contact');
            app.use('/chat21/contacts',  chat21Contact);

            let chat21ConfigRoute = require('../channels/chat21/configRoute');
            app.use('/chat21/config',  chat21ConfigRoute);

            
            if (engine && engine=="firebase") {
                winston.info("ChannelManager - Chat21 channel engine is firebase");
                let firebaseAuth = require('../channels/chat21/firebaseauth');
                app.use('/chat21/firebase/auth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], firebaseAuth);
            } else { //if (engine && engine=="native") {
                winston.info("ChannelManager - Chat21 channel engine is native mqtt");
                let nativeAuth = require('../channels/chat21/nativeauth');
                app.use('/chat21/native/auth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], nativeAuth);
            }
            winston.info("ChannelManager - Chat21 channel routes initialized");
        } else {
            winston.info("ChannelManager - Chat21 channel routes not initialized.");
        }            

        
    }

    useUnderProjects(app) {

    }

    listen() {
        let that = this;

        if (process.env.NODE_ENV == 'test')  {	
            return winston.info("ChannelManager listener disabled for testing");
        }
        
        if (chat21Enabled && chat21Enabled == "true") {   
            let chat21Handler = require('../channels/chat21/chat21Handler');         
            chat21Handler.listen();
            winston.info("ChannelManager listener started");
        }else {
            winston.info("ChannelManager listener NOT started ");
        }
    }


    
}

let channelManager = new ChannelManager();
module.exports = channelManager;
