let express = require('express');
let router = express.Router();

let Integration = require('../models/integrations');
const integrations = require('../models/integrations');
const cacheEnabler = require('../services/cacheEnabler');
const integrationEvent = require('../event/integrationEvent');

router.get('/test', async (req, res) => {
    console.log("integration router works!")

    res.status(200).send("Integration works!")
})

router.get('/', async (req, res) => {
    // get all integration for a project id
    let id_project = req.projectid;
    console.log("id_project: ", id_project);

    let i = Integration.find({ id_project: id_project });
    if (cacheEnabler.integrations) {
        // cacheUtil.longTTL is 1 hour (default)
        // 2592000 are the seconds in 1 month
        i.cache(2592000, "project:" + id_project + ":integrations");
        winston.debug('project cache enabled for get all integrations');
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

router.get('/:integration_id', async (req, res) => {
    // get one integration
    let integration_id = req.params.integration_id;
    console.log("integration_id: ", integration_id);

    Integration.findById(integration_id, (err, integration) => {
        if (err) {
            console.error("Error find integration by id: ", err);
            return res.status(404).send({ success: false, err: err });
        }

        res.status(200).send(integration);
    })

})

router.post('/', async (req, res) => {
    // add new integration
    let id_project = req.projectid;
    console.log("id_project: ", id_project);

    console.log("req.body: ", req.body);


    let newIntegration = new Integration({
        id_project: id_project,
        name: req.body.name,
        value: req.body.value
    })

    newIntegration.save((err, savedIntegration) => {
        if (err) {
            console.error("Error creating new integration ", err);
            return res.status(404).send({ success: false, err: err })
        }

        console.log("New integration created: ", savedIntegration);
        integrationEvent.emit("integration")
        res.status(200).send(savedIntegration);

    })
    
})

router.put('/:integration_id', async (req, res) => {

    let integration_id = req.params.integration_id;
    console.log("integration_id: ", integration_id);
    
    let update = {};
    if (req.body.name != undefined) {
        update.name = req.body.name;
    }
    if (req.body.value != undefined) {
        update.value = req.body.value
    }

    Integration.findByIdAndUpdate(integration_id, update, { new: true, upsert: true }, (err, savedIntegration) => {
        if (err) {
            console.error("Error find by id and update integration: ", err);
            return res.status({ success: false, error: err })
        }

        res.status(200).send(savedIntegration);
    })
})

router.delete('/:integration_id', async (req, res) => {

    let integration_id = req.params.integration_id;
    console.log("integration_id: ", integration_id);

    Integration.findByIdAndDelete(integration_id, (err, result) => {
        if (err) {
            console.error("Error find by id and delete integration: ", err);
            return res.status({ success: false, error: err })
        }

        res.status(200).send({ success: true, messages: "Integration deleted successfully"});

    })
})


module.exports = router;