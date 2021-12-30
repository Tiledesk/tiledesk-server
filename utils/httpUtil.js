
'use strict';

var request = require('retry-request', {
    request: require('request')
  });


class HttpUtil {

     call(url, headers, json, method) {
        return new Promise(function (resolve, reject) {
            request({
                url: url,
                headers: headers,
                json: json,
                method: method
            }, function(err, result, json){            
                //console.log("SENT notify for bot with url " + url +  " with err " + err);
                if (err) {
                    //console.log("Error sending notify for bot with url " + url + " with err " + err);
                    return reject(err);
                }
                return resolve(json);
            });
        });
    }
}


var httpUtil = new HttpUtil();

/*
async function ciao() {
    var res = await httpUtil.call("https://webhook.site/bd710929-9b43-4065-88db-78ee17f84aec", undefined, {c:1}, "POST")
    console.log("res", res);
    
}
ciao();
*/

module.exports = httpUtil;
