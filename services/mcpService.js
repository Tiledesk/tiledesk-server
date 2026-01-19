'use strict';

const axios = require('axios').default;
const winston = require('../config/winston');

/**
 * MCP Service - Gestisce le connessioni e le chiamate ai server MCP
 * MCP (Model Context Protocol) usa JSON-RPC 2.0 per comunicare
 */
class MCPService {

  constructor() {
    this.connections = new Map(); // Cache delle connessioni ai server MCP { serverId: { config, sessionId?, initialized, capabilities } }
  }

  /**
   * Parsa una risposta in formato SSE (Server-Sent Events) e estrae l'oggetto JSON
   * @param {String} sseData - Stringa con formato SSE
   * @returns {Object} - Oggetto JSON parsato
   */
  parseSSEResponse(sseData) {
    const lines = sseData.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6); // Rimuove "data: "
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
   * Invia una richiesta JSON-RPC a un server MCP
   * @param {String} url - URL del server MCP
   * @param {Object} request - Richiesta JSON-RPC
   * @param {Object} auth - Configurazione di autenticazione (opzionale)
   * @param {String} sessionId - Session ID per il server MCP (opzionale)
   * @returns {Promise<Object>} - Risposta del server (include sessionId se presente negli header)
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
      timeout: 30000, // 30 secondi di timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accetta anche 4xx per catturare gli header
      }
    };

    // Aggiungi session ID nell'header mcp-session-id se presente
    if (sessionId) {
      config.headers['mcp-session-id'] = sessionId;
    }

    // Aggiungi autenticazione se presente
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

      // Cattura il session ID dagli header della risposta (se presente)
      const sessionIdFromHeader = response.headers['mcp-session-id'] || 
                                  response.headers['x-mcp-session-id'];

      // Parsa la risposta: potrebbe essere SSE (text/event-stream) o JSON diretto
      let responseData;
      if (typeof response.data === 'string') {
        // Formato SSE: estrae il JSON dalla riga "data:"
        responseData = this.parseSSEResponse(response.data);
      } else {
        // Risposta JSON già parsata
        responseData = response.data;
      }

      // Aggiungi il session ID dalla risposta se presente negli header
      if (sessionIdFromHeader) {
        responseData.sessionId = sessionIdFromHeader;
      }

      // Verifica se c'è un errore JSON-RPC
      if (responseData.error) {
        throw new Error(`MCP Error: ${responseData.error.message || 'Unknown error'} (code: ${responseData.error.code})`);
      }

      return responseData;
    } catch (error) {
      if (error.response) {
        // Errore HTTP
        const status = error.response.status;
        const statusText = error.response.statusText;
        const responseData = error.response.data;
        const errorMessage = `HTTP Error ${status}: ${statusText}`;
        const details = responseData ? ` - ${JSON.stringify(responseData)}` : '';
        throw new Error(`${errorMessage}${details}`);
      } else if (error.request) {
        // Nessuna risposta ricevuta
        throw new Error(`No response from MCP server: ${error.message}`);
      } else {
        // Errore nella configurazione della richiesta
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  async initializeSession(server_url, auth) {
    try {
      // Chiamata JSON-RPC per inizializzare la sessione
      const response = await this.sendJSONRPCRequest(server_url, {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'tiledesk-server',
            version: '1.0.0'
          }
        }
      }, auth, null);

      // Il session ID viene restituito nell'header 'mcp-session-id' dalla risposta
      // ed è stato già aggiunto a response.sessionId dalla funzione sendJSONRPCRequest
      if (response.sessionId) {
        return response.sessionId;
      }

      // Se non c'è session ID, il server potrebbe non richiederlo (stateless)
      // Ritorniamo null invece di lanciare un errore
      return null;
    } catch (error) {
      // Se l'inizializzazione fallisce, potremmo non aver bisogno di session ID
      // Rilanciamo l'errore ma sarà gestito dal chiamante
      throw error;
    }
  }



  /**
   * Inizializza una connessione a un server MCP
   * @param {Object} serverConfig - Configurazione del server MCP { name, url, transport, auth? }
   * @returns {Promise<Object>} - Risultato dell'inizializzazione
   */
  async initializeServer(serverConfig) {
    if (!serverConfig || !serverConfig.url) {
      throw new Error('Server MCP configuration is missing or invalid');
    }

    const serverId = serverConfig.name || serverConfig.url;

    try {
      // Prova prima ad inizializzare la sessione (alcuni server MCP richiedono session ID)
      let sessionId = null;
      try {
        sessionId = await this.initializeSession(serverConfig.url, serverConfig.auth);
        if (sessionId) {
          winston.debug(`MCP Server ${serverId} session initialized with ID: ${sessionId}`);
        } else {
          winston.debug(`MCP Server ${serverId} initialized (stateless, no session ID required)`);
        }
      } catch (initError) {
        // Se l'inizializzazione fallisce, proviamo comunque senza session ID
        // (alcuni server MCP non richiedono session ID)
        winston.debug(`MCP Server ${serverId} initialization failed, proceeding without session ID: ${initError.message}`);
      }

      // Chiamata JSON-RPC per inizializzare il server (per ottenere capabilities)
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
      }, serverConfig.auth, sessionId);

      // Se abbiamo ricevuto un session ID nella risposta, usiamolo
      if (response.sessionId && !sessionId) {
        sessionId = response.sessionId;
      }

      // Salva la connessione nella cache con il session ID
      this.connections.set(serverId, {
        config: serverConfig,
        sessionId: sessionId,
        initialized: true,
        capabilities: response.result?.capabilities || {}
      });

      winston.info(`MCP Server initialized: ${serverId}${sessionId ? ` (session: ${sessionId})` : ' (stateless)'}`);
      return response.result;
    } catch (error) {
      winston.error(`Error initializing MCP server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene la lista dei tool disponibili da un server MCP
   * @param {Object} serverConfig - Configurazione del server MCP
   * @returns {Promise<Array>} - Lista dei tool disponibili
   */
  async listTools(serverConfig) {
    if (!serverConfig || !serverConfig.url) {
      throw new Error('Server MCP configuration is missing or invalid');
    }

    const serverId = serverConfig.name || serverConfig.url;

    try {
      // Verifica se il server è già inizializzato
      let connection = this.connections.get(serverId);
      if (!connection) {
        await this.initializeServer(serverConfig);
        connection = this.connections.get(serverId);
      }

      const sessionId = connection?.sessionId || null;

      // Chiamata JSON-RPC per ottenere la lista dei tool
      // Se il server richiede session ID ma non ce l'abbiamo, proviamo prima senza
      let response;
      try {
        response = await this.sendJSONRPCRequest(serverConfig.url, {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        }, serverConfig.auth, sessionId);
      } catch (error) {
        // Se fallisce e abbiamo un errore "No valid session ID", proviamo senza session ID
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
   * Rimuove una connessione dalla cache
   * @param {String} serverId - ID del server
   */
  removeConnection(serverId) {
    this.connections.delete(serverId);
  }

  /**
   * Pulisce tutte le connessioni dalla cache
   */
  clearConnections() {
    this.connections.clear();
  }
}

// Singleton instance
const mcpService = new MCPService();

module.exports = mcpService;

