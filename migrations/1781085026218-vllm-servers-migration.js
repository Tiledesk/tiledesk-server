const winston = require('../config/winston');
const Integration = require('../models/integrations');

function getServerName(url) {
    if (!url) return null;

    try {
        const hostname = new URL(url).hostname;

        if (hostname === 'localhost') return 'localhost';

        const parts = hostname.split('.');

        if (parts.length >= 2) {
            return parts[parts.length - 2];
        }

        return hostname;

    } catch (err) {
        winston.error("Error getting server name from URL: ", err);
        return url;
    }
}

async function up() {
  try {
    let integrations = await Integration.find({ name: 'vllm' });

    for (const integration of integrations) {
        
        if (integration.value?.servers) continue;

        if (!integration.value.url) continue;

        integration.value.servers = [{
            name: getServerName(integration.value.url) || "default",
            url: integration.value.url,
            apikey: integration.value.apikey || "",
            models: integration.value.models || []
        }];

        delete integration.value.url;
        delete integration.value.apikey;
        delete integration.value.models;
        delete integration.value.token;

        integration.markModified('value');

        await integration.save();
        winston.info(`VLLM server ${integration.value.url} migrated to ${integration.value.servers[0].name}`);
    }
  } catch (err) {
    winston.error("VLLM servers migration error: ", err);
  }
}

module.exports = { up };