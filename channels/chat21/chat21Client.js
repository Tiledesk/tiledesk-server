
let chat21Config = require('../../channels/chat21/chat21Config');
let Chat21 = require('@chat21/chat21-node-sdk');
let winston = require('../../config/winston');



let url = process.env.CHAT21_URL || chat21Config.url;
let appid = process.env.CHAT21_APPID || chat21Config.appid;

winston.info('Chat21Client chat21.url: '+url );
winston.info('Chat21Client chat21.appid: '+ appid);

let chat21 = new Chat21({
 url: url,
 appid: appid
 //authurl: process.env.CHAT21_AUTH_URL
});

module.exports = chat21;
