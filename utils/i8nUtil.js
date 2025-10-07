

'use strict';


class I8nUtil {

    //unused
    getMessage(key, lang, labelsObject) {
        if (!lang) {
            lang = "EN";
        }

        lang = lang.toUpperCase();
        
        let label = "";

        try {
         label = labelsObject[lang][key];
        } catch(e) {
            label = labelsObject["EN"][key];
        }
        return label;
     
    }

   


      
  
}


let i8nUtil = new I8nUtil();


module.exports = i8nUtil;