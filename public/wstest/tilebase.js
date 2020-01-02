class Tilebase {


    constructor(url, onCreate, onUpdate) {
      this.url = url;
      this.onCreate = onCreate;
      this.onUpdate = onUpdate;
      //this.data = [];
      

    }
/*
    insertOrUpdate(item) {
        let objIndex = this.data.findIndex((obj => obj._id == item._id));
        // console.log("objIndex", objIndex);
        if (objIndex==-1) {
            this.data.push(item);
        }else if (objIndex>-1) {
            //console.log("Before objIndex: ", this.data[objIndex])
            this.data[objIndex] = item;
            //console.log("After objIndex: ", this.data[objIndex])
        } else {
            console.error("error");
        }
       // console.log("this.data", this.data)
        
        return objIndex;

    }


*/
    send (message) {
        console.log("send message", message);
        this.ws.send(message);
    }
    start(initialMessage) {
        // start(token) {
        var that = this;
        return new Promise(function (resolve, reject) {

            // var options = {
            //     // headers: {
            //     //     "Authorization" : "JWT " + token
            //     // }
            // };
            // console.log('options', options);

        // var ws = new WebSocket('ws://localhost:3000');
                    // var ws = new WebSocket('ws://localhost:3000/public/requests');
                    // var ws = new WebSocket('ws://localhost:3000/5bae41325f03b900401e39e8/messages');
                    
                    // 'ws://localhost:40510'
                    that.ws = new WebSocket(that.url);
                    var ws = that.ws;
                    // var ws = new WebSocket(that.url, options);
                    ws.onopen = function () {
                        console.log('websocket is connected2 ...');
                        if (initialMessage) {
                            ws.send(initialMessage);
                        }
                       // ws.send('connected')
                    }
                    ws.onclose = function () {
                        console.log('websocket is closed ... Try to reconnect in 5 seconds');
                        // https://stackoverflow.com/questions/3780511/reconnection-of-client-when-server-reboots-in-websocket
                        // Try to reconnect in 3 seconds
                        setTimeout(function(){that.start()}, 3000);
                    }
                    ws.onerror = function () {
                        console.log('websocket error ...')
                    }
                    ws.onmessage = function(message) {   
                        console.log(message);

                       
                            try {
                                var json = JSON.parse(message.data);
                            } catch (e) {
                                console.log('This doesn\'t look like a valid JSON: ',
                                    message.data);
                                    return;
                                // return reject('This doesn\'t look like a valid JSON: ',
                                //         message.data);
                            }
                            
                            if (json && json.payload  && json.payload.message && that.isArray(json.payload.message)) {
                                json.payload.message.forEach(element => {
                                   // console.log("element", element);
                                    //let insUp = that.insertOrUpdate(element);
                            let insUp = json.payload.method;
                                console.log("insUp",insUp);

                                    var object = {event: json.payload, data: element};

                                    if (insUp=="CREATE" && that.onCreate) {
                                        that.onCreate(element, object);
                                    }
                                    if (insUp=="UPDATE" && that.onUpdate) {
                                        that.onUpdate(element, object);
                                    }
                                    //this.data.push(element);
                                    
                                     resolve(element, object);
                                    // $('#messages').after(element.text + '<br>');
                                });
                            }else {
                                //let insUp = that.insertOrUpdate(json.payload.message);
				                let insUp = json.payload.method;                                                                                                                                                                                                                         
                                  console.log("insUp",insUp);     

                                var object = {event: json.payload, data: json};

                                if (insUp=="CREATE" && that.onCreate) {
                                    that.onCreate(json.payload.message, object);
                                }
                                if (insUp=="UPDATE" && that.onUpdate) {
                                    that.onUpdate(json.payload.message, object);
                                }
                                 resolve(json.payload.message, object);
                                // resolve
                                // $('#messages').after(json.text + '<br>');
                            }

                    }    
                    
        });

    }

    isArray(what) {
        return Object.prototype.toString.call(what) === '[object Array]';
    }

  }
