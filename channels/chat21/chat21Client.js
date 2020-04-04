
var chat21Config = require('../../channels/chat21/chat21Config');
var Chat21 = require('@chat21/chat21-node-sdk');
var winston = require('../../config/winston');



var url = process.env.CHAT21_URL || chat21Config.url;
var appid = process.env.CHAT21_APPID || chat21Config.appid;

winston.info('Chat21Client chat21.url: '+url );
winston.info('Chat21Client chat21.appid: '+ appid);

var chat21 = new Chat21({
 url: url,
 appid: appid
 //authurl: process.env.CHAT21_AUTH_URL
});

module.exports = chat21;
