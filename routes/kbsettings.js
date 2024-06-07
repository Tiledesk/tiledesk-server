var express = require('express');
var { KBSettings } = require('../models/kb_setting');
// var { KB } = require('../models/kb_setting');
// var KB = require('../models/kb_setting')
var router = express.Router();
var winston = require('../config/winston');
const openaiService = require('../services/openaiService');

// OLD KB SETTINGS GET
// router.get('/', async (req, res) => {
//     let project_id = req.projectid;

//     KBSettings.findOne({ id_project: project_id }, (err, kb_setting) => {
//         if (err) {
//             winston.error("find knoledge base settings error: ", err);
//             return res.status(500).send({ success: false, error: err });
//         }
//         else if (!kb_setting) {
//             // Automatically creates the kb settings object if it does not exist
//             let new_settings = new KBSettings({
//                 id_project: req.projectid
//             })
//             new_settings.save(function (err, savedKbSettings) {
//                 if (err) {
//                     winston.error("save new kbs error: ", err);
//                     return res.status(500).send({ success: false, error: err});
//                 } else {
//                     return res.status(200).send(savedKbSettings);
//                 }
//             })
//         }
//         else {
//             return res.status(200).send(kb_setting)
//         }
//     })
// })

router.get('/', async (req, res) => {
    let project_id = req.projectid;

    KBSettings.findOne({ id_project: project_id }, (err, kb_setting) => {
        if (err) {
            winston.error("find knoledge base settings error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        if (kb_setting && !kb_setting.kbs[0]) {
            
            KBSettings.findOneAndDelete({ id_project: project_id }, (err, kbsettingsDeleted) => {
                if (err) {
                    winston.error("find knoledge base settings and delete error: ", err);
                    return res.status(200).send(kb_setting);
                }
                
                winston.debug("Empty kb settings deleted successfully: ", kbsettingsDeleted);
                return res.status(200).send();
            })
        } 
        else {
            return res.status(200).send(kb_setting)
        }
    })
})


// Never used?
router.post('/', async (req, res) => {

    let body = req.body;

    let new_settings = new KBSettings({
        id_project: req.projectid,
        // gptkey: body.gptkey
        // others params are set with default values
    })

    new_settings.save(function (err, savedKbSettings) {
        if (err) {
            winston.error("save new kbs error: ", err);
            return res.status(500).send({ success: false, error: err});
        } else {
            return res.status(200).send(savedKbSettings);
        }
    })
})

router.put('/:settings_id', async (req, res) => {

    let settings_id = req.params.settings_id;
    let update = {};

    if (req.body.gptkey != undefined) {
        update.gptkey = req.body.gptkey
    }
    // check if it is eligible
    // if (req.body.maxKbsNumber != undefined) {
    //     update.maxKbsNumber = req.body.maxKbsNumber
    // }
    // if (req.body.maxPagesNumber != undefined) {
    //     update.maxPagesNumber = req.body.maxPagesNumber
    // }

    winston.debug("update: ", update);
    KBSettings.findByIdAndUpdate(settings_id, update, { new: true }, (err, settings) => {
        if (err) {
            winston.error("findByIdAndUpdate error: ", err);
            res.status(500).send({ success: false, error: err });
        } else {
            res.status(200).send(settings);
        }
    })
})

router.delete('/:settings_id/:kb_id', async (req, res) => {
    
    let settings_id = req.params.settings_id;
    let kb_id = req.params.kb_id;

    KBSettings.findByIdAndUpdate(settings_id, { $pull: { kbs: { _id: kb_id }}}, { new: true}, (err, settings) => {
        if (err) {
            winston.error("delete kb from list error: ", err);
            res.status(500).send({ success: false, error: err });
        } else {
            res.status(200).send(settings);
        }
    })

})


// PROXY PUGLIA AI - START
router.post('/qa', async (req, res) => {
    let data = req.body;
    winston.debug("/qa data: ", data);

    openaiService.ask(data).then((resp) => {
        winston.debug("qa resp: ", resp.data);
        res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("qa err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})

router.post('/startscrape', async (req, res) => {
    
    let data = req.body;
    winston.debug("/startscrape data: ", data);

    openaiService.startScrape(data).then((resp) => {
        winston.debug("startScrape resp: ", resp.data);
        res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("startScrape err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})


router.post('/checkstatus', async (req, res) => {

    //let data = req.body;
    winston.debug("/checkstatus req.body: ", req.body);

    let full_url = req.body.full_url;
    let data = {
        url_list: [ req.body.full_url ]
    }

    openaiService.checkStatus(data).then((resp) => {
        winston.debug("checkStatus resp: ", resp);
        winston.debug("checkStatus resp: ", resp.data);
        winston.debug("checkStatus resp: ", resp.data[full_url]);

        let response = resp.data[full_url];

        let return_data = {
            status_message: response.status_message
        }

        if (response.status_code === 3) {
            return_data.status_code = 2;
        }

        if (response.status_code === 1 || response.status_code === 2 ) {
            return_data.status_code = 1;
        }

        if (response.status_code === 0) {
            return_data.status_code = 0;
        }

        if (!response.status_code) {
            return_data.status_code = 0;
        }

        
        res.status(200).send(return_data);
    }).catch((err) => {
        //winston.error("checkstatus err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})
// PROXY PUGLIA AI - END

router.post('/:settings_id', async (req, res) => {

    let settings_id = req.params.settings_id;
    let body = req.body;

    KBSettings.findById(settings_id, (err, settings) => {
        if (err) {
            winston.error("find knoledge base error: ", err);
            return res.status(500).send({ success: false, error: err});
        } else {

            let new_kb = {
                name: body.name,
                url: body.url
            }
            settings.kbs.push(new_kb);

            KBSettings.findByIdAndUpdate( settings_id, settings, { new: true }, (err, savedSettings) => {
                if (err) {
                    winston.err("findByIdAndUpdate error: ", err);
                    res.status(500).send({ success: false, error: err });
                } else {
                    res.status(200).send(savedSettings);
                }
            })
        }
    })
})


module.exports = router;