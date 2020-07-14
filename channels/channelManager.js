
var winston = require('../config/winston');

var chat21Handler = require('../channels/chat21/chat21Handler');
var chat21Contact = require('../channels/chat21/chat21Contact');
// var chat21Handler = require('@tiledesk/tiledesk-chat21-app').chat21Handler;


class ChannelManager {

    use(app) {
        var that = this;
        winston.debug("ChannelManager using controllers");
        chat21Handler.use(app);
        app.use('/chat21/contacts',  chat21Contact);
    }

    useUnderProjects(app) {
        var that = this;
        winston.debug("ChannelManager using controllers");
        chat21Handler.useUnderProjects(app);
    }

    listen() {
        var that = this;
        if (process.env.NODE_ENV != 'test')  {
            winston.info("ChannelManager listener start ");
            chat21Handler.listen();
        }else {
            winston.info("ChannelManager listener NOT started ");
        }
    }


    
}

var channelManager = new ChannelManager();
module.exports = channelManager;
