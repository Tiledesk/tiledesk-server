var Label = require("../models/label");
var winston = require('../config/winston');
var fs = require('fs');
var path = require('path');
var labelsDir = __dirname+"/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);
var cacheUtil = require('../utils/cacheUtil');
var cacheManager = require('../utils/cacheManager');
var cacheEnabler = require('../services/cacheEnabler');

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
 async getAll(id_project) {
    winston.debug("cacheEnabler.label: "+cacheEnabler.label);
    // console.log("cacheEnabler.label: "+cacheEnabler.label);

    if (cacheEnabler.label==true) {
        let res =  await this.getAll_Cached(id_project);
        // console.log("getAll res cache ", JSON.stringify(res));
        return res;
    } else {
        let res =  await this.getAll_NoCache(id_project);
        // console.log("getAll res no cache", JSON.stringify(res));
        return res;
    }
 }

 getAll_NoCache(id_project) {
    var that = this;
    return new Promise(function (resolve, reject) {
        
        // return that.fetchPivotDefault().then(function(def) {


                var query = {"id_project": id_project};
                    
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

getAll_Cached(id_project) {
    var that = this;
    return new Promise(async function (resolve, reject) {
        
        // return that.fetchPivotDefault().then(function(def) {

                var cacheClient = cacheManager.getClient();
                winston.debug("cacheClient:",cacheClient);

                if (cacheClient==undefined) {
                    winston.error("Error reading getAll_Cached from cache. cacheClient is undefined",cacheClient);
                    return reject("Error reading getAll_Cached from cache. cacheClient is undefined");
                }
                var cacheKey = "cacheman:cachegoose-cache:"+id_project+":labels";
                winston.debug("cacheKey:"+ cacheKey);

                try {
                    
                const cachedValue = await cacheClient.get(cacheKey);
                winston.debug("getAll value", cachedValue);
                // console.log("getAll value", value);

            
                if (cachedValue) {
                    if (cachedValue == "empty") {
                        winston.debug("getAll empty value so i return false");
                        return resolve(null);
                    } else {
                        winston.debug("getAll value is not empty return value");
                        let parsedValue = cachedValue;
                        if (typeof cachedValue === "string") {
                            try {
                                parsedValue = JSON.parse(cachedValue);
                            } catch (e) {
                                winston.error("Error parsing cached label value", e);
                            }
                        }
                        return resolve(parsedValue);
                    }
            
                } else {

                    var query = {"id_project": id_project};
                    
                    winston.debug("query /", query);
                    console.log("label query: ", query);
    
                    // add cache
                    var q = Label.findOne(query).lean();
                    // if (cacheEnabler.label) { 
                    //     // essendo che la query ritorna null la cache non funziona bene
                    //     q.cache(cacheUtil.longTTL, cacheKey)  
                    //     winston.info('project cache enabled for getAll');
                    // }
                    //@DISABLED_CACHE .cache(cacheUtil.longTTL, id_project+":labels:query:all")  //label_cache
                    return q.exec(async function (err, label) {
                        if (err) {
                            winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                            return reject({ msg: 'Error getting object.' });
                        }
                       
                        winston.debug("getAll returnval",label);
                        console.log("saving label: ", label);
                    


                        if (label!=undefined) {
                            // await this.tdCache.set(nKey, 'true', { EX: 2592000 }); //seconds in one month = 2592000
                            // this is a TDCache instance and not a Native Redis client
                            try {
                                await cacheClient.setJSON(cacheKey, label, { EX:  cacheUtil.longTTL, callback: function() {
                                winston.verbose("Created cache for label",{err:err});
                                winston.debug("Created cache for label: " + label);
                                }});
                            } catch (cacheErr) {
                                winston.error("Error creating cache for label", cacheErr);
                            }
                            
                        } else {
                            cacheClient.set(cacheKey, "empty", { EX:  cacheUtil.longTTL, callback: function() {
                                winston.verbose("Created empty cache for label",{err:err});
                                winston.debug("Created empty cache for label: " + label);                                                    
                            }});
                        }

                        return resolve(label);
                        
                    });

                    
                }

            } catch (e) {
                // console.log(e);
                winston.error("Error getting from cache the label", e);
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