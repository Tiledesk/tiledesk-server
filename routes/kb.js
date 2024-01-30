var express = require('express');
var { KBSettings } = require('../models/kb_setting');
var { KB } = require('../models/kb_setting');
// var KB = require('../models/kb_setting')
var router = express.Router();
var winston = require('../config/winston');
const openaiService = require('../services/openaiService');


router.get('/', async (req, res) => {

    let project_id = req.projectid;

    KB.find({ id_project: project_id }, (err, kbs) => {
        if (err) {
            winston.error("Find all kbs error: ", err);
            return res.status(500).send({ success: false, error: err });
        }
        
        winston.debug("KBs found: ", kbs);
        return res.status(200).send(kbs);
    })
})

router.get('/:kb_id', async (req, res) => {
    
    let kb_id = req.params.kb_id;

    KB.findById(kb_id, (err, kb) => {
        if (err) {
            winston.error("Find kb by id error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        return res.status(200).send(kb);
    })
})

router.post('/', async (req, res) => {

    let project_id = req.projectid;
    let body = req.body;

    let new_kb = new KB({
        id_project: project_id,
        name: body.name,
        type: body.type,
        source: body.source,
        content: body.content,
        namespace: body.namespace
    })
    
    if (!new_kb.namespace) {
        new_kb.namespace = project_id;
    }

    winston.debug("addingo kb: ", new_kb);

    new_kb.save((err, savedKb) => {
        if (err) {
            winston.error("Save new kb error: ", err);
            return res.status(500).send({ success: false, error: err});
        } else {
            return res.status(200).send(savedKb);
        }
    })

})

router.put('/:kb_id', async (req, res) => {

    let kb_id = req.params.kb_id;
    winston.verbose("update kb_id " + kb_id);

    let update = {};

    if (req.body.name != undefined) {
        update.name = req.body.name;
    }

    if (req.body.status != undefined) {
        update.status = req.body.status;
    }

    update.updatedAt = new Date();
    winston.debug("kb update: ", update);
    
    KB.findByIdAndUpdate(kb_id, update, { new: true }, (err, savedKb) => {

        if (err) {
            winston.error("KB findByIdAndUpdate error: ", err);
            return res.status(500).send({ success: false, error: err });
        } 
        
        if (!savedKb) {
            winston.debug("Try to updating a non-existing kb");
            return res.status(400).send({ success: false, message: "Content not found"})
        }

        res.status(200).send(savedKb)
    })

})

router.delete('/:kb_id', async (req, res) => {

    let project_id = req.projectid;
    let kb_id = req.params.kb_id;
    winston.verbose("delete kb_id " + kb_id);

    let data = {
        id: kb_id,
        namespace: project_id
    }

    openaiService.deleteIndex(data).then((resp) => {
        winston.debug("delete resp: ", resp.data);

        if (resp.success === true) {
            KB.findByIdAndDelete(kb_id, (err, deletedKb) => {
        
                if (err) {
                    winston.error("Delete kb error: ", err);
                    return res.status(500).send({ success: false, error: err });
                }
                res.status(200).send(deletedKb);
            })

        } else {
            return res.status(500).send({ success: false, error: "Unable to delete the content"})
        }

    }).catch((err) => {
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })

})


// PROXY PUGLIA AI V2 - START
router.post('/scrape/single', async (req, res) => {

    let data = req.body;
    winston.debug("/scrape/single data: ", data);

    let gptkey = process.env.GPTKEY;
    if (!gptkey) {
        return res.status(403).send({ success: false, error: "GPT apikey undefined"})
    }

    data.gptkey = gptkey;
    
    openaiService.singleScrape(data).then((resp) => {
        winston.debug("singleScrape resp: ", resp.data);
        return res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("singleScrape err: ", err);
        let status = err.response.status;
        return res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})

router.post('/scrape/status', async (req, res) => {

    let data = req.body;
    winston.debug("/scrapeStatus req.body: ", req.body);

    let returnObject = false;

    if (req.query &&
        req.query.returnObject &&
        (req.query.returnObject === true || req.query.returnObject === true )) {
            returnObject = true;
        }

    openaiService.scrapeStatus(data).then((response) => {
        
        winston.debug("scrapeStatus response.data: ", response.data);

        let update = {};

        if (response.data.status_code) {
            update.status = response.data.status_code;
        }

        KB.findByIdAndUpdate(data.id, update, { new: true }, (err, savedKb) => {

            if (err) {
                winston.verbose("Status was successfully recovered, but the update on the db failed");

                if (returnObject) {
                    return res.status(206).send({ warning: "Unable to udpate content on db", message: "The original reply was forwarded", data: response.data });
                } else {
                    return res.status(200).send(response.data);
                }
            } 
    
            if (returnObject) {
                return res.status(200).send(savedKb);
            } else {
                return res.status(200).send(response.data);
            }
        })

    }).catch((err) => {
        winston.error("scrapeStatus err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})

router.post('/qa', async (req, res) => {
    let data = req.body;
    winston.debug("/qa data: ", data);

    if (!data.gptkey) {
        let gptkey = process.env.GPTKEY;
        if (!gptkey) {
            return res.status(403).send({ success: false, error: "GPT apikey undefined"})
        }
        data.gptkey = gptkey;
    }

    openaiService.askNamespace(data).then((resp) => {
        winston.debug("qa resp: ", resp.data);
        res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("qa err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})

router.delete('/delete', async (req, res) => {

    let data = req.body;
    winston.debug("/delete data: ", data);

    openaiService.deleteIndex(data).then((resp) => {
        winston.debug("delete resp: ", resp.data);
        res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("delete err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
    
})

router.delete('/deleteall', async (req, res) => {
    
    let data = req.body;
    winston.debug('/delete all data: ', data);

    openaiService.deleteNamespace(data).then((resp) => {
        winston.debug("delete namespace resp: ", resp.data);
        res.status(200).send(resp.data);
    }).catch((err) => {
        winston.error("delete namespace err: ", err);
        let status = err.response.status;
        res.status(status).send({ statusText: err.response.statusText, detail: err.response.data.detail });
    })
})
// PROXY PUGLIA AI V2 - END


module.exports = router;