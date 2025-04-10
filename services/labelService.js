var Label = require("../models/label");
var winston = require('../config/winston');
var fs = require('fs');
var path = require('path');
var labelsDir = __dirname+"/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);
var cacheUtil = require('../utils/cacheUtil');
var cacheManager = require('../utils/cacheManager');

class LabelService {
    
    constructor() {
        this.FALLBACK_LANGUAGE = "EN"; 

    }
    

// get a specific key of a project language but if not found return Pivot 
async get(id_project, language, key) {
   var ret = await this.getLanguage(id_project, language);
   var value = ret.data[key];
   return value;
}

 // get a specific project language, if not found return FALLBACK_LANGUAGE, if not found return default FALLBACK_LANGUAGE

 async getLanguage(id_project, language) {
    var that = this;
    var returnval = await that.getAll(id_project);
    winston.debug("getLanguage returnval: ",returnval);

    if (!returnval) {
        var retPiv = await that.fetchPivotDefault();
        winston.debug("retPiv",retPiv);
        return retPiv;
    }

    var pickedLang = returnval.data.find(l => l.lang === language);

    winston.debug("getLanguage pickedLang"+  language,pickedLang);

    if (pickedLang) {
        return pickedLang; 
    } else {

        var defaultLang = returnval.data.find(l => l.default === true);

        if (defaultLang) {
            return defaultLang; 
        }

        var pivotLang = returnval.data.find(l => l.lang === that.FALLBACK_LANGUAGE);   // <-- NOT necessary but nice
        if (pivotLang) {
            return pivotLang; 
        } else {
            var retPiv = await that.fetchPivotDefault();
            winston.debug("retPiv",retPiv);
            return retPiv;
        }
    }
        
 }


getAll(id_project) {
    var that = this;
    return new Promise(async function (resolve, reject) {
        
        // return that.fetchPivotDefault().then(function(def) {

                var cacheClient = cacheManager.getClient();
                var cacheKey = id_project+":labels";

                const value = await cacheClient.get(cacheKey);
                winston.debug("getAll value", value);
            
                if (value) {
                    if (value == "empty") {
                        winston.debug("getAll value return false");
                        return resolve(null);
                    } else {
                        winston.debug("getAll value return true");
                        return resolve(value);
                    }
            
                } else {

                    var query = {"id_project": id_project};
                    
                    winston.debug("query /", query);
    
                    // add cache
                    var q = Label.findOne(query).lean();
                    // if (cacheEnabler.label) { 
                    //     // essendo che la query ritorna null la cache non funziona bene
                    //     q.cache(cacheUtil.longTTL, cacheKey)  
                    //     winston.info('project cache enabled for getAll');
                    // }
                    //@DISABLED_CACHE .cache(cacheUtil.longTTL, id_project+":labels:query:all")  //label_cache
                    return q.exec(function (err, label) {
                        if (err) {
                            winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                            return reject({ msg: 'Error getting object.' });
                        }
                       
                        winston.debug("getAll returnval",label);
                    


                        if (!label) {
                            cacheClient.set(cacheKey, label, cacheUtil.longTTL, (err, reply) => {
                                winston.debug("Created cache for label",{err:err});
                                winston.debug("Created cache for label reply:"+reply);
                            });
                            
                        } else {
                            cacheClient.set(cacheKey, "empty", cacheUtil.longTTL, (err, reply) => {
                                winston.debug("Created empty cache for label",{err:err});
                                winston.debug("Created empty cache for label reply:"+reply);
                            });
                        }

                        return resolve(label);
                        
                    });

                    
                }

        });
    // });
}


// fetch pivot default language (FALLBACK_LANGUAGE)
fetchPivotDefault() {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.fetchDefault().then(function (def) {
            // console.log("def", def)
            var pivot = def.find(l => l.lang === that.FALLBACK_LANGUAGE);
            return resolve(pivot);        
        });
    });
   
}

// fetch all widget.json languages
fetchDefault() {
     
    var that = this;
    return new Promise(function (resolve, reject) {

        var filePath = path.join(labelsDir, 'widget.json');
    
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
var labelService = new LabelService();
module.exports = labelService;