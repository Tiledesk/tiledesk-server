let express = require('express');
let router = express.Router();
let winston = require('../config/winston');
const mcpService = require('../services/mcpService');

/**
 * POST /mcp/connect
 * Initializes a connection to an MCP server
 * Body: {
 *   url: string,
 *   customHeaders?: [{ key: string, value: string }],
 *   oauth?: object (not supported yet),
 *   auth?: object (legacy, optional)
 * }
 */
router.post('/connect', async (req, res) => {
  try {
    const id_project = req.projectid;
    let serverConfig;

    try {
      serverConfig = mcpService.buildServerConfig(id_project, req.body);
    } catch (error) {
      return res.status(400).send({ success: false, error: error.message });
    }

    const result = await mcpService.initializeServer(serverConfig);

    res.status(200).send({
      success: true,
      message: 'MCP server connected successfully',
      capabilities: result?.capabilities || {}
    });
  } catch (error) {
    winston.error(`Error connecting to MCP server:`, error);
    res.status(500).send({ success: false, error: error.message || 'Error connecting to MCP server' });
  }
});

/**
 * POST /mcp/tools
 * Gets the list of tools from an MCP server
 * Body: {
 *   url: string,
 *   customHeaders?: [{ key: string, value: string }],
 *   oauth?: object (not supported yet),
 *   auth?: object (legacy, optional)
 * }
 */
router.post('/tools', async (req, res) => {
  try {
    const id_project = req.projectid;
    const { url } = req.body;

    winston.info(`MCP /tools called for project ${id_project}, url: ${url}`);

    let serverConfig;
    try {
      serverConfig = mcpService.buildServerConfig(id_project, req.body);
    } catch (error) {
      return res.status(400).send({ success: false, error: error.message });
    }

    const tools = await mcpService.listTools(serverConfig);

    res.status(200).send(tools);
  } catch (error) {
    winston.error(`Error getting tools from MCP server:`, error);
    res.status(500).send({ success: false, error: error.message || 'Error getting tools from MCP server' });
  }
});

module.exports = router;
