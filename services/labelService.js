let Label = require("../models/label");
let winston = require('../config/winston');
let fs = require('fs');
let path = require('path');
let labelsDir = __dirname+"/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);
let cacheUtil = require('../utils/cacheUtil');

class LabelService {
    
    constructor() {
        this.FALLBACK_LANGUAGE = "EN"; 

    }
    

// get a specific key of a project language but if not found return Pivot 
async get(id_project, language, key) {
   let ret = await this.getLanguage(id_project, language);
   let value = ret.data[key];
   return value;
}

 // get a specific project language, if not found return FALLBACK_LANGUAGE, if not found return default FALLBACK_LANGUAGE

 async getLanguage(id_project, language) {
    let that = this;
    let returnval = await that.getAll(id_project);
    winston.debug("getLanguage returnval: ",returnval);

    if (!returnval) {
        let retPiv = await that.fetchPivotDefault();
        winston.debug("retPiv",retPiv);
        return retPiv;
    }

    let pickedLang = returnval.data.find(l => l.lang === language);

    winston.debug("getLanguage pickedLang"+  language,pickedLang);

    if (pickedLang) {
        return pickedLang; 
    } else {

        let defaultLang = returnval.data.find(l => l.default === true);

        if (defaultLang) {
            return defaultLang; 
        }

        let pivotLang = returnval.data.find(l => l.lang === that.FALLBACK_LANGUAGE);   // <-- NOT necessary but nice
        if (pivotLang) {
            return pivotLang; 
        } else {
            let retPiv = await that.fetchPivotDefault();
            winston.debug("retPiv",retPiv);
            return retPiv;
        }
    }
        
 }


getAll(id_project) {
    let that = this;
    return new Promise(function (resolve, reject) {
        
        // return that.fetchPivotDefault().then(function(def) {


                let query = {"id_project": id_project};
                    
                winston.debug("query /", query);


                return Label.findOne(query).lean()
                //@DISABLED_CACHE .cache(cacheUtil.longTTL, id_project+":labels:query:all")  //label_cache
                .exec(function (err, labels) {
                    if (err) {
                        winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                        return reject({ msg: 'Error getting object.' });
                    }

                    winston.debug("here /", labels);
                    let returnval;
                    // if (labels) {
                        returnval = labels;
                    // }                    
                    winston.debug("getAll returnval",returnval);
                
                    return resolve(returnval);
                    
                });

        });
    // });
}


// fetch pivot default language (FALLBACK_LANGUAGE)
fetchPivotDefault() {
    let that = this;
    return new Promise(function (resolve, reject) {
        that.fetchDefault().then(function (def) {
            // console.log("def", def)
            let pivot = def.find(l => l.lang === that.FALLBACK_LANGUAGE);
            return resolve(pivot);        
        });
    });
   
}

// fetch all widget.json languages
fetchDefault() {
     
    let that = this;
    return new Promise(function (resolve, reject) {

        let filePath = path.join(labelsDir, 'widget.json');
    
        fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
        if (err) {
            winston.error('Error getting labels', err);
            return reject({ msg: 'Error reading object.' });
        }
            winston.debug('label fetched', data);
           return resolve(JSON.parse(data));
        });
    });
}


  

}
let labelService = new LabelService();
module.exports = labelService;