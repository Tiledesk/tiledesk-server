var express = require('express');
var { Namespace } = require('../models/kb_setting');
var { KB } = require('../models/kb_setting');
var router = express.Router();
var winston = require('../config/winston');
var multer = require('multer')
var upload = multer()
const openaiService = require('../services/openaiService');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
const { Scheduler } = require('../services/Scheduler');
var configGlobal = require('../config/global');
const Sitemapper = require('sitemapper');
var mongoose = require('mongoose');


const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL;
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';
const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
const apiUrl = process.env.API_URL || configGlobal.apiUrl;

let jobManager = new JobManager(AMQP_MANAGER_URL, {
    debug: false,
    topic: JOB_TOPIC_EXCHANGE,
    exchange: JOB_TOPIC_EXCHANGE
})

jobManager.connectAndStartPublisher(() => {
    winston.info("ConnectPublisher done");
})

let default_preview_settings = {
    model: 'gpt-3.5-turbo',
    max_tokens: 128,
    temperature: 0.7,
    top_k: 4,
    context: "You are an awesome AI Assistant."

}
/**
 * ****************************************
 * Namespace Section - Start
 * ****************************************
 */
router.get('/namespace/all', async (req, res) => {

    let project_id = req.projectid;

    Namespace.find({ id_project: project_id }, (err, namespaces) => {

        if (err) {
            winston.error("find namespaces error: ", err);
            return res.status(500).send({ success: false, error: err });
        }
        else if (namespaces.length == 0) {

            // Create Default Namespace
            let new_namespace = new Namespace({
                id_project: project_id,
                namespace_id: project_id,
                name: "Default",
                preview_settings: default_preview_settings,
                default: true
            })

            new_namespace.save((err, savedNamespace) => {
                if (err) {
                    winston.error("create default namespace error: ", err);
                    return res.status(500).send({ success: false, error: err });
                }

                let namespaces = [];
                namespaces.push(savedNamespace);

                return res.status(200).send(namespaces);

            })

        } else {

            return res.status(200).send(namespaces);
        }
    })
})

router.post('/namespace', async (req, res) => {

    let project_id = req.projectid;
    let body = req.body;
    winston.debug("add namespace body: ", body);

    var namespace_id = mongoose.Types.ObjectId();

    let new_namespace = new Namespace({
        id_project: project_id,
        namespace_id: namespace_id,
        name: body.name,
        preview_settings: default_preview_settings,
    })

    new_namespace.save((err, savedNamespace) => {
        if (err) {
            winston.error("create namespace error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        return res.status(200).send(savedNamespace);
    })
})

router.put('/namespace/:namespace_id', async (req, res) => {

    let namespace_id = req.params.namespace_id;
    let body = req.body;
    winston.debug("update namespace body: ", body);

    let update = {};

    if (body.name) {
        update.name = body.name;
    }
    if (body.preview_settings) {
        update.preview_settings = body.preview_settings;
    }

    Namespace.findOneAndUpdate({ namespace_id: namespace_id }, update, { new: true, upsert: true }, (err, updatedNamespace) => {
        if (err) {
            winston.error("update namespace error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        res.status(200).send(updatedNamespace);
    })
})

router.delete('/namespace/:namespace_id', async (req, res) => {

    let id_project = req.projectid;
    let namespace_id = req.params.namespace_id;

    let data = {
        namespace: namespace_id
    }


    if (req.query.contents_only && (req.query.contents_only === true || req.query.contents_only === 'true')) {
        openaiService.deleteNamespace(data).then( async (resp) => {
            winston.debug("delete namespace resp: ", resp.data);

            let deleteResponse = await KB.deleteMany({ id_project: id_project, namespace: namespace_id }).catch((err) => {
                winston.error("deleteMany error: ", err);
                return res.status(500).send({ success: false, error: err });
            })
            winston.debug("delete all contents response: ", deleteResponse);

            return res.status(200).send({ success: true, message: "All contents deleted successfully " })

        }).catch((err) => {
            let status = err.response.status;
            return res.status(status).send({ success: false, error: "Unable to delete namespace" })
        })
    }


    let namespace = await Namespace.findOne({ namespace_id: namespace_id }).catch((err) => {
        winston.error("findOne namespace error: ", err);
        return res.status(500).send({ success: false, error: err });
    })
    console.log("namespace: ", namespace)
    if (namespace.default === true) {
        winston.error("Default namespace cannot be deleted");
        return res.status(403).send({ success: false, error: "Default namespace cannot be deleted" });
    }

    openaiService.deleteNamespace(data).then( async (resp) => {
        winston.debug("delete namespace resp: ", resp.data);

        let deleteResponse = await KB.deleteMany({ id_project: id_project, namespace: namespace_id }).catch((err) => {
            winston.error("deleteMany error: ", err);
            return res.status(500).send({ success: false, error: err });
        })
        winston.debug("delete all contents response: ", deleteResponse);

        let deleteNamespaceResponse = await Namespace.findOneAndDelete({ namespace_id: namespace_id }).catch((err) => {
            winston.error("deleteOne namespace error: ", err);
            return res.status(500).send({ success: false, error: err });
        })
        winston.debug("delete namespace response: ", deleteNamespaceResponse);

        return res.status(200).send({ success: true, message: "Namespace deleted succesfully" })

    }).catch((err) => {
        let status = 400;
        if (err.response && err.response.status) {
            status = err.response.status;
        }
        return res.status(status).send({ success: false, error: "Unable to delete namespace" })
    })

})
/**
 * ****************************************
 * Namespace Section - End
 * ****************************************
 */


//----------------------------------------


/**
* ****************************************
* Content Section - Start
* ****************************************
*/
router.get('/', async (req, res) => {

    let project_id = req.projectid;
    let namespace = req.query.namespace;
    if (!namespace) {
        return res.status(400).send({ success: false, error: "queryParam namespace is not defined" })
    }
    let status;
    let type;
    let limit = 200;
    let page = 0;
    let direction = -1;
    let sortField = "updatedAt";
    let text;

    let query = {};
    query["id_project"] = project_id;
    query["namespace"] = namespace;

    if (req.query.status) {
        status = parseInt(req.query.status);
        query["status"] = status;
        winston.debug("Get kb status: " + status)
    }

    if (req.query.type) {
        type = req.query.type;
        query["type"] = type;
        winston.debug("Get kb type: " + type);
    }

    if (req.query.limit) {
        limit = parseInt(req.query.limit);
        winston.debug("Get kb limit: " + limit)
    }

    if (req.query.page) {
        page = parseInt(req.query.page);
        winston.debug("Get kb page: " + page)
    }

    let skip = page * limit;
    winston.debug("Get kb skip page: " + skip);

    if (req.query.direction) {
        direction = parseInt(req.query.direction)
        winston.debug("Get kb direction: " + direction)
    }

    if (req.query.sortField) {
        sortField = req.query.sortField;
        winston.debug("Get kb sortField: " + sortField)
    }

    if (req.query.search) {
        text = req.query.search;
        query['source'] = new RegExp(text);
        winston.debug("Get kb text: " + text);
    }

    let sortQuery = {};
    sortQuery[sortField] = direction;
    winston.debug("Get kb sortQuery: " + sortQuery);

    KB.countDocuments(query, (err, kbs_count) => {
        if (err) {
            winston.error("Find all kbs error: ", err);
        }
        winston.debug("KBs count: ", kbs_count);

        KB.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sortQuery)
            .exec((err, kbs) => {
                if (err) {
                    winston.error("Find all kbs error: ", err);
                    return res.status(500).send({ success: false, error: err });
                }

                winston.debug("KBs found: ", kbs);

                let response = {
                    count: kbs_count,
                    query: {},
                    kbs: kbs
                }
                if (status) {
                    response.query.status = status;
                }
                if (limit) {
                    response.query.limit = limit;
                }
                if (status) {
                    response.query.page = page;
                }
                if (sortField) {
                    response.query.sortField = sortField;
                }
                if (direction) {
                    response.query.direction = direction;
                }
                if (text) {
                    response.query.search = text;
                }


                return res.status(200).send(response);
            })

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

    if (!body.namespace) {
      return res.status(400).send({ success: false, error: "parameter 'namespace' is not defined" });
    }

    let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
      winston.error("find namespaces error: ", err)
      res.status(200).send({ success: false, error: err })
    })

    let namespaceIds = namespaces.map(namespace => namespace.namespace_id);
    console.log("namespaceIds: ", namespaceIds);

    if (!namespaceIds.includes(body.namespace)) {
      return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project."})
    }

    let quoteManager = req.app.get('quote_manager');
    let limits = await quoteManager.getPlanLimits(req.project);
    let kbs_limit = limits.kbs;
    winston.verbose("Limit of kbs for current plan: " + kbs_limit);

    let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
    winston.verbose("Kbs count: " + kbs_count);

    if (kbs_count >= kbs_limit) {
        return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
    }

    let total_count = kbs_count + 1;
    if (total_count > kbs_limit) {
        return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
    }
    let new_kb = {
        id_project: project_id,
        name: body.name,
        type: body.type,
        source: body.source,
        content: body.content,
        namespace: body.namespace,
        status: -1
    }
    if (!new_kb.namespace) {
        new_kb.namespace = project_id;
    }
    winston.debug("adding kb: ", new_kb);

    KB.findOneAndUpdate({ id_project: project_id, type: 'url', source: new_kb.source }, new_kb, { upsert: true, new: true, rawResult: true }, async (err, raw) => {
        if (err) {
            winston.error("findOneAndUpdate with upsert error: ", err);
            res.status(500).send({ success: false, error: err });
        }
        else {

            res.status(200).send(raw);

            let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

            let json = {
                id: raw.value._id,
                type: raw.value.type,
                source: raw.value.source,
                content: "",
                namespace: raw.value.namespace,
                webhook: webhook
            }
            winston.debug("json: ", json);

            if (raw.value.content) {
                json.content = raw.value.content;
            }

            let resources = [];

            resources.push(json);
            scheduleScrape(resources);

            // startScrape(json).then((response) => {
            //     winston.verbose("startScrape response: ", response);
            // }).catch((err) => {
            //     winston.error("startScrape err: ", err);
            // })

        }
    })

})

router.post('/multi', upload.single('uploadFile'), async (req, res) => {

    let list;
    if (req.file) {
        file_string = req.file.buffer.toString('utf-8');
        list = file_string.trim().split('\n');
    } else {
        list = req.body.list;
    }

    let project_id = req.projectid;

    let quoteManager = req.app.get('quote_manager');
    let limits = await quoteManager.getPlanLimits(req.project);
    let kbs_limit = limits.kbs;
    winston.verbose("Limit of kbs for current plan: " + kbs_limit);

    let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
    winston.verbose("Kbs count: " + kbs_count);

    if (kbs_count >= kbs_limit) {
        return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
    }

    let total_count = kbs_count + list.length;
    if (total_count > kbs_limit) {
        return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
    }

    if (list.length > 300) {
        winston.error("Too many urls. Can't index more than 300 urls at a time.");
        return res.status(403).send({ success: false, error: "Too many urls. Can't index more than 300 urls at a time." })
    }

    let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

    let kbs = [];
    list.forEach(url => {
        kbs.push({
            id_project: project_id,
            name: url,
            source: url,
            type: 'url',
            content: "",
            namespace: project_id,
            status: -1
        })
    })

    let operations = kbs.map(doc => {
        return {
            updateOne: {
                filter: { id_project: doc.id_project, type: 'url', source: doc.source },
                update: doc,
                upsert: true,
                returnOriginal: false
            }
        }
    })

    saveBulk(operations, kbs, project_id).then((result) => {

        let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project, ...keepAttrs }) => keepAttrs)
        resources = resources.map(({ _id, ...rest }) => {
            return { id: _id, webhook: webhook, ...rest };
        });
        winston.verbose("resources to be sent to worker: ", resources);
        scheduleScrape(resources);
        res.status(200).send(result);

    }).catch((err) => {
        winston.error("Unable to save kbs in bulk ", err)
        res.status(500).send(err);
    })

})

router.post('/sitemap', async (req, res) => {

    let sitemap_url = req.body.sitemap;

    const sitemap = new Sitemapper({
        url: sitemap_url,
        timeout: 15000
    });

    sitemap.fetch().then((data) => {
        winston.debug("data: ", data);
        res.status(200).send(data);
    }).catch((err) => {
        console.error("err ", err)
        res.status(500).send({ success: false, error: err });
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

    winston.debug("kb update: ", update);

    KB.findByIdAndUpdate(kb_id, update, { new: true }, (err, savedKb) => {

        if (err) {
            winston.error("KB findByIdAndUpdate error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        if (!savedKb) {
            winston.debug("Try to updating a non-existing kb");
            return res.status(400).send({ success: false, message: "Content not found" })
        }

        res.status(200).send(savedKb)
    })

})

// PROXY PUGLIA AI V2 - START
router.post('/scrape/single', async (req, res) => {

    let data = req.body;
    winston.debug("/scrape/single data: ", data);

    KB.findById(data.id, (err, kb) => {
        if (err) {
            winston.error("findById error: ", err);
            return res.status(500).send({ success: false, error: err });
        }

        else if (!kb) {
            return res.status(404).send({ success: false, error: "Unable to find the kb requested" })
        }
        else {

            let json = {
                id: kb._id,
                type: kb.type,
                source: kb.source,
                content: "",
                namespace: kb.namespace
            }

            if (kb.content) {
                json.content = kb.content;
            }

            startScrape(json).then((response) => {
                winston.verbose("startScrape response: ", response);
                res.status(200).send(response);
            }).catch((err) => {
                winston.error("startScrape err: ", err);
                res.status(500).send({ success: false, error: err });
            })

        }
    })

})

router.post('/scrape/status', async (req, res) => {

    let data = req.body;
    winston.debug("/scrapeStatus req.body: ", req.body);

    let returnObject = false;

    if (req.query &&
        req.query.returnObject &&
        (req.query.returnObject === true || req.query.returnObject === 'true')) {
        returnObject = true;
    }

    openaiService.scrapeStatus(data).then(async (response) => {

        winston.debug("scrapeStatus response.data: ", response.data);

        let update = {};

        if (response.data.status_code) {
            // update.status = response.data.status_code;
            update.status = await statusConverter(response.data.status_code)

        }

        KB.findByIdAndUpdate(data.id, update, { new: true }, (err, savedKb) => {

            if (err) {
                winston.verbose("Status was successfully recovered, but the update on the db failed");
                winston.error("find kb by id and updated error: ", err);

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
        res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
    })
})

router.post('/qa', async (req, res) => {

    let publicKey = false;
    let data = req.body;

    // add or override namespace value if it is passed for security reason
    data.namespace = req.projectid;
    winston.debug("/qa data: ", data);

    // if (req.body.namespace != req.projectid) {
    //     return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project."})
    // }

    if (!data.gptkey) {
        let gptkey = process.env.GPTKEY;
        if (!gptkey) {
            return res.status(403).send({ success: false, error: "GPT apikey undefined" })
        }
        data.gptkey = gptkey;
        publicKey = true;
    }

    let obj = { createdAt: new Date() };

    let quoteManager = req.app.get('quote_manager');
    if (publicKey === true) {
        let isAvailable = await quoteManager.checkQuote(req.project, obj, 'tokens');
        if (isAvailable === false) {
            return res.status(403).send({ success: false, error: "Tokens quota exceeded" });
        }
    }

    openaiService.askNamespace(data).then((resp) => {
        winston.debug("qa resp: ", resp.data);
        let answer = resp.data;

        let id = answer.id;
        let index = id.indexOf("#");
        if (index != -1) {
            id = id.substring(index + 1);
        }

        console.log("askNamespace resp: ", resp);

        KB.findById(id, (err, resource) => {

            let multiplier = MODEL_MULTIPLIER[data.model];
            if (!multiplier) {
                multiplier = 1;
                winston.info("No multiplier found for AI model")
            }
            obj.multiplier = multiplier;
            obj.tokens = answer.prompt_token_size;

            let incremented_key = quoteManager.incrementTokenCount(req.project, obj);
            winston.verbose("incremented_key: ", incremented_key);

            if (err) {
                winston.error("Unable to find resource with id " + id + " in namespace " + answer.namespace + ". The standard answer is returned.")
                return res.status(200).send(resp.data);
            }

            answer.source = resource.name;
            return res.status(200).send(answer);
        })


    }).catch((err) => {
        winston.error("qa err: ", err);
        console.log(err.response)
        if (err.response && err.response.status) {
            let status = err.response.status;
            res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
        }
        else {
            res.status(500).send({ success: false, error: err });
        }

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
        res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
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
        res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
    })
})
// PROXY PUGLIA AI V2 - END

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

        if (resp.data.success === true) {
            KB.findByIdAndDelete(kb_id, (err, deletedKb) => {

                if (err) {
                    winston.error("Delete kb error: ", err);
                    return res.status(500).send({ success: false, error: err });
                }
                res.status(200).send(deletedKb);
            })

        } else {
            winston.verbose("resp.data: ", resp.data);

            KB.findOneAndDelete({ _id: kb_id, status: { $in: [-1, 3, 4, 100, 300, 400] } }, (err, deletedKb) => {
                if (err) {
                    winston.error("findOneAndDelete err: ", err);
                    return res.status(500).send({ success: false, error: "Unable to delete the content due to an error" })
                }
                else if (!deletedKb) {
                    winston.verbose("Unable to delete the content in indexing status")
                    return res.status(500).send({ success: false, error: "Unable to delete the content in indexing status" })
                } else {
                    res.status(200).send(deletedKb);
                }
            })
        }

    }).catch((err) => {
        let status = err.response.status;
        res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
    })

})



async function saveBulk(operations, kbs, project_id) {

    return new Promise((resolve, reject) => {
        KB.bulkWrite(operations, { ordered: false }).then((result) => {
            winston.verbose("bulkWrite operations result: ", result);

            KB.find({ id_project: project_id, source: { $in: kbs.map(kb => kb.source) } }).lean().then((documents) => {
                winston.debug("documents: ", documents);
                resolve(documents)
            }).catch((err) => {
                winston.error("Error finding documents ", err)
                reject(err);
            })

        }).catch((err) => {
            reject(err);
        })
    })

}

async function statusConverter(status) {
    return new Promise((resolve) => {

        let td_status;
        switch (status) {
            case 0:
                td_status = -1;
                break;
            case 2:
                td_status = 200;
                break;
            case 3:
                td_status = 300;
                break;
            case 4:
                td_status = 400;
                break;
            default:
                td_status = -1
        }
        resolve(td_status);
    })
}

async function updateStatus(id, status) {
    return new Promise((resolve) => {

        KB.findByIdAndUpdate(id, { status: status }, { new: true }, (err, updatedKb) => {
            if (err) {
                resolve(false)
            } else if (!updatedKb) {
                winston.verbose("Unable to update status. Data source not found.")
                resolve(false)
            } else {
                winston.debug("updatedKb: ", updatedKb)
                resolve(true);
            }
        })
    })
}

async function scheduleScrape(resources) {

    // let data = {
    //     resources: resources
    // }
    let scheduler = new Scheduler({ jobManager: jobManager });

    resources.forEach(r => {
        winston.debug("Schedule job with following data: ", r);
        scheduler.trainSchedule(r, async (err, result) => {
            let error_code = 100;
            if (err) {
                winston.error("Scheduling error: ", err);
                error_code = 400;
            } else {
                winston.info("Scheduling result: ", result);
            }
            await updateStatus(r.id, error_code);
        });
    })


    return true;
}

async function startScrape(data) {

    if (!data.gptkey) {
        let gptkey = process.env.GPTKEY;
        if (!gptkey) {
            return { error: "GPT apikey undefined" }
        }
        data.gptkey = gptkey;
    }

    return new Promise((resolve, reject) => {
        openaiService.singleScrape(data).then(async (resp) => {
            winston.debug("singleScrape resp: ", resp.data);
            let status_updated = await updateStatus(data.id, 100);
            winston.verbose("status of kb " + data.id + " updated: " + status_updated);
            resolve(resp.data);
        }).catch((err) => {
            winston.error("singleScrape err: ", err);
            reject(err);
        })
    })
}

module.exports = router;