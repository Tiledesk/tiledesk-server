let express = require('express');
let router = express.Router();
var winston = require('../config/winston');
let Integration = require('../models/integrations');
const cacheEnabler = require('../services/cacheEnabler');
var cacheUtil = require('../utils/cacheUtil');
const integrationEvent = require('../event/integrationEvent');


// Get all integration for a project id 
router.get('/', async (req, res) => {

    let id_project = req.projectid;
    winston.debug("Get all integration for the project " + id_project);

    let i = Integration.find({ id_project: id_project });
    if (cacheEnabler.integrations) {
        // cacheUtil.longTTL is 1 hour (default), evaluate 1 month (2592000 s)
        i.cache(cacheUtil.longTTL, "project:" + id_project + ":integrations");
        winston.debug('integration cache enabled for get all integrations');
    }
    i.exec((err, integrations) => {
        if (err) {
            winston.error("Error getting integrations: ", err);
            return res.status(500).send({ success: false, message: "Error getting integrations "});
        }
        res.status(200).send(integrations);
    })
    // without cache
    // Integration.find({ id_project: id_project }, (err, integrations) => {
    //     if (err) {
    //         console.error("Error finding all integrations for the project " + id_project + " - err: " + err);
    //         return res.status(404).send({ success: false, err: err })
    //     }
    //     console.log("Integrations found: ", integrations);
    //     res.status(200).send(integrations);
    // })
})

// Get one integration
router.get('/:integration_id', async (req, res) => {
    
    let integration_id = req.params.integration_id;
    winston.debug("Get integration with id " + integration_id);

    Integration.findById(integration_id, (err, integration) => {
        if (err) {
            winston.error("Error find integration by id: ", err);
            return res.status(404).send({ success: false, err: err });
        }
        res.status(200).send(integration);
    })

})

router.get('/name/:integration_name', async (req, res) => {

    let id_project = req.projectid;
    winston.debug("Get all integration for the project " + id_project);

    let integration_name = req.params.integration_name;
    winston.debug("Get integration with id " + integration_name);

    Integration.findOne({ id_project: id_project, name: integration_name }, (err, integration) => {
        if (err) {
            winston.error("Error find integration by name: ", err);
            return res.status(404).send({ success: false, err: err });
        }

        if (!integration) {
            winston.debug("Integration not found");
            return res.status(200).send("Integration not found");
        }
        
        res.status(200).send(integration);
    })
})

// Add new integration
router.post('/', async (req, res) => {

    let id_project = req.projectid;
    winston.debug("Add new integration ", req.body);


    let newIntegration = {
        id_project: id_project,
        name: req.body.name
    }
    if (req.body.value) {
        newIntegration.value = req.body.value;
    }

    Integration.findOneAndUpdate({ id_project: id_project, name: req.body.name },  newIntegration, { new: true, upsert: true, setDefaultsOnInsert: false}, (err, savedIntegration) => {
        if (err) {
            winston.error("Error creating new integration ", err);
            return res.status(404).send({ success: false, err: err })
        }

        winston.debug("New integration created: ", savedIntegration);
        
        Integration.find({ id_project: id_project }, (err, integrations) => {
            if (err) {
                winston.error("Error getting all integrations");
            } else {
                integrationEvent.emit('integration.update', integrations, id_project);
            }
        })
        
        res.status(200).send(savedIntegration);
    })

    // let newIntegration = new Integration({
    //     id_project: id_project,
    //     name: req.body.name,
    //     value: req.body.value
    // })

    // newIntegration.save((err, savedIntegration) => {
    //     if (err) {
    //         console.error("Error creating new integration ", err);
    //         return res.status(404).send({ success: false, err: err })
    //     }

    //     console.log("New integration created: ", savedIntegration);

    //     Integration.find({ id_project: id_project }, (err, integrations) => {
    //         if (err) {
    //             console.error("Error getting all integrations");
    //         } else {
    //             console.log("emit integration.create event")
    //             integrationEvent.emit('integration.create', integrations, id_project);
    //         }

    //     })
        
    //     res.status(200).send(savedIntegration);

    // })
    
})

router.put('/:integration_id', async (req, res) => {

    let id_project = req.projectid;
    let integration_id = req.params.integration_id;
    
    let update = {};
    if (req.body.name != undefined) {
        update.name = req.body.name;
    }
    if (req.body.value != undefined) {
        update.value = req.body.value
    }

    Integration.findByIdAndUpdate(integration_id, update, { new: true, upsert: true }, (err, savedIntegration) => {
        if (err) {
            winston.error("Error find by id and update integration: ", err);
            return res.status({ success: false, error: err })
        }

        Integration.find({ id_project: id_project }, (err, integrations) => {
            if (err) {
                winston.error("Error getting all integrations");
            } else {
                integrationEvent.emit('integration.update', integrations, id_project);
            }
        })

        res.status(200).send(savedIntegration);
    })
})

router.delete('/:integration_id', async (req, res) => {

    let id_project = req.projectid;
    let integration_id = req.params.integration_id;

    Integration.findByIdAndDelete(integration_id, (err, result) => {
        if (err) {
            winston.error("Error find by id and delete integration: ", err);
            return res.status({ success: false, error: err })
        }

        Integration.find({ id_project: id_project }, (err, integrations) => {
            if (err) {
                winston.error("Error getting all integrations");
            } else {
                integrationEvent.emit('integration.update', integrations, id_project);
            }
        })

        res.status(200).send({ success: true, messages: "Integration deleted successfully"});

    })
})


module.exports = router;