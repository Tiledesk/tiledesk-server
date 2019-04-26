
var winston = require('../config/winston');

var chat21Handler = require('../channels/chat21/chat21Handler');


class ChannelManager {

    use(app) {
        var that = this;
        winston.info("ChannelManager using controllers");
        chat21Handler.use(app);
    }

    listen() {
        var that = this;
        winston.info("ChannelManager listener start ");
        chat21Handler.listen();
    }


    
}

var channelManager = new ChannelManager();
module.exports = channelManager;
