'use strict';

let Setting = require("../models/setting");

let winston = require('../config/winston');

let mongoose = require('mongoose');

class SettingDataLoader {


  save() {
    let that = this;
    return new Promise(function (resolve, reject) {
      let newSetting = new Setting({     
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


let settingDataLoader = new SettingDataLoader();


module.exports = settingDataLoader;
