'use strict';

var Setting = require("../models/setting");

var winston = require('../config/winston');

var mongoose = require('mongoose');

class SettingDataLoader {


  save() {
    var that = this;
    return new Promise(function (resolve, reject) {
      var newSetting = new Setting({     
      });
    
      return newSetting.save(function (err, savedSetting) {
        if (err) {
          if (err.code === 11000) { //error for dupes
            winston.debug("duplicate setting");
          } else {
           winston.error('Error saving the setting ', err);
           return reject(err);
          }
        }
        
        winston.debug("setting saved");
        return resolve(savedSetting);
      });
    });

  }



}


var settingDataLoader = new SettingDataLoader();


module.exports = settingDataLoader;
