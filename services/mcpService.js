'use strict';

const axios = require('axios').default;
const winston = require('../config/winston');


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
  }

  /**
   * Normalizes auth.type to a canonical value
   * Accepts: mcp_api_key, X-MCP-API-Key, x-mcp-api-key, etc.
   * @param {String} type - Auth type from request body
   * @returns {String} - Normalized auth type
   */
  normalizeAuthType(type) {
    return (type || '').toLowerCase().replace(/_/g, '-');
  }

  /**
   * Applies authentication headers to an HTTP request config
   * @param {Object} headers - HTTP headers object
   * @param {Object} auth - Authentication configuration (optional)
   * @returns {Boolean} - Whether auth headers were applied
   */
  applyAuthHeaders(headers, auth) {
    if (!auth) {
      return false;
    }
    const authType = this.normalizeAuthType(auth.type);

    if (authType === 'bearer' && auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
      return true;
    }
    if ((authType === 'mcp-api-key' || authType === 'x-mcp-api-key') && auth.key) {
      headers['X-MCP-API-Key'] = auth.key;
      return true;
    }
    if (authType === 'api-key' && auth.key) {
      headers['X-API-Key'] = auth.key;
      return true;
    }
    if (authType === 'basic' && auth.username && auth.password) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      return true;
    }

    winston.warn(`MCP auth type not recognized or incomplete: "${auth.type}"`);
    return false;
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
   * Parses an MCP HTTP response body (JSON, SSE, or empty)
   * @param {*} data - Response body
   * @returns {Object|null} - Parsed JSON object, or null for empty bodies
   */
  parseResponseBody(data) {
    if (data === '' || data == null) {
      return null;
    }
    if (typeof data === 'string') {
      if (!data.trim()) {
        return null;
      }
      return this.parseSSEResponse(data);
    }
    return data;
  }

  /**
   * Sends the MCP initialized notification required by session-based servers
   * (Streamable HTTP transport). Skipped for stateless servers with no session ID.
   * @param {String} url - MCP server URL
   * @param {Object} auth - Authentication configuration (optional)
   * @param {String} sessionId - Session ID from the initialize response
   */
  async sendInitializedNotification(url, auth, sessionId) {
    const config = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      data: {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      },
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    };

    this.applyAuthHeaders(config.headers, auth);

    const response = await axios(config);

    if (response.status >= 400) {
      const details = response.data ? ` - ${JSON.stringify(response.data)}` : '';
      throw new Error(`MCP initialized notification failed: HTTP ${response.status}${details}`);
    }

    const responseData = this.parseResponseBody(response.data);
    if (responseData?.error) {
      throw new Error(`MCP Error: ${responseData.error.message || 'Unknown error'} (code: ${responseData.error.code})`);
    }
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

    this.applyAuthHeaders(config.headers, auth);

    try {
      const response = await axios(config);

      if (response.status >= 400) {
        const details = response.data ? ` - ${JSON.stringify(response.data)}` : '';
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}${details}`);
      }

      // Capture session ID from response headers (if present)
      const sessionIdFromHeader = response.headers['mcp-session-id'] ||
                                  response.headers['x-mcp-session-id'];

      // Notifications and empty responses (e.g. 202 Accepted)
      if (response.status === 202 || response.data === '' || response.data == null) {
        const result = { status: response.status };
        if (sessionIdFromHeader) {
          result.sessionId = sessionIdFromHeader;
        }
        return result;
      }

      // Parse response: could be SSE (text/event-stream) or direct JSON
      let responseData = this.parseResponseBody(response.data);
      if (!responseData) {
        responseData = { status: response.status };
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
            protocolVersion: '2025-03-26',
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
          winston.info(`MCP Server ${serverId} session initialized with ID: ${sessionId}`);
          // Session-based servers (Streamable HTTP) require this notification before any other request
          await this.sendInitializedNotification(serverConfig.url, serverConfig.auth, sessionId);
          winston.info(`MCP Server ${serverId} sent notifications/initialized`);
        } else {
          winston.info(`MCP Server ${serverId} initialized (stateless, no session ID required)`);
        }
      } catch (initError) {
        winston.error(`MCP Server ${serverId} initialization failed: ${initError.message}`);
        throw initError;
      }

      // Save connection in cache with session ID
      this.connections.set(serverId, {
        config: serverConfig,
        sessionId: sessionId,
        initialized: true,
        sessionReady: true,
        capabilities: initializeResponse.result?.capabilities || {}
      });

      winston.info(`MCP Server ready: ${serverId}${sessionId ? ` (session: ${sessionId})` : ' (stateless)'}`);
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
      winston.info(`MCP listTools request for ${serverId}`);

      // Check if server is already initialized
      let connection = this.connections.get(serverId);
      if (!connection || (connection.sessionId && !connection.sessionReady)) {
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
        // Fallback for stateless servers that reject session IDs
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
      winston.info(`MCP Server ${serverId} returned ${tools.length} tools`);
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
