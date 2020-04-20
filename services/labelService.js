var Label = require("../models/label");
var winston = require('../config/winston');
var fs = require('fs');
var path = require('path');
var labelsDir = __dirname+"/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);

class LabelService {


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

get(id_project, language, key) {
   var ret = this.getByLanguageAndKey(id_project, language, key);

   if (ret) {
       return ret;
   } else {
       return this.getByLanguageAndKey(id_project, "EN", key);
   }

}

getByLanguageAndKey(id_project, language, key) {
    var that = this;
    return new Promise(function (resolve, reject) {

        that.getAllByLanguage(id_project,language).then(function(returnval) {
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

getAllByLanguage(id_project, language) {
    var that = this;
    return new Promise(function (resolve, reject) {

        that.getAll(id_project).then(function(returnval) {
            winston.debug("getAllByLanguage returnval",returnval);

            var pickedLang = returnval.data.find(l => l.lang === language);
            //var pickedLang = returnval.data[req.params.lang];           

            winston.debug("getAllByLanguage pickedLang",pickedLang);
            return resolve(pickedLang); 
        });
    });
}

getAll(id_project) {
 
    var that = this;
    return new Promise(function (resolve, reject) {
        
        return that.fetchDefault().then(function(defaults) {

            var query = { "id_project": id_project};
        
            winston.debug("query /", query);
        
        
            return Label.findOne(query).lean().exec(function (err, labels) {
        
                if (err) {
                    winston.error('Label ROUTE - REQUEST FIND ERR ', err)
                    return reject({ msg: 'Error getting object.' });
                }

                winston.debug("here /", labels);
                let returnval;
                if (!labels) {
                    winston.debug("here  no labels");        
                    returnval = {data: defaults};
                } else {
                    returnval = labels;
                    // var dataAsObj = {...req.labels, ...labels.data }
                    // var data = Object.values(dataAsObj);
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
  

}
var labelService = new LabelService();
module.exports = labelService;