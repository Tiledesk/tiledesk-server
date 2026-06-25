'use strict';

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const winston = require('../config/winston');
const cacheUtil = require('../utils/cacheUtil');
const Integration = require('../models/integrations');
const integrationEvent = require('../event/integrationEvent');

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
   * Normalizes auth.type to a canonical value
   * Accepts: mcp_api_key, X-MCP-API-Key, x-mcp-api-key, etc.
   * @param {String} type - Auth type from request body
   * @returns {String} - Normalized auth type
   */
  normalizeAuthType(type) {
    return (type || '').toLowerCase().replace(/_/g, '-');
  }

  /**
   * Applies custom headers from the client payload: [{ key, value }] or [{ name, value }]
   * @param {Object} headers - HTTP headers object
   * @param {Array} customHeaders - Custom headers array
   * @returns {Boolean} - Whether any header was applied
   */
  applyCustomHeaders(headers, customHeaders) {
    if (!Array.isArray(customHeaders)) {
      return false;
    }

    let applied = false;
    for (const header of customHeaders) {
      const name = header.key || header.name || header.headerName;
      const value = header.value ?? header.headerValue;
      if (name && value != null && value !== '') {
        headers[name] = value;
        applied = true;
      }
    }
    return applied;
  }

  /**
   * Applies customHeaders and/or legacy auth config to outgoing MCP requests
   * @param {Object} headers - HTTP headers object
   * @param {Object} serverConfig - { auth?, customHeaders? }
   * @returns {Boolean} - Whether any header was applied
   */
  applyRequestHeaders(headers, serverConfig) {
    if (!serverConfig) {
      return false;
    }

    const fromCustom = this.applyCustomHeaders(headers, serverConfig.customHeaders);
    const fromAuth = serverConfig.auth ? this.applyAuthHeaders(headers, serverConfig.auth) : false;
    return fromCustom || fromAuth;
  }

  /**
   * Builds serverConfig from the client request body
   * @param {String} projectId - Tiledesk project ID
   * @param {Object} body - Request body
   * @returns {Object} - Normalized server configuration
   */
  buildServerConfig(projectId, body) {
    const { url, auth, customHeaders, oauth } = body;

    if (!url) {
      throw new Error("Missing required parameter 'url'");
    }

    const hasCustomHeaders = Array.isArray(customHeaders) && customHeaders.length > 0;
    const hasAuth = auth && typeof auth === 'object' && Object.keys(auth).length > 0;
    const hasOAuth = oauth && typeof oauth === 'object' && (
      oauth.clientId || oauth.clientSecret || oauth.redirectUrl || oauth.scope
    );

    if (hasOAuth && !hasCustomHeaders && !hasAuth) {
      throw new Error('OAuth2 authentication is not supported yet. Use customHeaders instead.');
    }

    if (hasOAuth) {
      winston.warn('MCP OAuth2 config received but not supported yet; ignoring oauth object');
    }

    return {
      url,
      projectId,
      auth: hasAuth ? auth : undefined,
      customHeaders: hasCustomHeaders ? customHeaders : undefined
    };
  }

  /**
   * Applies authentication headers to an HTTP request config (legacy auth object).
   * Supports predefined types and generic custom headers (headerName/headerValue).
   * @param {Object} headers - HTTP headers object
   * @param {Object} auth - Authentication configuration (optional)
   * @returns {Boolean} - Whether auth headers were applied
   */
  applyAuthHeaders(headers, auth) {
    if (!auth) {
      return false;
    }

    // Generic custom header — matches UI "header name" / "header value" fields
    if (auth.headerName && auth.headerValue != null && auth.headerValue !== '') {
      headers[auth.headerName] = auth.headerValue;
      return true;
    }
    if (auth.name && auth.value != null && auth.value !== '') {
      headers[auth.name] = auth.value;
      return true;
    }

    const hasCredentials = !!(auth.token || auth.key || auth.username || auth.password);
    if (!auth.type && !hasCredentials) {
      return false;
    }

    const authType = this.normalizeAuthType(auth.type);

    if (authType === 'custom') {
      if (Array.isArray(auth.headers)) {
        let applied = false;
        for (const header of auth.headers) {
          const name = header.key || header.name || header.headerName;
          const value = header.value ?? header.headerValue;
          if (name && value != null && value !== '') {
            headers[name] = value;
            applied = true;
          }
        }
        return applied;
      }
      return false;
    }

    if (authType === 'bearer') {
      const token = auth.token || auth.key;
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        return true;
      }
    }
    if ((authType === 'mcp-api-key' || authType === 'x-mcp-api-key') && auth.key) {
      headers['X-MCP-API-Key'] = auth.key;
      return true;
    }
    if ((authType === 'api-key' || authType === 'x-api-key') && auth.key) {
      headers['X-API-Key'] = auth.key;
      return true;
    }
    if (authType === 'basic' && auth.username && auth.password) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      return true;
    }

    if (auth.type || hasCredentials) {
      winston.warn(`MCP auth type not recognized or incomplete: "${auth.type}"`);
    }
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
   * Sends an initialize request, retrying with an older protocol version if needed
   * @param {String} url - MCP server URL
   * @param {Object} auth - Authentication configuration (optional)
   * @returns {Promise<Object>} - Initialize response
   */
  async sendInitializeRequest(serverConfig) {
    const protocolVersions = ['2025-03-26', '2024-11-05'];
    let lastError = null;

    for (const protocolVersion of protocolVersions) {
      try {
        return await this.sendJSONRPCRequest(serverConfig.url, {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'initialize',
          params: {
            protocolVersion,
            capabilities: {
              tools: {}
            },
            clientInfo: {
              name: 'tiledesk-server',
              version: '1.0.0'
            }
          }
        }, serverConfig, null);
      } catch (error) {
        lastError = error;
        const isProtocolError = error.message && (
          error.message.includes('protocol version') ||
          error.message.includes('Unsupported protocol') ||
          error.message.includes('code: -32602')
        );
        if (!isProtocolError) {
          throw error;
        }
        winston.debug(`MCP initialize failed with protocolVersion ${protocolVersion}, trying fallback`);
      }
    }

    throw lastError;
  }

  /**
   * Sends notifications/initialized when the server uses sessions.
   * Best-effort: some servers require it (Streamable HTTP), others ignore or reject it.
   * @returns {Promise<Boolean>} - true if notification was accepted
   */
  async sendInitializedNotification(serverConfig, sessionId) {
    const config = {
      method: 'POST',
      url: serverConfig.url,
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

    this.applyRequestHeaders(config.headers, serverConfig);

    try {
      const response = await axios(config);

      if (response.status >= 400) {
        return false;
      }

      const responseData = this.parseResponseBody(response.data);
      if (responseData?.error) {
        return false;
      }

      return true;
    } catch (error) {
      winston.debug(`MCP notifications/initialized failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends a JSON-RPC request to an MCP server
   * @param {String} url - MCP server URL
   * @param {Object} request - JSON-RPC request
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth?, customHeaders? }
   * @param {String} sessionId - Session ID for the MCP server (optional)
   * @returns {Promise<Object>} - Server response (includes sessionId if present in headers)
   */
  async sendJSONRPCRequest(url, request, serverConfig, sessionId) {
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

    this.applyRequestHeaders(config.headers, serverConfig);

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

  async resolveNativeServerConfig(nativeId, projectId) {
    const native = await this.getNativeServerById(nativeId);
    if (!native) {
      const error = new Error(`Native MCP server '${nativeId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return {
      url: native.url,
      projectId,
      transport: native.transport,
      auth: native.auth || undefined
    };
  }

  formatToolsForIntegration(tools) {
    return (tools || []).map((tool) => ({
      name: tool.name,
      description: tool.description || ''
    }));
  }

  formatSelectedTools(selectedTools) {
    return (selectedTools || []).map((tool) => ({
      name: typeof tool === 'string' ? tool : tool.name
    })).filter((tool) => tool.name);
  }

  findServerIndex(servers, entry) {
    if (entry.type === 'native') {
      return servers.findIndex((server) => server.type === 'native' && server.nativeId === entry.nativeId);
    }

    return servers.findIndex((server) => {
      const isCustom = server.type === 'custom' || !server.type;
      return isCustom && server.url === entry.url;
    });
  }

  async normalizeMcpServerEntry(serverEntry, projectId) {
    if (!serverEntry) {
      throw new Error('MCP server entry is missing or invalid');
    }

    const type = serverEntry.type || (serverEntry.nativeId ? 'native' : 'custom');

    if (type === 'native') {
      if (!serverEntry.nativeId) {
        throw new Error("Missing required field 'nativeId'");
      }

      const native = await this.getNativeServerById(serverEntry.nativeId);
      if (!native) {
        const error = new Error(`Native MCP server '${serverEntry.nativeId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      let tools = serverEntry.tools;
      if (!tools || !tools.length) {
        const serverConfig = await this.resolveNativeServerConfig(serverEntry.nativeId, projectId);
        tools = await this.listTools(serverConfig);
      }

      return {
        type: 'native',
        nativeId: native.id,
        name: native.name,
        transport: native.transport,
        tools: this.formatToolsForIntegration(tools),
        selectedTools: this.formatSelectedTools(serverEntry.selectedTools)
      };
    }

    if (!serverEntry.url) {
      throw new Error("Missing required field 'url'");
    }

    let tools = serverEntry.tools;
    if (!tools || !tools.length) {
      tools = await this.listTools({
        url: serverEntry.url,
        projectId,
        auth: serverEntry.auth || undefined
      });
    }

    return {
      type: 'custom',
      name: serverEntry.name || serverEntry.url,
      url: serverEntry.url,
      transport: serverEntry.transport || 'streamable_http',
      customHeaders: serverEntry.customHeaders || [],
      tools: this.formatToolsForIntegration(tools),
      selectedTools: this.formatSelectedTools(serverEntry.selectedTools)
    };
  }

  async upsertMcpServerInIntegration(projectId, serverEntry) {
    const normalized = await this.normalizeMcpServerEntry(serverEntry, projectId);

    let integration = await Integration.findOne({ id_project: projectId, name: 'mcp' });

    if (!integration) {
      integration = new Integration({
        id_project: projectId,
        name: 'mcp',
        value: { servers: [normalized] }
      });
    } else {
      const servers = Array.isArray(integration.value?.servers) ? [...integration.value.servers] : [];
      const index = this.findServerIndex(servers, normalized);

      if (index >= 0) {
        servers[index] = normalized;
      } else {
        servers.push(normalized);
      }

      integration.value = {
        ...integration.value,
        servers
      };
      integration.markModified('value');
    }

    const savedIntegration = await integration.save();
    const integrations = await Integration.find({ id_project: projectId });
    integrationEvent.emit('integration.update', integrations, projectId);

    return {
      integration: savedIntegration,
      server: normalized
    };
  }

  /**
   * Connects to an MCP server and returns capabilities + tools
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth? }
   * @returns {Promise<Object>} - { capabilities, tools }
   */
  async connectServer(serverConfig) {
    const result = await this.initializeServer(serverConfig);
    const tools = await this.listTools(serverConfig);

    return {
      capabilities: result?.capabilities || {},
      tools
    };
  }

  /**
   * Initializes a connection to an MCP server
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth?, customHeaders? }
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
        const response = await this.sendInitializeRequest(serverConfig);

        // Session ID is returned in 'mcp-session-id' header from response
        sessionId = response.sessionId || null;
        initializeResponse = response;

        if (sessionId) {
          winston.info(`MCP Server ${serverId} session initialized with ID: ${sessionId}`);
          const notificationAccepted = await this.sendInitializedNotification(
            serverConfig,
            sessionId
          );
          if (notificationAccepted) {
            winston.info(`MCP Server ${serverId} sent notifications/initialized`);
          } else {
            winston.warn(`MCP Server ${serverId} notifications/initialized not accepted (continuing)`);
          }
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
   * @param {Object} serverConfig - MCP server configuration { url, projectId?, auth?, customHeaders? }
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
        }, serverConfig, sessionId);
      } catch (error) {
        // Fallback for stateless servers that reject session IDs
        if (sessionId && error.message && error.message.includes('No valid session ID')) {
          winston.debug(`Retrying tools/list without session ID for server ${serverId}...`);
          response = await this.sendJSONRPCRequest(serverConfig.url, {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list',
            params: {}
          }, serverConfig, null);
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
