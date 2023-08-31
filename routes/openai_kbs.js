var express = require('express');
var OpenaiKbs = require('../models/openai_kbs');
var router = express.Router();


router.get('/', async (req, res) => {

    let project_id = req.projectid;

    OpenaiKbs.find({ id_project: project_id }, (err, kbs) => {
        if (err) {
            console.error("find all kbs error: ", err);
            return res.status(500).send({ success: false, error: err });
        } else {
            return res.status(200).send(kbs);
        }
    })
})

router.post('/', async (req, res) => {

    let body = req.body;

    let new_kbs = new OpenaiKbs({
        name: body.name,
        url: body.url,
        id_project: req.projectid,
        gptkey: req.body.gptkey
    })

    new_kbs.save(function (err, savedKbs) {
        if (err) {
            console.error("save new kbs error: ", err);
            return res.status(500).send({ success: false, error: err});
        } else {
            return res.status(200).send(savedKbs);
        }
    })
})

router.put('/', async (req, res) => {
    // to be implemented
})

router.delete('/:kbs_id', async (req, res) => {
    let kbs_id = req.params.kbs_id;

    OpenaiKbs.findOneAndDelete( { _id: kbs_id }, (err, kbDeleted) => {
        if (err) {
            console.error("find one and delete kbs error: ", err);
            return res.status(500).send({ success: false, error: err});
        } else {
            return res.status(200).send({ success: true, message: 'Knowledge Base deleted successfully', openai_kb: kbDeleted });
        }
    })
})

module.exports = router;