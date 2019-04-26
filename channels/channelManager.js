
var winston = require('../config/winston');

var chat21Handler = require('../channels/chat21/chat21Handler');
// var chat21Handler = require('@tiledesk/tiledesk-chat21-app').chat21Handler;


class ChannelManager {

    use(app) {
        var that = this;
        winston.info("ChannelManager using controllers");
        chat21Handler.use(app);
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
