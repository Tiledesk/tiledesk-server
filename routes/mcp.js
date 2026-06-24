let express = require('express');
let router = express.Router();
let winston = require('../config/winston');
const mcpService = require('../services/mcpService');


/**
 * GET /mcp/native
 * Returns the list of available native MCP servers (without URLs)
 */
router.get('/native', async (req, res) => {
  try {
    const servers = await mcpService.getNativeServersPublic();
    res.status(200).send(servers);
  } catch (error) {
    winston.error('Error getting native MCP servers:', error);
    res.status(500).send({ success: false, error: error.message || 'Error getting native MCP servers' });
  }
});

/**
 * POST /mcp/native/:nativeId/connect
 * Initializes a connection to a native MCP server
 */
router.post('/native/:nativeId/connect', async (req, res) => {
  try {
    const id_project = req.projectid;
    const { nativeId } = req.params;

    const serverConfig = await mcpService.resolveNativeServerConfig(nativeId, id_project);
    const result = await mcpService.connectServer(serverConfig);

    res.status(200).send({
      success: true,
      message: 'Native MCP server connected successfully',
      nativeId,
      capabilities: result.capabilities,
      tools: result.tools
    });
  } catch (error) {
    winston.error('Error connecting to native MCP server:', error);
    res.status(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Error connecting to native MCP server'
    });
  }
});

/**
 * POST /mcp/native/:nativeId/tools
 * Gets the list of tools from a native MCP server
 */
router.post('/native/:nativeId/tools', async (req, res) => {
  try {
    const id_project = req.projectid;
    const { nativeId } = req.params;

    const serverConfig = await mcpService.resolveNativeServerConfig(nativeId, id_project);
    const tools = await mcpService.listTools(serverConfig);

    res.status(200).send(tools);
  } catch (error) {
    winston.error('Error getting tools from native MCP server:', error);
    res.status(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Error getting tools from native MCP server'
    });
  }
});

/**
 * POST /mcp/servers
 * Adds or updates an MCP server in the project mcp integration
 * Body (native): { type: 'native', nativeId, tools?, selectedTools? }
 * Body (custom): { type: 'custom', name, url, transport?, customHeaders?, tools?, selectedTools?, auth? }
 */
router.post('/servers', async (req, res) => {
  try {
    const id_project = req.projectid;
    const result = await mcpService.upsertMcpServerInIntegration(id_project, req.body);

    res.status(200).send({
      success: true,
      server: result.server,
      integration: result.integration
    });
  } catch (error) {
    winston.error('Error saving MCP server in integration:', error);
    res.status(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Error saving MCP server in integration'
    });
  }
});

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
    const result = await mcpService.connectServer(serverConfig);

    res.status(200).send({ 
      success: true, 
      message: 'MCP server connected successfully',
      capabilities: result.capabilities,
      tools: result.tools
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

