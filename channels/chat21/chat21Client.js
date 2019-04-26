
var chat21Config = require('../../channels/chat21/chat21Config');
var Chat21 = require('@chat21/chat21-node-sdk');


var chat21 = new Chat21({
 url: process.env.CHAT21_URL || chat21Config.url,
 appid: process.env.CHAT21_APPID || chat21Config.appid,
 //authurl: process.env.CHAT21_AUTH_URL
});

module.exports = chat21;
