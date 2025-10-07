


// ***** UNUSED
class Chat21Util {
    
    getButtonFromText(message, bot, qna) { 
            let that = this;
            let text = message.text;
            return new Promise(function(resolve, reject) {
    
                let repl_message = Object.assign({}, message);
               
                // cerca i bottoni eventualmente definiti
                let button_pattern = /^\*.*/mg; // buttons are defined as a line starting with an asterisk
                let text_buttons = text.match(button_pattern);


                let image_pattern = /^\\image:.*/mg; 
                let imagetext = text.match(image_pattern);

                let webhook_pattern = /^\\webhook:.*/mg; 
                let webhooktext = text.match(webhook_pattern);


                if (text_buttons) {
                    let text_with_removed_buttons = text.replace(button_pattern,"").trim();
                    repl_message.text = text_with_removed_buttons
                    let buttons = []
                    text_buttons.forEach(element => {
                    // console.log("button ", element)
                    let remove_extra_from_button = /^\*/mg;
                    let button_text = element.replace(remove_extra_from_button, "").trim()
                    let button = {}
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
                    let imageurl = imagetext[0].replace("\\image:","").trim();
                    // console.log("imageurl ", imageurl)
                    let text_with_removed_image = text.replace(image_pattern,"").trim();
                    repl_message.text = text_with_removed_image + " " + imageurl
                    repl_message.metadata = {src: imageurl, width:200, height:200};
                    repl_message.type = "image";
                }
    
    
               
                else if (webhooktext && webhooktext.length>0) {
                    let webhookurl = webhooktext[0].replace("\\webhook:","").trim();
                    // console.log("webhookurl ", webhookurl)
    
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
                            // console.log("webhookurl repl_message ", response);
                            that.getButtonFromText(response.text,message, bot,qna).then(function(bot_answer) {
                                return resolve(bot_answer);
                            });
                        });
                 
                }else {
                    // console.log("repl_message ", repl_message)
                    return resolve(repl_message);
                }
    
    
               
            });
        }


// move to messageAction  no create a new module messageInterpreter??




        findSplits(result) {
            let commands = []
            const text = result['fulfillmentText'] // "parte 1\\splittesto12\\split\npt2.capone detto\\split:4000\npt.3. muggio\\split\npt. 4.Andtonino Mustacchio"
            // const text = "parte 1NO\\splittesto12\\split\npt2.capone detto\\split:4000\npt.3. muggio\\split\npt. 4.Dammi la tua email"
            const split_pattern = /^(\\split[:0-9]*)/mg //ex. \split:500
            let parts = text.split(split_pattern)
            for (let i=0; i < parts.length; i++) {
                let p = parts[i]
                console.log("part: " + p)
                if (i % 2 != 0) {
                // split command
                console.log("split command: " + p)
                let split_parts = p.split(":")
                let wait_time = 1000
                if (split_parts.length == 2) {
                    wait_time = split_parts[1]
                }
                console.log("wait time: " + wait_time)
                let command = {}
                command.type = "wait"
                command.time = parseInt(wait_time, 10)
                commands.push(command)
                }
                else {
                // message command
                let command = {}
                command.type = "message"
                command.text = p.trim()
                commands.push(command)
                if ( i == parts.length -1 &&
                    result['fulfillmentMessages'] &&
                    result['fulfillmentMessages'][1] &&
                    result['fulfillmentMessages'][1].payload) {
                    command.payload = result['fulfillmentMessages'][1].payload
                }
                }
            }
            commands.forEach(c => {
                console.log("* * * * * * * * * command: ", c)
            })
            return commands
        }
    
        parseReply(text) {
            
    
            let TEXT_KEY = 'text'
    
            let TYPE_KEY = 'type'
            let ATTRIBUTES_KEY = 'attributes'
            let METADATA_KEY = "metadata"
            let TYPE_IMAGE = 'image'
    
            let reply = {}
          
            console.log("TEXT: ", text)
            reply[TEXT_KEY] = text
            reply[ATTRIBUTES_KEY] = null
          
            // looks for images
            let image_pattern = /^\\image:.*/mg; // images are defined as a line starting with \image:IMAGE_URL
            // console.log("Searching images with image_pattern: ", image_pattern)
            let images = text.match(image_pattern);
            // console.log("images: ", images)
            if (images && images.length > 0) {
              const image_text = images[0]
              let text = text.replace(image_text,"").trim()
              const image_url = image_text.replace("\\image:", "")
              reply[TEXT_KEY] = text
              reply[TYPE_KEY] = TYPE_IMAGE
              reply[METADATA_KEY] = {
                src: image_url,
                width: 200,
                height: 200
              }
            }
          
            // looks for bullet buttons
            let button_pattern = /^\*.*/mg; // button pattern is a line that starts with *TEXT_OF_BUTTON (every button on a line)
            let text_buttons = text.match(button_pattern);
            if (text_buttons) {
              // ricava il testo rimuovendo i bottoni
              let text_with_removed_buttons = text.replace(button_pattern,"").trim();
              reply[TEXT_KEY] = text_with_removed_buttons
              // estrae i bottoni
              let buttons = []
              text_buttons.forEach(element => {
                let remove_extra_from_button = /^\*/mg; // removes initial "*"
                let button_text = element.replace(remove_extra_from_button, "").trim()
                let button = {}
                button[TYPE_KEY] = "text"
                button["value"] = button_text
                buttons.push(button)
                console.log("Added button: " + button_text)
              });
              if (reply[ATTRIBUTES_KEY] == null) {
                reply[ATTRIBUTES_KEY] = {}
              }
              reply[ATTRIBUTES_KEY]["attachment"] = {
                type:"template",
                buttons: buttons
              }
            }
            return reply
        }


        
}

let chat21Util = new Chat21Util();
module.exports = chat21Util;