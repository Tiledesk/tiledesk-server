var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var IntegrationsSchema = new Schema({
    id_project: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    value: {
        type: Object,
        required: true,
        default: {}
    }
})


module.exports = mongoose.model('integration', IntegrationsSchema);
