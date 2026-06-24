'use strict';

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const winston = require('../config/winston');
const cacheUtil = require('../utils/cacheUtil');

const NATIVE_MCP_CACHE_KEY = 'native_mcp:servers';
const NATIVE_MCP_CONFIG_PATH = path.join(__dirname, '../config/native_mcp/native_mcp_servers.json');


/**
 * MCP Service - Manages connections and calls to MCP servers
 * MCP (Model Context Protocol) uses JSON-RPC 2.0 for communication
 */
class MCPService {

  constructor() {
    // Cache of connections to MCP servers
    // Key: `${projectId}_${url}` or just `${url}` if projectId is not provided
    // Value: { config, sessionId?, initialized, capabilities }
    this.connections = new Map();
    this.tdCache = undefined;
  }

  setTdCache(tdCache) {
    this.tdCache = tdCache;
  }

  /**
   * Parses a response in SSE (Server-Sent Events) format and extracts the JSON object
   * @param {String} sseData - String with SSE format
   * @returns {Object} - Parsed JSON object
   */
  parseSSEResponse(sseData) {
    const lines = sseData.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6); // Removes "data: "
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          throw new Error(`Failed to parse SSE JSON data: ${e.message}`);
        }
      }
    }
    throw new Error('No data field found in SSE response');
  }

  /**
   * Sends a JSON-RPC request to an MCP server
   * @param {String} url - MCP server URL
   * @param {Object} request - JSON-RPC request
   * @param {Object} auth - Authentication configuration (optional)
   * @param {String} sessionId - Session ID for the MCP server (optional)
   * @returns {Promise<Object>} - Server response (includes sessionId if present in headers)
   */
  async sendJSONRPCRequest(url, request, auth, sessionId) {
    const config = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      data: request,
      timeout: 30000, // 30 seconds timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept also 4xx to capture headers
      }
    };

    // Add session ID in mcp-session-id header if present
    if (sessionId) {
      config.headers['mcp-session-id'] = sessionId;
    }

    // Add authentication if present
    if (auth) {
      if (auth.type === 'bearer' && auth.token) {
        config.headers['Authorization'] = `Bearer ${auth.token}`;
      } else if (auth.type === 'api_key' && auth.key) {
        config.headers['X-API-Key'] = auth.key;
      } else if (auth.type === 'basic' && auth.username && auth.password) {
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${credentials}`;
      }
    }

    try {
      const response = await axios(config);

      // Capture session ID from response headers (if present)
      const sessionIdFromHeader = response.headers['mcp-session-id'] || 
                                  response.headers['x-mcp-session-id'];

      // Parse response: could be SSE (text/event-stream) or direct JSON
      let responseData;
      if (typeof response.data === 'string') {
        // SSE format: extracts JSON from "data:" line
        responseData = this.parseSSEResponse(response.data);
      } else {
        // JSON response already parsed
        responseData = response.data;
      }

      // Add session ID from response if present in headers
      if (sessionIdFromHeader) {
        responseData.sessionId = sessionIdFromHeader;
      }

      // Check if there's a JSON-RPC error
      if (responseData.error) {
        throw new Error(`MCP Error: ${responseData.error.message || 'Unknown error'} (code: ${responseData.error.code})`);
      }

      return responseData;
    } catch (error) {
      if (error.response) {
        // HTTP error
        const status = error.response.status;
        const statusText = error.response.statusText;
        const responseData = error.response.data;
        const errorMessage = `HTTP Error ${status}: ${statusText}`;
        const details = responseData ? ` - ${JSON.stringify(responseData)}` : '';
        throw new Error(`${errorMessage}${details}`);
      } else if (error.request) {
        // No response received
        throw new Error(`No response from MCP server: ${error.message}`);
      } else {
        // Request configuration error
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * Generates a unique cache key based on URL and projectId
   * @param {String} url - MCP server URL
   * @param {String} projectId - Project ID (optional)
   * @returns {String} - Unique cache key
   */
  getCacheKey(url, projectId) {
    return projectId ? `${projectId}_${url}` : url;
  }

  async getNativeServersCatalog() {
    if (this.tdCache) {
      try {
        const cached = await this.tdCache.getJSON(NATIVE_MCP_CACHE_KEY);
        if (cached) {
          return cached;
        }
      } catch (error) {
        winston.warn('Error reading native MCP servers from cache:', error);
      }
    }

    const servers = await this.loadNativeServersFromFile();

    if (this.tdCache) {
      try {
        await this.tdCache.setJSON(NATIVE_MCP_CACHE_KEY, servers, { EX: cacheUtil.longTTL });
      } catch (error) {
        winston.warn('Error caching native MCP servers:', error);
      }
    }

    return servers;
  }

  sanitizeNativeServerForPublic(server) {
    const publicServer = {
      id: server.id,
      name: server.name,
      native: server.native,
      transport: server.transport
    };
    if (server.description) {
      publicServer.description = server.description;
    }
    return publicServer;
  }

  async loadNativeServersFromFile() {
    const content = await fs.readFile(NATIVE_MCP_CONFIG_PATH, 'utf8');
    const servers = JSON.parse(content);

    if (!Array.isArray(servers)) {
      throw new Error('Native MCP servers configuration must be an array');
    }

    for (const server of servers) {
      if (!server.id) {
        throw new Error(`Native MCP server '${server.name || 'unknown'}' is missing required field 'id'`);
      }
    }

    return servers;
  }

  async getNativeServersPublic() {
    const servers = await this.getNativeServersCatalog();
    return servers.map((server) => this.sanitizeNativeServerForPublic(server));
  }

  async getNativeServerById(id) {
    const servers = await this.getNativeServersCatalog();
    return servers.find((server) => server.id === id) || null;
  }

  /**
   * Initializes a connection to an MCP server
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth? }
   * @returns {Promise<Object>} - Initialization result
   */
  async initializeServer(serverConfig) {
    if (!serverConfig || !serverConfig.url) {
      throw new Error('Server MCP configuration is missing or invalid');
    }

    const serverId = this.getCacheKey(serverConfig.url, serverConfig.projectId);

    try {
      // Initialize session (some MCP servers require session ID)
      let sessionId = null;
      let initializeResponse = null;
      
      try {
        // JSON-RPC call to initialize the server
        const response = await this.sendJSONRPCRequest(serverConfig.url, {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            clientInfo: {
              name: 'tiledesk-server',
              version: '1.0.0'
            }
          }
        }, serverConfig.auth, null);

        // Session ID is returned in 'mcp-session-id' header from response
        sessionId = response.sessionId || null;
        initializeResponse = response;

        if (sessionId) {
          winston.debug(`MCP Server ${serverId} session initialized with ID: ${sessionId}`);
        } else {
          winston.debug(`MCP Server ${serverId} initialized (stateless, no session ID required)`);
        }
      } catch (initError) {
        // If initialization fails, try anyway without session ID
        // (some MCP servers don't require session ID)
        winston.debug(`MCP Server ${serverId} initialization failed: ${initError.message}`);
        throw initError;
      }

      // Save connection in cache with session ID
      this.connections.set(serverId, {
        config: serverConfig,
        sessionId: sessionId,
        initialized: true,
        capabilities: initializeResponse.result?.capabilities || {}
      });

      winston.info(`MCP Server initialized: ${serverId}${sessionId ? ` (session: ${sessionId})` : ' (stateless)'}`);
      return initializeResponse.result;
    } catch (error) {
      winston.error(`Error initializing MCP server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the list of available tools from an MCP server
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth? }
   * @returns {Promise<Array>} - List of available tools
   */
  async listTools(serverConfig) {
    if (!serverConfig || !serverConfig.url) {
      throw new Error('Server MCP configuration is missing or invalid');
    }

    const serverId = this.getCacheKey(serverConfig.url, serverConfig.projectId);

    try {
      // Check if server is already initialized
      let connection = this.connections.get(serverId);
      if (!connection) {
        await this.initializeServer(serverConfig);
        connection = this.connections.get(serverId);
      }

      const sessionId = connection?.sessionId || null;

      // JSON-RPC call to get the list of tools
      // If server requires session ID but we don't have it, try first without
      let response;
      try {
        response = await this.sendJSONRPCRequest(serverConfig.url, {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        }, serverConfig.auth, sessionId);
      } catch (error) {
        // If it fails and we have a "No valid session ID" error, try without session ID
        if (sessionId && error.message && error.message.includes('No valid session ID')) {
          winston.debug(`Retrying tools/list without session ID for server ${serverId}...`);
          response = await this.sendJSONRPCRequest(serverConfig.url, {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list',
            params: {}
          }, serverConfig.auth, null);
        } else {
          throw error;
        }
      }

      const tools = response.result?.tools || [];
      winston.debug(`MCP Server ${serverId} returned ${tools.length} tools`);
      return tools;
    } catch (error) {
      winston.error(`Error listing tools from MCP server ${serverId}:`, error);
      throw error;
    }
  }


  /**
   * Removes a connection from cache
   * @param {String} url - MCP server URL
   * @param {String} projectId - Project ID (optional)
   */
  removeConnection(url, projectId) {
    const serverId = this.getCacheKey(url, projectId);
    this.connections.delete(serverId);
  }

  /**
   * Clears all connections from cache
   */
  clearConnections() {
    this.connections.clear();
  }
}

// Singleton instance
const mcpService = new MCPService();

module.exports = mcpService;

