var winston = require('../config/winston');
const axios = require("axios").default;
require('dotenv').config();

class AiReindexService {

    constructor() {
        
        this.BASE_URL = process.env.SCHEDULER_BASEURL;
        winston.info("(ReindexScheduler) BASE_URL: " + this.BASE_URL)
        if (!this.BASE_URL) {
            throw new Error("Missing paramter BASE_URL");
        }

        this.TOKEN = process.env.SCHEDULER_TOKEN;
        winston.info("(ReindexScheduler) TOKEN: " + this.TOKEN)
        if (!this.TOKEN) {
            throw new Error("Missing paramter TOKEN");
        }

        this.PROJECT = process.env.SCHEDULER_PROJECT;
        winston.info("(ReindexScheduler) PROJECT: " + this.PROJECT)
        if (!this.PROJECT) {
            throw new Error("Missing paramter PROJECT");
        }

    }

    async delete(content_id) {

        return new Promise( async (resolve, reject) => {

            console.log("find and delete scheduler for content id ", content_id);

            let scheduler = await this.findScheduler(content_id).catch((err) => {
                console.log("findScheduler err: ", err)
                reject(err);
            })

            winston.verbose("(AiReindexService) delete() - scheduler: ", scheduler);

            if (!scheduler) {
                console.log("Scheduler not found for content id " + content_id)
                reject("Scheduler not found for content id " + content_id);
            }

            let isOfflineS = await this.offlineScheduler(scheduler.id).catch((err) => {
                console.log("offlineScheduler err: ", err)
                reject(err);
            })

            winston.verbose("(AiReindexService) delete() - isOfflineS: ", isOfflineS)

            let isOffline = await this.offlineWorkflow(scheduler.processDefinitionCode).catch((err) => {
                console.log("findScheduler err: ", err)
                reject(err);
            })

            winston.verbose("(AiReindexService) delete() - isOffline: ", isOffline)

            let deleteResponse = await this.deleteWorkflow(scheduler.processDefinitionCode).catch((err) => {
                console.log("findScheduler err: ", err)
                reject(err);
            })

            winston.verbose("(AiReindexService) delete() - deleteResponse: ", deleteResponse)
            
            resolve(deleteResponse);
        })
    }
    
    async findScheduler(id) {

        return new Promise( async (resolve, reject) => {
            await axios({
                url: `${this.BASE_URL}/projects/${this.PROJECT}/schedules/list`,
                method: 'POST',
                headers: {
                    token: this.TOKEN
                }
            }).then((response) => {

                console.log("schedulers found: ", response.data.data);
                let scheduler = response.data.data.find(s => s.processDefinitionName === "auto-reindex-" + id);
                if (!scheduler) {
                    resolve(null);
                } else {
                    resolve(scheduler);
    
                }

            }).catch((err) => {
                reject(err);
            })
        })
    }
    
    async offlineScheduler(id) {
    
        return new Promise( async (resolve, reject) => {
            await axios({
                url: `${this.BASE_URL}/projects/${this.PROJECT}/schedules/${id}/offline`,
                method: 'POST',
                headers: {
                    token: this.TOKEN
                }
            }).then((response) => {
                resolve(response.data);
            }).catch((err) => {
                reject(err);
            })
        })
    }
    
    async offlineWorkflow(code) {
    
        return new Promise( async (resolve, reject) => {
    
            const queryParams = {
                releaseState: "OFFLINE"
            }
            await axios({
                url: `${this.BASE_URL}/projects/${this.PROJECT}/process-definition/${code}/release`,
                method: 'POST',
                headers: {
                    token: this.TOKEN
                },
                params: queryParams
              }).then((response) => {
                resolve(response.data);
              }).catch((err) => {
                reject(err);
              })
        })
    }
    
    async deleteWorkflow(code) {
    
        return new Promise( async (resolve, reject) => {
    
            const queryParams = {
                releaseState: "OFFLINE"
            }
            await axios({
                url: `${this.BASE_URL}/projects/${this.PROJECT}/process-definition/${code}`,
                method: 'DELETE',
                headers: {
                    token: this.TOKEN
                }
              }).then((response) => {
                resolve(response.data);
              }).catch((err) => {
                reject(err);
              })
        })
    }
}

module.exports = { AiReindexService };