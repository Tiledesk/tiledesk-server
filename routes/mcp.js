let express = require('express');
let router = express.Router();
let winston = require('../config/winston');
const mcpService = require('../services/mcpService');
const Project = require('../models/project');

/**
 * POST /mcp/connect
 * Initializes a connection to an MCP server
 * Body: { url: string, auth?: { type: 'bearer'|'api_key'|'basic', token?: string, key?: string, username?: string, password?: string } }
 */
router.post('/connect', async (req, res) => {
  try {
    const id_project = req.projectid;
    const { url, auth } = req.body;

    if (!url) {
      return res.status(400).send({ success: false, error: "Missing required parameter 'url'" });
    }

    // Build server configuration
    const serverConfig = {
      url: url,
      projectId: id_project,
      auth: auth || undefined
    };

    // Initialize the connection
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
 * Body: { url: string, auth?: object }
 */
router.post('/tools', async (req, res) => {
  try {
    const id_project = req.projectid;
    const { url, auth } = req.body;

    if (!url) {
      return res.status(400).send({ success: false, error: "Missing required parameter 'url' in body" });
    }

    // Build server configuration
    const serverConfig = {
      url: url,
      projectId: id_project,
      auth: auth || undefined
    };

    // listTools automatically initializes if necessary
    const tools = await mcpService.listTools(serverConfig);

    res.status(200).send(tools);
  } catch (error) {
    winston.error(`Error getting tools from MCP server:`, error);
    res.status(500).send({ success: false, error: error.message || 'Error getting tools from MCP server' });
  }
});

module.exports = router;

