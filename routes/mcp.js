let express = require('express');
let router = express.Router();
let winston = require('../config/winston');
const mcpService = require('../services/mcpService');
const Project = require('../models/project');


/**
 * GET /mcp/tools/:serverName
 * Ottiene la lista dei tool da un server MCP specifico
 */
router.get('/tools', async (req, res) => {

  try {
    const id_project = req.projectid;
    const server_url = req.query.url;

    if (!server_url) {
      return res.status(400).send({ success: false, error: "Missing query parameter 'url'" });
    }

    const tools = await mcpService.listTools(server_url);

    res.status(200).send(tools);
  } catch (error) {
    winston.error(`Error getting tools from MCP server ${server_url}:`, error);
    res.status(500).send({ success: false, error: `Error getting tools from MCP server ${server_url}` });
  }
});



module.exports = router;

