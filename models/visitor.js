var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

//NOT IN USE**************


/*
Visitors are useful for representing logged-out users that didn't interact with the Tiledesk widget yet. 
After specific actions Visitors can be converted to Leads in Tiledesk.
The Visitors resource provides methods to fetch, update, convert and delete.
*/


var VisitorSchema = new Schema({    
    name: {
        type: String,
    },
    last_ip: {
        type: String,
    },
    attributes: {
        type: Object,
    },
    id_project: {
        type: String,
        required: true,
        index: true
    },   
    createdBy: {
        type: String,
        required: true
    }    
    },{
      timestamps: true
    }
);


var VisitorModel = mongoose.model('visitor', VisitorSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
    VisitorModel.syncIndexes();
    winston.info("VisitorModel syncIndexes")
  }


module.exports = VisitorModel;
