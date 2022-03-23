var Label = require("../models/label");
var winston = require('../config/winston');
var fs = require('fs');
var path = require('path');
var labelsDir = __dirname+"/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);
var cacheUtil = require('../utils/cacheUtil');

class LabelService {

// fetch pivot default language (EN)
fetchPivotDefault() {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.fetchDefault().then(function (def) {
            // console.log("def", def)
            var pivot = def.find(l => l.lang === "EN");
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

// get a specific key of a project language merged with default (widget.json) but if not found return Pivot
async get(id_project, language, key) {
   var ret = await this.getByLanguageAndKey(id_project, language, key);

   if (ret) {
       return ret;
   } else { 
       return this.getByLanguageAndKey(id_project, "EN", key);
   }

}

// get a specific key of a project language merged with default (widget.json) with NO Pivot
getByLanguageAndKey(id_project, language, key) {
    var that = this;
    return new Promise(function (resolve, reject) {

        that.getAllByLanguageNoPivot(id_project,language).then(function(returnval) {
            winston.debug("getByLanguageAndKey returnval",returnval);
            if (returnval) {
                var value = returnval.data[key];
                winston.debug("getByLanguageAndKey value: "+value);
                 return resolve(value); 
            } else {
                winston.debug("getByLanguageAndKey  return undefined");
                return resolve();
            }
        });
    });
}

 // get a specific project language merged with default (widget.json) but if not found return Pivot
async getAllByLanguage(id_project, language) {
    var ret = await this.getAllByLanguageNoPivot(id_project, language);
    winston.debug("getAllByLanguage ret",ret);
    if (ret) {
        return ret;
    } else { 
        var retEn = await this.getAllByLanguageNoPivot(id_project, "EN");
        if (retEn) {
            return retEn;
        } else { 
            var retPiv = await this.fetchPivotDefault();
            winston.debug("retPiv",retPiv);
            return retPiv;
        }
    }
 
 }

 // get a specific project language merged with default (widget.json) Not Pivot
getAllByLanguageNoPivot(id_project, language) {
    var that = this;
    return new Promise(function (resolve, reject) {

        that.getAll(id_project).then(function(returnval) {
            winston.debug("getAllByLanguageNoPivot returnval: ",returnval);

            var pickedLang = returnval.data.find(l => l.lang === language);
            //var pickedLang = returnval.data[req.params.lang];           

            winston.debug("getAllByLanguageNoPivot pickedLang"+  language,pickedLang);
            return resolve(pickedLang); 
        });
    });
}

// get all project languages merged with default (widget.json)
//UNused
getAllMerged(id_project) {
 
    var that = this;
    return new Promise(function (resolve, reject) {
        
        return that.fetchDefault().then(function(defaults) {

            var query = {"id_project": id_project};
        
            winston.debug("query /", query);
        
        
            return Label.findOne(query).lean()
            //@DISABLED_CACHE .cache(cacheUtil.longTTL, id_project+":labels:query:all")
            .exec(function (err, labels) {
                if (err) {
                    winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                    return reject({ msg: 'Error getting object.' });
                }

                winston.debug("here /", labels);
                let returnval;
                if (!labels) {
                    winston.debug("here no labels");        
                    returnval = {data: defaults};
                } else {
                    returnval = labels;
                    defaults.forEach(elementDef => {
                        var pickedLang = labels.data.find(l => l.lang === elementDef.lang);
                        if (!pickedLang) {
                        returnval.data.push(elementDef);
                        }
                    });                
                }
                
                winston.debug("getAll returnval",returnval);
            
                return resolve(returnval);
                
            });
        });
    });
}


getAll(id_project) {
    var that = this;
    return new Promise(function (resolve, reject) {
        
        return that.fetchPivotDefault().then(function(def) {


                var query = {"id_project": id_project};
                    
                winston.debug("query /", query);


                return Label.findOne(query).lean()
                //@DISABLED_CACHE .cache(cacheUtil.longTTL, id_project+":labels:query:all")
                .exec(function (err, labels) {
                    if (err) {
                        winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                        return reject({ msg: 'Error getting object.' });
                    }

                    winston.debug("here /", labels);
                    let returnval;
                    if (!labels) {
                        winston.debug("here no labels");        
                        returnval = {data: [def]};
                    } else {
                        returnval = labels;                       
                    }
                    
                    winston.debug("getAll returnval",returnval);
                
                    return resolve(returnval);
                    
                });
        });
    });
}

  

}
var labelService = new LabelService();
module.exports = labelService;