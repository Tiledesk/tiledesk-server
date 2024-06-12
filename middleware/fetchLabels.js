
var fs = require('fs');
var path = require('path');
var winston = require('../config/winston');


var labelsDir = __dirname + "/../config/labels/";
winston.debug('labelsDir: ' + labelsDir);


module.exports = function(req, res, next) {
  var filePath = path.join(labelsDir, 'widget.json');

  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (err) {
        winston.error('Error getting labels', err);
        return res.status(500).send({ success: false, msg: 'Error reading object.' });
    }
    winston.debug('label fetched', data);

    // Replace {{ BRAND_NAME }} with process.env.BRAND_NAME value (default value "Tiledesk")
    let brand_name = process.env.BRAND_NAME;
    
    if (brand_name) {
      data = data.replaceAll("Tiledesk", brand_name);
      data = data.replaceAll("tiledesk", brand_name.toLowerCase());

    }

    req.labels = JSON.parse(data);
    next();
  });
}