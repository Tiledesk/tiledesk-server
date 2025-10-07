let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');

let IntegrationsSchema = new Schema({
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
