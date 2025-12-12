const winston = require('../config/winston');
const integrations = require('../models/integrations');

class IntegrationService {

  

    async getIntegration(id_project, integration_name) {
        if (!id_project || !integration_name) {
            throw({ code: 422, error: "Fields 'id_project', 'integration_name' are mandatory" });
        }

        try {
            const integration = await integrations.findOne({ id_project: id_project, name: integration_name});
            if (!integration && integration_name !== 'openai') {
                throw({ code: 404, error: `Integration ${integration_name} not found for project ${id_project}` });
            }

            return integration;

        } catch (err) {
            winston.error("Erro getting integration: ", err);
            throw({ code: err.code || 500, error: err.error || `Error getting integration for ${integration_name} for project ${id_project}` })
        }
    }

    async getKeyFromIntegration(id_project, integration_name = 'openai') {
        if (!id_project || !integration_name) {
            throw({ code: 422, error: "Fields 'id_project', 'integration_name' are mandatory" });
        }

        try {
            const integration = await integrations.findOne({ id_project: id_project, name: integration_name});
            if (!integration && integration_name !== 'openai') {
                throw({ code: 404, error: `Integration ${integration_name} not found for project ${id_project}` });
            }

            return integration?.value?.apikey;

        } catch (err) {
            winston.error("Error getting integration: ", err);
            throw({ code: err.code || 500, error: err.error || `Error getting integration for ${integration_name} for project ${id_project}` })
        }
    }
}

const integrationService = new IntegrationService();

module.exports = integrationService;

