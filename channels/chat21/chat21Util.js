
class Chat21Util {
    
    getButtonFromText(message, bot, qna) { 
            var that = this;
            var text = message.text;
            return new Promise(function(resolve, reject) {
    
                var repl_message = Object.assign({}, message);
               
                // cerca i bottoni eventualmente definiti
                var button_pattern = /^\*.*/mg; // buttons are defined as a line starting with an asterisk
                var text_buttons = text.match(button_pattern);


                var image_pattern = /^\\image:.*/mg; 
                var imagetext = text.match(image_pattern);

                var webhook_pattern = /^\\webhook:.*/mg; 
                var webhooktext = text.match(webhook_pattern);


                if (text_buttons) {
                    var text_with_removed_buttons = text.replace(button_pattern,"").trim();
                    repl_message.text = text_with_removed_buttons
                    var buttons = []
                    text_buttons.forEach(element => {
                    console.log("button ", element)
                    var remove_extra_from_button = /^\*/mg;
                    var button_text = element.replace(remove_extra_from_button, "").trim()
                    var button = {}
                    button["type"] = "text"
                    button["value"] = button_text
                    buttons.push(button)
                    });
                    repl_message.attributes =
                    { 
                    attachment: {
                        type:"template",
                        buttons: buttons
                    }
                    }
                    repl_message.type = "text";            
    
                
                }  else if (imagetext && imagetext.length>0) {
                    var imageurl = imagetext[0].replace("\\image:","").trim();
                    console.log("imageurl ", imageurl)
                    var text_with_removed_image = text.replace(image_pattern,"").trim();
                    repl_message.text = text_with_removed_image + " " + imageurl
                    repl_message.metadata = {src: imageurl, width:200, height:200};
                    repl_message.type = "image";
                }
    
    
               
                else if (webhooktext && webhooktext.length>0) {
                    var webhookurl = webhooktext[0].replace("\\webhook:","").trim();
                    console.log("webhookurl ", webhookurl)
    
                    return request({                        
                        uri :  webhookurl,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        method: 'POST',
                        json: true,
                        body: {text: text, bot: bot, message: message, qna: qna},
                        }).then(response => {
                            if (response.statusCode >= 400) {                  
                                return reject(`HTTP Error: ${response.statusCode}`);
                            }
                            console.log("webhookurl repl_message ", response);
                            that.getButtonFromText(response.text,message, bot,qna).then(function(bot_answer) {
                                return resolve(bot_answer);
                            });
                        });
                 
                }else {
                    console.log("repl_message ", repl_message)
                    return resolve(repl_message);
                }
    
    
               
            });
        }
}

var chat21Util = new Chat21Util();
module.exports = chat21Util;