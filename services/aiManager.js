const { Namespace, KB, Engine } = require('../models/kb_setting');
const Integrations = require("../models/integrations");
const aiService = require("./aiService");
const { Scheduler } = require("./Scheduler");
const { default: Sitemapper } = require('sitemapper');
const winston = require('../config/winston');
const configGlobal = require('../config/global');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');

// Constants
const apiUrl = process.env.API_URL || configGlobal.apiUrl;
const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL || 'amqp://localhost';
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';
const JOB_TOPIC_EXCHANGE_HYBRID = process.env.JOB_TOPIC_EXCHANGE_TRAIN_HYBRID || 'tiledesk-trainer-hybrid';

// Default engine configuration
const default_engine = require('../config/kb/engine');
const default_engine_hybrid = require('../config/kb/engine.hybrid');
const default_embedding = require('../config/kb/embedding');
const integrationService = require('./integrationService');

// Job managers
let jobManager = new JobManager(AMQP_MANAGER_URL, {
  debug: false,
  topic: JOB_TOPIC_EXCHANGE,
  exchange: JOB_TOPIC_EXCHANGE
})

let jobManagerHybrid = new JobManager(AMQP_MANAGER_URL, {
  debug: false,
  topic: JOB_TOPIC_EXCHANGE_HYBRID,
  exchange: JOB_TOPIC_EXCHANGE_HYBRID
})

// Connect job managers
jobManager.connectAndStartPublisher((status, error) => {
  if (error) {
    winston.error("aiManager jobManager connectAndStartPublisher error: ", error);
  } else {
    winston.info("aiManager jobManager - ConnectPublisher done with status: ", status);
  }
});

jobManagerHybrid.connectAndStartPublisher((status, error) => {
  if (error) {
    winston.error("aiManager jobManagerHybrid connectAndStartPublisher error: ", error);
  } else {
    winston.info("aiManager jobManagerHybrid - ConnectPublisher done with status: ", status);
  }
});

class AiManager {

  constructor() { }

  async addMultipleUrls(namespace, urls, options) {
    return new Promise(async (resolve, reject) => {

      let kbs = urls.map((url) => {
        let kb = {
          id_project: namespace.id_project,
          name: url,
          source: url,
          type: 'url',
          content: "",
          namespace: namespace.id,
          status: -1,
          scrape_type: options.scrape_type,
          scrape_options: options.scrape_options,
          refresh_rate: options.refresh_rate,
          ...(options.sitemap_origin_id && { sitemap_origin_id: options.sitemap_origin_id }),
          ...(options.sitemap_origin && { sitemap_origin: options.sitemap_origin }),
          ...(options.tags && { tags: options.tags }),
        }
        return kb;
      })

      let operations = kbs.map(doc => {
        return {
          updateOne: {
            filter: { id_project: doc.id_project, type: 'url', source: doc.source, namespace: namespace.id },
            update: doc,
            upsert: true,
            returnOriginal: false
          }
        }
      })

      this.saveBulk(operations, kbs, namespace.id_project, namespace.id).then( async (result) => {
        let hybrid = namespace.hybrid;
        let engine = namespace.engine || default_engine;
        let embedding = namespace.embedding || default_embedding;
        embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;
        let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

        let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project, ...keepAttrs }) => keepAttrs)
        resources = resources.map(({ _id, scrape_options, ...rest }) => {
          return { id: _id, webhook: webhook, parameters_scrape_type_4: scrape_options, embedding: embedding, engine: engine, hybrid: hybrid, ...rest}
        });

        winston.verbose("resources to be sent to worker: ", resources);

        if (process.env.NODE_ENV === 'test') {
          resolve({ result, schedule_json: resources });
          return;
        }
  
        this.scheduleScrape(resources, hybrid);
        resolve(result);

      }).catch((err) => {
        winston.error("Error save contents in bulk: ", err);
        reject(err);
      })
    })
  }

  async scheduleSitemap(namespace, sitemap_content, options) {
    return new Promise((resolve, reject) => {

      let kb = {
        id: sitemap_content._id,
        source: sitemap_content.source,
        type: 'sitemap',
        content: "",
        namespace: namespace.id,
        refresh_rate: options.refresh_rate,
        engine: namespace.engine,
        embedding: namespace.embedding,
        hybrid: namespace.hybrid,
      }

      if (process.env.NODE_ENV === 'test') {
        resolve(kb);
        return;
      }

      this.scheduleScrape([kb], namespace.hybrid);
      resolve(kb);

    })
  }

  async checkNamespace(id_project, namespace_id) {
    return new Promise( async (resolve, reject) => {

      let namespace = await Namespace.findOne({ id: namespace_id }).catch((err) => {
        winston.error("Error getting namespace ", err);
        reject(err);
      })
      if (!namespace) {
        winston.warn("Namespace not found with id " + namespace_id);
        reject({ errorCode: 404, error: "Namespace not found with id " + namespace_id });
      }
      if (namespace.id_project !== id_project) {
        winston.warn("Namespace not belonging to project " + id_project);
        reject({ errorCode: 403,  error: "Namespace not belonging to project " + id_project });
      }

      resolve(namespace);
    })
  }

  async resolveLLMConfig(id_project, provider = 'openai', model) {

    if (provider === 'ollama' || provider === 'vllm') {
      try {
        const integration = await integrationService.getIntegration(id_project, provider);
        
        if (!integration?.value?.url) {
          throw { code: 422, error: `Server url for ${provider} is empty or invalid`}
        }

        return {
          provider,
          name: model,
          url: integration.value.url,
          api_key: integration.value.apikey || ""
        }

      } catch (err) {
        throw { code: err.code, error: err.error }
      }
    }

    try {
      let key = await integrationService.getKeyFromIntegration(id_project, provider)

      return {
        provider,
        name: model,
        api_key: key
      }

    } catch (err) {
      throw { code: err.code, error: err.error }
    }

  }

  async checkQuotaAvailability(quoteManager, project, ncontents) {

    return new Promise( async (resolve, reject) => {

      let limits = await quoteManager.getPlanLimits(project);
      let kbs_limit = limits.kbs;
      winston.verbose("Limit of kbs for current plan: " + kbs_limit);
  
      let kbs_count = await KB.countDocuments({ id_project: project._id }).exec();
      winston.verbose("Kbs count: " + kbs_count);
  
      if (kbs_count >= kbs_limit) {
        reject({ errorCode: 403, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit });
      }

      let total_count = kbs_count + ncontents;
      if (total_count > kbs_limit) {
        reject({ errorCode: 403, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit });
      }

      resolve(true);
    })
  }

  async fetchSitemap(sitemapUrl) {

    return new Promise(async (resolve, reject) => {
      const sitemap = new Sitemapper({
        url: sitemapUrl,
        timeout: 15000,
        debug: false
      });

      const data = await sitemap.fetch().catch((err) => {
        reject(err);
      })

      if (data.errors && data.errors.length > 0) {
        reject(data.errors[0]);
      }

      const urls = Array.isArray(data.sites) ? data.sites : [];
      resolve(urls);
    })
  }

  async foundSitemapChanges(existingKbs, urls) {
  
    return new Promise( async (resolve, reject) => {
      let existingIdsBySource = {};
      existingKbs.forEach(doc => {
        existingIdsBySource[doc.source] = doc._id;
      });
  
      let addedUrls = urls.filter(url => !existingIdsBySource.hasOwnProperty(url));
      let removedIds = existingKbs
        .filter(doc => !urls.includes(doc.source))
        .map(doc => doc._id);
  
      resolve({ addedUrls, removedIds });
    })
  }

  async generateFilename(name) {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD") // Normalize characters with accents
      .replace(/[\u0300-\u036f]/g, "") // Removes diacritics (e.g. à becomes a)
      .replace(/[^a-z0-9\s-_]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replaces spaces with dashes
      .replace(/_/g, "-")
      .replace(/-+/g, "-"); // Removes consecutive hyphens
  }

  async getKeyFromIntegrations(project_id) {

    return new Promise( async (resolve) => {

      let integration = await Integrations.findOne({ id_project: project_id, name: 'openai' }).catch((err) => {
        winston.error("Unable to find openai integration for the current project " + project_id);
        resolve(null);
      })
      if (integration && integration.value && integration.value.apikey) {
        resolve(integration.value.apikey);
      } else {
        resolve(null);
      }
    })
  }

  async removeMultipleContents(namespace, kbs) {
  
    return new Promise( async (resolve, reject) => {
      
      kbs.forEach((kb) => {
        let data = {
          id: kb._id,
          namespace: kb.namespace,
          engine: namespace.engine || default_engine
        }
  
        aiService.deleteIndex(data).then((resp) => {
          winston.debug("delete content response: ", resp);
          if (resp.data.success === true) {
            KB.findByIdAndDelete(kb._id, (err, deletedKb) => {
              if (err) {
                winston.error("Delete kb error: ", err);
                reject(err);
              }
            })
          } else {
            KB.findOneAndDelete({ _id: kb._id, status: { $in: [-1, 400 ]}}, (err, deletedKb) => {
              if (err) {
                winston.error("Delete kb error: ", err);
                reject(err);
              }
            })
          }
        })
      })
      resolve(true);
    })
  }

  async saveBulk(operations, kbs, project_id, namespace) {

    return new Promise((resolve, reject) => {
      KB.bulkWrite(operations, { ordered: false }).then((result) => {
        winston.verbose("bulkWrite operations result: ", result);

        KB.find({ id_project: project_id, namespace: namespace, source: { $in: kbs.map(kb => kb.source) } }).lean().then((documents) => {
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

  setDefaultScrapeOptions() {
    return {
      tags_to_extract: ["body"],
      unwanted_tags: [],
      unwanted_classnames: []
    }
  }

  async scheduleScrape(resources, hybrid) {

    let scheduler;
    if (hybrid) {
      scheduler = new Scheduler({ jobManager: jobManagerHybrid });
    } else {
      scheduler = new Scheduler({ jobManager: jobManager });
    }

    if (!scheduler) {
      winston.error("ScheduleScrape JobManager is not defined");
      return false;
    }

    resources.forEach(r => {
      winston.debug("Schedule job with following data: ", r);
      scheduler.trainSchedule(r, async (err, result) => {
        let error_code = 100;
        if (err) {
          winston.error("Scheduling error: ", err);
          error_code = 400;
        } else {
          winston.verbose("Scheduling result: ", result);
        }
        await this.updateStatus(r.id, error_code);
      });
    })

    return true;
  }

  // from webhook
  // async scheduleScrape(resources) {

  //   let scheduler = new Scheduler({ jobManager: jobManager });
  
  //   resources.forEach(r => {
  //     winston.debug("(Webhook) Schedule job with following data: ", r);
  //     scheduler.trainSchedule(r, async (err, result) => {
  //       if (err) {
  //         winston.error("Scheduling error: ", err);
  //       } else {
  //         winston.info("Scheduling result: ", result);
  //       }
  //     });
  //   })
  
  //   return true;
  // }

  async startScrape(data) {

    if (!data.gptkey) {
      let gptkey = process.env.GPTKEY;
      if (!gptkey) {
        return { error: "GPT apikey undefined" }
      }
      data.gptkey = gptkey;
    }
  
    let status_updated = await this.updateStatus(data.id, 200);
    winston.verbose("status of kb " + data.id + " updated: " + status_updated);
  
    return new Promise((resolve, reject) => {
      aiService.singleScrape(data).then(async (resp) => {
        winston.debug("singleScrape resp: ", resp.data);
        let status_updated = await this.updateStatus(data.id, 300);
        winston.verbose("status of kb " + data.id + " updated: " + status_updated);
        resolve(resp.data);
      }).catch( async (err) => {
        winston.error("singleScrape err: ", err);
        let error_message = err.response?.data?.error || "An unexpected error occurred";
        let status_updated = await this.updateStatus(data.id, 400, error_message);
        winston.verbose("status of kb " + data.id + " updated: " + status_updated);
        reject(err);
      })
    })
  }

  async statusConverter(status) {
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

  async updateStatus(id, status, error) {
    return new Promise((resolve) => {

      let update = {
        status: status,
        last_refresh: new Date()
      }

      if (error) {
        update.last_error = {
          timestamp: Date.now(),
          message: error
        }
      }

      KB.findByIdAndUpdate(id, update, { new: true }, (err, updatedKb) => {
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

}

const aiManager = new AiManager();

module.exports = aiManager;